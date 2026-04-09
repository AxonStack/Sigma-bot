import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedMarket {
  question: string;
  description: string;
  endTime: number;
  resolutionSource: string;
  category: string;
}

type GeneratedMarketResult = GeneratedMarket & {
  resolvable: boolean;
  reason?: string;
};

@Injectable()
export class MarketGenerationService {
  private readonly logger = new Logger(MarketGenerationService.name);

  constructor(private readonly config: ConfigService) {}

  async generateFromPrompt(prompt: string): Promise<GeneratedMarketResult> {
    const preferOauth = this.getBooleanConfig('USE_LOCAL_OAUTH');
    const oauthAvailable = this.hasOauthConfig();
    const openAiCompatibleAvailable = this.hasOpenAiCompatibleConfig();

    if (preferOauth && oauthAvailable) {
      try {
        return await this.generateViaOauth(prompt);
      } catch (err) {
        if (!openAiCompatibleAvailable) {
          throw this.toBadRequest(err);
        }
        this.logger.warn(
          `OAuth generation failed, falling back to OpenAI-compatible endpoint: ${this.extractApiError(err)}`,
        );
        return this.generateViaOpenAiCompatible(prompt);
      }
    }

    if (openAiCompatibleAvailable) {
      try {
        return await this.generateViaOpenAiCompatible(prompt);
      } catch (err) {
        if (!oauthAvailable) {
          throw this.toBadRequest(err);
        }
        this.logger.warn(
          `OpenAI-compatible generation failed, falling back to OAuth: ${this.extractApiError(err)}`,
        );
        return this.generateViaOauth(prompt);
      }
    }

    if (oauthAvailable) {
      return this.generateViaOauth(prompt);
    }

    throw new BadRequestException(
      'AI Generation Failed: no valid LLM configuration found. Set LLM_ENDPOINT and LLM_API_KEY, or enable local OAuth correctly.',
    );
  }

  async chat(prompt: string): Promise<string> {
    const preferOauth = this.getBooleanConfig('USE_LOCAL_OAUTH');
    const oauthAvailable = this.hasOauthConfig();
    const openAiCompatibleAvailable = this.hasOpenAiCompatibleConfig();

    if (preferOauth && oauthAvailable) {
      try {
        return await this.chatViaOauth(prompt);
      } catch (err) {
        if (!openAiCompatibleAvailable) throw err;
        this.logger.warn(
          `OAuth chat failed, falling back to OpenAI-compatible endpoint: ${this.extractApiError(err)}`,
        );
        return this.chatViaOpenAiCompatible(prompt);
      }
    }

    if (openAiCompatibleAvailable) {
      try {
        return await this.chatViaOpenAiCompatible(prompt);
      } catch (err) {
        if (!oauthAvailable) throw err;
        this.logger.warn(
          `OpenAI-compatible chat failed, falling back to OAuth: ${this.extractApiError(err)}`,
        );
        return this.chatViaOauth(prompt);
      }
    }

    if (oauthAvailable) {
      return this.chatViaOauth(prompt);
    }

    throw new BadRequestException(
      'AI chat failed: no valid LLM configuration found. Set LLM_ENDPOINT and LLM_API_KEY, or enable local OAuth correctly.',
    );
  }

  private async generateViaOauth(prompt: string): Promise<GeneratedMarketResult> {
    const model = this.getStringConfig('LLM_MODEL') || 'gemini-1.5-flash';
    const { authHeader, gcpProject } = await this.getOauthCredentials();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await axios.post(
      endpoint,
      {
        systemInstruction: {
          parts: [
            {
              text: `You are an expert prediction market architect on the Base network.
              Your goal is to judge if a user's question can be objectively verified and then generate market parameters.

              Guidelines:
              1. FIRST, judge if the question is 'resolvable' (can objectively be verified by a neutral third-party source AFTER the event occurs).
              2. Do NOT reject an event just because it is in the future.
              3. The 'question' must be binary (Yes/No) and extremely clear.
              4. The 'description' should define specific resolution criteria and edge cases.
              5. The 'resolutionSource' must be a reliable, public website or API.
              6. Calculate 'endTime' precisely as the Unix timestamp (in seconds) when the event is expected to be finalized.

              OUTPUT FORMAT:
              You MUST respond with a valid JSON object matching this schema:
              {
                "resolvable": boolean,
                "reason": string (if not resolvable),
                "question": string,
                "description": string,
                "endTime": number (Unix timestamp),
                "resolutionSource": string,
                "category": "crypto" | "sports" | "politics" | "entertainment" | "other"
              }

              Current Time: ${new Date().toISOString()}`,
            },
          ],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      },
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'x-goog-user-project': gcpProject,
        },
      },
    );

    const data = JSON.parse(response.data.candidates[0].content.parts[0].text);
    return this.ensureFutureEndTime(data);
  }

  private async generateViaOpenAiCompatible(prompt: string): Promise<GeneratedMarketResult> {
    const model = this.getStringConfig('LLM_MODEL') || 'openai/gpt-4o';
    const endpoint =
      this.getStringConfig('LLM_ENDPOINT') || 'https://api.openai.com/v1/chat/completions';
    const apiKey = this.getStringConfig('LLM_API_KEY');

    const response = await axios.post(
      endpoint,
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert prediction market architect.
            Respond in JSON format using this exact schema:
            {
              "resolvable": boolean,
              "reason": string (if not resolvable),
              "question": string,
              "description": string,
              "endTime": number (Unix timestamp in seconds),
              "resolutionSource": string,
              "category": "crypto" | "sports" | "politics" | "entertainment" | "other"
            }
            Return "resolvable": true if the question is binary (Yes/No) and can be objectively verified by public news or data AT THE TIME THE EVENT CONCLUDES.
            Do not reject events just because they are in the future; our system will resolve them when the time comes.

            Calculate "endTime" precisely as the Unix timestamp (in seconds) when the event is expected to be finalized.

            Current Time: ${new Date().toISOString()}`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: Number(this.getStringConfig('LLM_MAX_TOKENS')) || 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = JSON.parse(response.data.choices[0].message.content);
    return this.ensureFutureEndTime(data);
  }

  private async chatViaOauth(prompt: string): Promise<string> {
    const model = this.getStringConfig('LLM_MODEL') || 'gemini-1.5-flash';
    const { authHeader, gcpProject } = await this.getOauthCredentials();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await axios.post(
      endpoint,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      },
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'x-goog-user-project': gcpProject,
        },
      },
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async chatViaOpenAiCompatible(prompt: string): Promise<string> {
    const model = this.getStringConfig('LLM_MODEL') || 'openai/gpt-4o';
    const endpoint =
      this.getStringConfig('LLM_ENDPOINT') || 'https://api.openai.com/v1/chat/completions';
    const apiKey = this.getStringConfig('LLM_API_KEY');

    const response = await axios.post(
      endpoint,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Number(this.getStringConfig('LLM_MAX_TOKENS')) || 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  private async getOauthCredentials(): Promise<{ authHeader: string; gcpProject: string }> {
    const clientId = this.getStringConfig('OAUTH_CLIENT_ID');
    const clientSecret = this.getStringConfig('OAUTH_CLIENT_SECRET');
    const tokenPath = path.join(process.cwd(), 'google_credentials.json');

    if (!clientId || !clientSecret) {
      throw new Error('Missing local OAuth client configuration.');
    }

    if (!fs.existsSync(tokenPath)) {
      throw new Error('google_credentials.json missing. Run oauth-login.js first.');
    }

    const client = new OAuth2Client(clientId, clientSecret);
    const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    client.setCredentials(tokens);

    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error('Failed to retrieve access token.');
    }

    const gcpProject =
      this.getStringConfig('GCP_PROJECT_ID') || clientId.split('-')[0] || '';

    this.logger.log(`Using Local OAuth 2.0 (Project: ${gcpProject})`);
    return { authHeader: `Bearer ${token}`, gcpProject };
  }

  private hasOauthConfig(): boolean {
    return Boolean(this.getStringConfig('OAUTH_CLIENT_ID') && this.getStringConfig('OAUTH_CLIENT_SECRET'));
  }

  private hasOpenAiCompatibleConfig(): boolean {
    return Boolean(this.getStringConfig('LLM_ENDPOINT') && this.getStringConfig('LLM_API_KEY'));
  }

  private getStringConfig(key: string): string {
    return (this.config.get<string>(key) ?? '').trim();
  }

  private getBooleanConfig(key: string): boolean {
    return this.getStringConfig(key).toLowerCase() === 'true';
  }

  private extractApiError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as
        | { error?: { message?: string } | string; message?: string }
        | undefined;

      if (typeof data?.error === 'string') return data.error;
      if (typeof data?.error === 'object' && data?.error?.message) return data.error.message;
      if (typeof data?.message === 'string') return data.message;
      return err.message;
    }

    if (err instanceof Error) {
      return err.message;
    }

    return 'Unknown generation error';
  }

  private toBadRequest(err: unknown): BadRequestException {
    const apiError = this.extractApiError(err);
    this.logger.error(`Generation Failed: ${apiError}`);
    return new BadRequestException(`AI Generation Failed: ${apiError}`);
  }

  private ensureFutureEndTime(data: Record<string, unknown>): GeneratedMarketResult {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(data.endTime ?? 0);

    return {
      resolvable: Boolean(data.resolvable),
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      question: typeof data.question === 'string' ? data.question : '',
      description: typeof data.description === 'string' ? data.description : '',
      endTime: endTime > now ? endTime : now + 86400 * 7,
      resolutionSource:
        typeof data.resolutionSource === 'string' ? data.resolutionSource : '',
      category: typeof data.category === 'string' ? data.category : 'other',
    };
  }
}
