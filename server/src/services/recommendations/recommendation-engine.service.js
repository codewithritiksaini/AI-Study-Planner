/**
 * recommendation-engine.service.js
 *
 * Master recommendation orchestrator for Phase 10.
 * Coordinates context gathering, deterministic candidate generation,
 * multi-factor priority ranking, explanation generation (with optional Gemini enhancement),
 * and lifecycle persistence.
 */

import { buildRecommendationContext } from './recommendation-context.service.js';
import { generateRecommendationCandidates } from './recommendation-rules.service.js';
import { rankAndFilterRecommendations } from './recommendation-priority.service.js';
import { enhanceExplanationWithAI } from './recommendation-explanation.service.js';
import { recommendationLifecycleService } from './recommendation-lifecycle.service.js';
import { recommendationConfig } from '../../config/recommendation.config.js';

export class RecommendationEngineService {
  /**
   * Retrieves active recommendations for the student.
   * If existing active recommendations are still fresh, returns them.
   * Otherwise, generates a fresh set, persists them, and returns.
   *
   * @param {string} userId - Student UUID
   * @param {Object} [options] - Optional filters and limits
   * @returns {Promise<Array<Object>>}
   */
  async getRecommendations(userId, options = {}) {
    // 1. Invalidate any stale recommendations
    await recommendationLifecycleService.validateFreshness(userId);

    // 2. Check for existing active recommendations
    const existing = await recommendationLifecycleService.getActiveRecommendations(userId, options);

    // If active recommendations exist and no force refresh requested, return existing
    if (existing.length > 0 && !options.forceRefresh) {
      return existing;
    }

    // 3. Otherwise generate fresh recommendations
    return await this.refreshRecommendations(userId, options);
  }

  /**
   * Forces regeneration of study recommendations directly from latest analytics.
   *
   * @param {string} userId - Student UUID
   * @param {Object} [options] - Optional limit and flags
   * @returns {Promise<Array<Object>>}
   */
  async refreshRecommendations(userId, options = {}) {
    const limit = Math.max(1, Math.min(10, Number(options.limit) || recommendationConfig.LIMITS.DEFAULT_CANDIDATE_LIMIT));

    // 1. Build aggregated student context (single batch query)
    const context = await buildRecommendationContext(userId);

    // 2. Generate raw recommendation candidates across all 7 deterministic rules
    const rawCandidates = generateRecommendationCandidates(context);

    if (rawCandidates.length === 0) {
      return [];
    }

    // 3. Score, deduplicate, capacity-size, and filter for diversity
    const rankedCandidates = rankAndFilterRecommendations(rawCandidates, context, limit);

    // 4. Attach explanations (deterministic + optional Gemini AI enhancement)
    const explainedRecommendations = await Promise.all(
      rankedCandidates.map(async (candidate) => {
        try {
          return await enhanceExplanationWithAI(candidate);
        } catch {
          return candidate;
        }
      })
    );

    // 5. Persist into database as ACTIVE recommendations
    const persisted = await recommendationLifecycleService.persistRecommendations(
      userId,
      explainedRecommendations
    );

    return persisted;
  }
}

export const recommendationEngineService = new RecommendationEngineService();
export default recommendationEngineService;
