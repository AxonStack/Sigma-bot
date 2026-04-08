import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedMarket {
  question: string;
  description: string;
  endTime: number; // Unix timestamp in seconds
  resolutionSource: string;
  category: string;
}

@Injectable()
export class MarketGenerationService {
  private readonly logger = new Logger(MarketGenerationService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Generates a structured prediction market from a user prompt.
   */
  async generateFromPrompt(prompt: string): Promise<GeneratedMarket & { resolvable: boolean; reason?: string }> {
    const useLocalOauth = this.config.get<string>('USE_LOCAL_OAUTH') === 'true';
    const model = this.config.get<string>('LLM_MODEL') || 'gemini-1.5-flash';
    let authHeader = '';
    let gcpProject = '';

    if (useLocalOauth) {
      try {
        const clientId = this.config.get<string>('OAUTH_CLIENT_ID');
        const clientSecret = this.config.get<string>('OAUTH_CLIENT_SECRET');
        const tokenPath = path.join(process.cwd(), 'google_credentials.json');
        
        if (!fs.existsSync(tokenPath)) {
          throw new Error('google_credentials.json missing. Run oauth-login.js first.');
        }

        const client = new OAuth2Client(clientId, clientSecret);
        const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        client.setCredentials(tokens);
        
        const { token } = await client.getAccessToken();
        if (!token) throw new Error('Failed to retrieve access token');
        
        authHeader = `Bearer ${token}`;
        const safeClientId = clientId || '';
        gcpProject = this.config.get<string>('GCP_PROJECT_ID') || safeClientId.split('-')[0];
        
        this.logger.log(`Using Local OAuth 2.0 (Project: ${gcpProject})`);
      } catch (err) {
        this.logger.error(`OAuth Auth Failed: ${err.message}`);
        throw err;
      }
    } else {
      authHeader = `Bearer ${this.config.get<string>('LLM_API_KEY')}`;
    }

    try {
      if (useLocalOauth) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
        const response = await axios.post(endpoint, {
          systemInstruction: {
            parts: [{
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
    
              Current Time: ${new Date().toISOString()}`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'x-goog-user-project': gcpProject,
          }
        });

        const data = JSON.parse(response.data.candidates[0].content.parts[0].text);
        return this.ensureFutureEndTime(data);
      } else {
        const endpoint = this.config.get<string>('LLM_ENDPOINT') || 'https://api.openai.com/v1/chat/completions';
        const response = await axios.post(endpoint, {
          model: model,
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
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: Number(this.config.get<string>('LLM_MAX_TOKENS')) || 1000,
        }, {
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        return this.ensureFutureEndTime(data);
      }
    } catch (err) {
      const apiError = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      this.logger.error(`Generation Failed: ${apiError}`);
      throw new BadRequestException(`AI Generation Failed: ${apiError}`);
    }
  }

  /**
   * Diagnostic chat method to verify LLM connectivity.
   */
  async chat(prompt: string): Promise<string> {
    const useLocalOauth = this.config.get<string>('USE_LOCAL_OAUTH') === 'true';
    const model = this.config.get<string>('LLM_MODEL') || 'gemini-1.5-flash';
    let authHeader = '';
    let gcpProject = '';

    if (useLocalOauth) {
      const clientId = this.config.get<string>('OAUTH_CLIENT_ID');
      const clientSecret = this.config.get<string>('OAUTH_CLIENT_SECRET');
      const tokenPath = path.join(process.cwd(), 'google_credentials.json');
      
      const client = new OAuth2Client(clientId, clientSecret);
      const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      client.setCredentials(tokens);
      const { token } = await client.getAccessToken();
      authHeader = `Bearer ${token}`;
      const safeClientId = clientId || '';
      gcpProject = this.config.get<string>('GCP_PROJECT_ID') || safeClientId.split('-')[0];
    } else {
      authHeader = `Bearer ${this.config.get<string>('LLM_API_KEY')}`;
    }

    if (useLocalOauth) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await axios.post(endpoint, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'x-goog-user-project': gcpProject,
        }
      });
      return response.data.candidates[0].content.parts[0].text;
    } else {
      const endpoint = this.config.get<string>('LLM_ENDPOINT') || 'https://api.openai.com/v1/chat/completions';
      const response = await axios.post(endpoint, {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Number(this.config.get<string>('LLM_MAX_TOKENS')) || 1000,
      }, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });
      return response.data.choices[0].message.content;
    }
  }

  private ensureFutureEndTime(data: any) {
    const now = Math.floor(Date.now() / 1000);
    if (data.endTime <= now) {
      data.endTime = now + 86400 * 7;
    }
    return data;
  }
}
