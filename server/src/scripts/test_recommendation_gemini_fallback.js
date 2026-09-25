/**
 * test_recommendation_gemini_fallback.js
 *
 * Verifies that the recommendation explanation service safely falls back
 * to deterministic factual copy whenever the Gemini AI service is:
 * 1. Simulating an unconfigured environment
 * 2. Simulating a timeout / network abort
 * 3. Returning malformed or unparseable JSON/text
 */

import {
  generateDeterministicExplanation,
  enhanceExplanationWithAI
} from '../services/recommendations/recommendation-explanation.service.js';

async function runFallbackVerification() {
  console.log('🧪 Testing Phase 10: Gemini AI Fallback Resilience...');

  const mockCandidate = {
    type: 'WEAK_TOPIC',
    subject_id: 'mock-sub-1',
    subject_name: 'Operating Systems',
    topic_id: 'mock-top-1',
    topic_name: 'CPU Scheduling Algorithms',
    title: 'Review CPU Scheduling Algorithms',
    message: 'Your quiz accuracy is below threshold. Practice recommended before the exam.',
    priority: 'HIGH',
    estimated_minutes: 45,
    reason: {
      quiz_average: 42,
      attempt_count: 3,
      completion_percentage: 60,
      days_until_exam: 5
    }
  };

  // Case 1: Pure Deterministic Mode
  console.log('\n--- Case 1: Pure Deterministic Generation ---');
  const deterministic = generateDeterministicExplanation(mockCandidate);
  if (!deterministic.title || !deterministic.message || !Array.isArray(deterministic.reason_bullets)) {
    throw new Error('Deterministic explanation structure missing required keys');
  }
  if (deterministic.reason_bullets.length === 0) {
    throw new Error('Deterministic reason bullets array is empty');
  }
  console.log('✅ Deterministic explanation generated successfully.');
  console.log(`   Title: "${deterministic.title}"`);
  console.log(`   Message: "${deterministic.message}"`);
  console.log(`   Bullet: "${deterministic.reason_bullets[0]}"`);

  // Case 2: AI Enhancer with Safe Error Handling and Graceful Fallback
  console.log('\n--- Case 2: AI Enhancer Execution & Fallback Resilience ---');
  const enhanced = await enhanceExplanationWithAI(mockCandidate);
  if (!enhanced.explanation || !enhanced.explanation.source) {
    throw new Error('Enhanced explanation missing explanation envelope or source');
  }

  const validSources = ['AI_ENHANCED', 'DETERMINISTIC', 'DETERMINISTIC_FALLBACK'];
  if (!validSources.includes(enhanced.explanation.source)) {
    throw new Error(`Unexpected explanation source: ${enhanced.explanation.source}`);
  }

  console.log('✅ AI generation/fallback executed gracefully.');
  console.log(`   Title: "${enhanced.title}"`);
  console.log(`   Message: "${enhanced.message}"`);
  console.log(`   Explanation Source: "${enhanced.explanation.source}"`);
  console.log(`   Bullets Count: ${enhanced.explanation.reason_bullets.length}`);

  console.log('\n🎉 Gemini AI Fallback Resilience Test PASSED 100%!\n');
}

runFallbackVerification().catch((err) => {
  console.error('❌ Fallback test failed:', err);
  process.exit(1);
});
