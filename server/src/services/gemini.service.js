/**
 * gemini.service.js
 *
 * Facade service for Gemini AI operations.
 * Delegates to the hardened Phase 12 GeminiClient with:
 * - 15-second timeout
 * - Transient-only retries
 * - Sensitive token masking
 * - Clean JSON response parsing
 */

import { geminiClient, sanitizePromptInput, wrapDataBoundary } from './ai/gemini-client.js';
import { AI_CONFIG } from '../config/ai.config.js';
import { logger } from '../utils/logger.js';

class GeminiService {
  constructor() {
    this.client = geminiClient;
  }

  isConfigured() {
    return this.client.isConfigured();
  }

  /**
   * Generates content using Google GenAI SDK with timeout, retry backoff, and structured JSON parsing.
   *
   * @param {Object} options
   * @param {string} options.prompt - Prompt content
   * @param {string} [options.systemInstruction] - System instruction defining AI boundaries
   * @param {boolean} [options.expectJson] - Whether output should be parsed as JSON
   * @param {string} [options.model] - Override model name
   * @param {number} [options.maxOutputTokens] - Override max output tokens
   * @returns {Promise<Object|string>}
   */
  async generateContent({ prompt, systemInstruction = '', expectJson = true, model = null, maxOutputTokens = null }) {
    const rawText = await this.client.generateContent({
      prompt,
      systemInstruction,
      expectJson,
      model
    });

    if (expectJson) {
      try {
        let cleanJson = rawText;
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(cleanJson);
      } catch (jsonErr) {
        logger.warn(`Failed to parse AI response as JSON: ${jsonErr.message}`, { rawText });
        const parseErr = new Error(`Failed to parse AI response as JSON: ${jsonErr.message}`);
        parseErr.code = AI_CONFIG.errorCodes.INVALID_RESPONSE;
        parseErr.statusCode = 502;
        parseErr.raw = rawText;
        throw parseErr;
      }
    }

    return rawText;
  }
}

export const geminiService = new GeminiService();
export { sanitizePromptInput, wrapDataBoundary };
