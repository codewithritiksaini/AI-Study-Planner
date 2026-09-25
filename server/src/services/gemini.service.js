import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { AI_CONFIG } from '../config/ai.config.js';

class GeminiService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  /**
   * Initializes the Google GenAI SDK client if GEMINI_API_KEY is configured.
   */
  initClient() {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.includes('placeholder')) {
      return null;
    }
    try {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      return this.client;
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err.message);
      this.client = null;
      return null;
    }
  }

  /**
   * Checks if Gemini is properly configured with an API key.
   */
  isConfigured() {
    if (!this.client) {
      this.initClient();
    }
    return Boolean(this.client && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder'));
  }

  /**
   * Generates content using Google GenAI SDK with timeout and structured JSON response formatting.
   *
   * @param {Object} options
   * @param {string} options.prompt - Prompt content
   * @param {string} [options.systemInstruction] - System instruction defining AI boundaries
   * @param {boolean} [options.expectJson] - Whether output should be parsed as JSON
   * @param {string} [options.model] - Override model name
   * @returns {Promise<Object|string>}
   */
  async generateContent({ prompt, systemInstruction = '', expectJson = true, model = null }) {
    if (!this.isConfigured()) {
      const error = new Error('Gemini API is not configured or API key is missing.');
      error.code = AI_CONFIG.errorCodes.CONFIG_ERROR;
      error.statusCode = 503;
      throw error;
    }

    const selectedModel = model || AI_CONFIG.model;

    // Build configuration
    const config = {
      temperature: AI_CONFIG.generationConfig.temperature,
      topP: AI_CONFIG.generationConfig.topP,
      maxOutputTokens: AI_CONFIG.generationConfig.maxOutputTokens
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (expectJson) {
      config.responseMimeType = 'application/json';
    }

    // Execute with timeout race
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutErr = new Error(`AI request timed out after ${AI_CONFIG.timeoutMs}ms`);
        timeoutErr.code = AI_CONFIG.errorCodes.TIMEOUT;
        timeoutErr.statusCode = 504;
        reject(timeoutErr);
      }, AI_CONFIG.timeoutMs);
    });

    try {
      const apiCall = this.client.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config
      });

      const response = await Promise.race([apiCall, timeoutPromise]);
      const rawText = response.text ? response.text.trim() : '';

      if (!rawText) {
        const emptyErr = new Error('Empty response received from AI model.');
        emptyErr.code = AI_CONFIG.errorCodes.INVALID_RESPONSE;
        emptyErr.statusCode = 502;
        throw emptyErr;
      }

      if (expectJson) {
        try {
          // Clean potential markdown fencing if present
          let cleanJson = rawText;
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          return JSON.parse(cleanJson);
        } catch (jsonErr) {
          const parseErr = new Error(`Failed to parse AI response as JSON: ${jsonErr.message}`);
          parseErr.code = AI_CONFIG.errorCodes.INVALID_RESPONSE;
          parseErr.statusCode = 502;
          parseErr.raw = rawText;
          throw parseErr;
        }
      }

      return rawText;
    } catch (err) {
      // Normalize errors
      if (err.code && Object.values(AI_CONFIG.errorCodes).includes(err.code)) {
        throw err;
      }

      const msg = err.message || '';
      const normalized = new Error(msg);

      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        normalized.code = AI_CONFIG.errorCodes.RATE_LIMITED;
        normalized.statusCode = 429;
      } else if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('api key')) {
        normalized.code = AI_CONFIG.errorCodes.AUTH_ERROR;
        normalized.statusCode = 502;
      } else {
        normalized.code = AI_CONFIG.errorCodes.PROVIDER_ERROR;
        normalized.statusCode = 502;
      }

      throw normalized;
    }
  }
}

export const geminiService = new GeminiService();
