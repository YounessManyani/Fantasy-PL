import { Player } from '../../types';
import { IOpenAIClientService } from './openai-client.service';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('LLMManager');

export interface ILLMManagerService {
  resolvePlayerName(rawName: string, candidates: Player[], clubHint?: string): Promise<Player | null>;
}

export class LLMManagerService implements ILLMManagerService {
  constructor(private openaiClient: IOpenAIClientService) {}

  async resolvePlayerName(
    rawName: string,
    candidates: Player[],
    clubHint?: string
  ): Promise<Player | null> {
    if (!this.openaiClient.isAvailable()) {
      logger.warn('OpenAI client not available');
      return null;
    }

    try {
      const candidateList = candidates
        .map((c, i) => `${i}. ${c.playerName} | ${c.clubName} | ${c.position}`)
        .join('\n');

      const prompt = `
Match the input name to the best candidate from the list below.
Input: "${rawName}"${clubHint ? ` (Club hint: ${clubHint})` : ''}

Candidates:
${candidateList}

Return ONLY the index number (0-${candidates.length - 1}) or -1 if no match.`;

      const response = await this.openaiClient.chat([
        { role: 'system', content: 'You are a football player name matcher.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0,
        maxTokens: 10
      });

      if (!response.success || !response.content) {
        logger.error('LLM response failed', response.error);
        return null;
      }

      const index = parseInt(response.content.trim());

      if (index >= 0 && index < candidates.length) {
        logger.info(`LLM matched "${rawName}" to ${candidates[index].playerName}`);
        return candidates[index];
      }

      logger.debug('LLM returned no match', { index });
      return null;
    } catch (error: any) {
      logger.error('LLM resolution error', error);
      return null;
    }
  }
}