import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PNP_FACTORY_ABI } from '../abi/pnp-factory.abi';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MarketResolutionService {
  private readonly logger = new Logger(MarketResolutionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  @Interval(60_000) // Every minute
  async checkAndResolveMarkets(): Promise<void> {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const factoryAddress = this.config.get<string>('OPENBET_FACTORY_ADDRESS');
    const privateKey = this.config.get<string>('WALLET_PRIVATE_KEY');

    if (!rpcUrl || !factoryAddress || !privateKey || privateKey === '0x...') {
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    // 1. Fetch expired, unsettled markets from Supabase
    const { data: markets, error } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('market_address, question, resolution_source, market_endTime')
      .lt('market_endTime', now)
      // Note: Ideally you'd have a 'market_settled' column in DB, otherwise check onchain
      .limit(5);

    if (error || !markets?.length) return;

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, wallet);

    for (const market of markets) {
      try {
        const conditionId = toHexBytes32(market.market_address);
        
        // 2. Check if already settled on-chain
        const isSettled = await factory.marketSettled(conditionId);
        if (isSettled) continue;

        this.logger.log(`Resolving market: ${market.question}`);

        // 3. AI Verification
        const outcome = await this.verifyOutcome(market.question, market.resolution_source);
        
        if (outcome === 'INVALID') {
          this.logger.warn(`AI could not resolve market: ${market.question}`);
          continue;
        }

        // 4. Determine winning ID
        const winningTokenId = outcome === 'YES' 
          ? await factory.getYesTokenId(conditionId)
          : await factory.getNoTokenId(conditionId);

        this.logger.log(`Settling market ${market.question} with outcome ${outcome} (ID: ${winningTokenId})`);

        // 5. On-chain settlement
        const tx = await factory.settleMarket(conditionId, winningTokenId);
        await tx.wait();
        
        this.logger.log(`Market settled on-chain: ${tx.hash}`);
      } catch (err) {
        this.logger.error(`Failed to resolve market ${market.market_address}: ${err.message}`);
      }
    }
  }

  private async verifyOutcome(question: string, source: string): Promise<'YES' | 'NO' | 'INVALID'> {
    const useLocalOauth = this.config.get<string>('USE_LOCAL_OAUTH') === 'true';
    const model = this.config.get<string>('LLM_MODEL') || 'gemini-1.5-flash';
    let authHeader = '';
    let gcpProject = '';

    try {
      if (useLocalOauth) {
        const clientId = this.config.get<string>('OAUTH_CLIENT_ID');
        const clientSecret = this.config.get<string>('OAUTH_CLIENT_SECRET');
        const tokenPath = path.join(process.cwd(), 'google_credentials.json');
        
        if (!fs.existsSync(tokenPath)) {
          throw new Error('google_credentials.json missing');
        }

        const client = new OAuth2Client(clientId, clientSecret);
        const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        client.setCredentials(tokens);
        
        const { token } = await client.getAccessToken();
        if (!token) throw new Error('Token refresh failed');
        
        authHeader = `Bearer ${token}`;
        const safeClientId = clientId || '';
        gcpProject = this.config.get<string>('GCP_PROJECT_ID') || safeClientId.split('-')[0];
      } else {
        authHeader = `Bearer ${this.config.get<string>('LLM_API_KEY')}`;
      }

      if (useLocalOauth) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await axios.post(endpoint, {
          systemInstruction: {
            parts: [{
              text: `You are an AI oracle. Your job is to verify the outcome of prediction markets.
                    Respond ONLY with 'YES', 'NO', or 'INVALID'.`
            }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: `Question: ${question}\nSource: ${source}` }]
          }],
          generationConfig: { temperature: 0 }
        }, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'x-goog-user-project': gcpProject,
          }
        });

        const ans = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || '';
        if (ans.includes('YES')) return 'YES';
        if (ans.includes('NO')) return 'NO';
        return 'INVALID';
      } else {
        const endpoint = this.config.get<string>('LLM_ENDPOINT') || 'https://api.openai.com/v1/chat/completions';
        const response = await axios.post(endpoint, {
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are an AI oracle. Respond ONLY with YES, NO, or INVALID.`
            },
            { role: 'user', content: `Question: ${question}\nSource: ${source}` }
          ],
        }, {
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        const result = response.data.choices[0].message.content.trim().toUpperCase();
        if (result.includes('YES')) return 'YES';
        if (result.includes('NO')) return 'NO';
        return 'INVALID';
      }
    } catch (err) {
      this.logger.error(`Resolution Failed: ${err.message}`);
      return 'INVALID';
    }
  }
}

function toHexBytes32(value: string): string {
  if (!value) return '';
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  return '0x' + hex.padStart(64, '0').slice(-64);
}
