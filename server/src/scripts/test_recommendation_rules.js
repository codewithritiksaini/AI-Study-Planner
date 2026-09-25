import { query } from '../config/db.js';
import { recommendationConfig } from '../config/recommendation.config.js';
import {
  getWeakTopicCandidates,
  getUnfinishedTopicCandidates,
  getExamPreparationCandidates,
  getRevisionCandidates,
  getQuizPracticeCandidates,
  getBacklogCandidates,
  getStudyBalanceCandidates,
  generateRecommendationCandidates
} from '../services/recommendations/recommendation-rules.service.js';
import { buildRecommendationContext } from '../services/recommendations/recommendation-context.service.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testRecommendationRules() {
  console.log('🧪 Testing Phase 10: Recommendation Rules & Candidate Generators...');

  // ==========================================
  // UNIT TEST 1: Weak Topic Rule
  // ==========================================
  console.log('\n--- Test 1: Weak Topic Rule ---');
  const mockWeakContext = {
    averageSessionMinutes: 40,
    subjects: [{ id: 'sub-1', name: 'DBMS', daysUntilExam: 5 }],
    topics: [
      {
        id: 't-1',
        subject_id: 'sub-1',
        name: 'Normalization',
        completion_percentage: 60,
        performance: { attempt_count: 2, average_percentage: 45, recent_percentage: 40 }
      },
      {
        id: 't-2',
        subject_id: 'sub-1',
        name: 'Indexing',
        completion_percentage: 80,
        performance: { attempt_count: 3, average_percentage: 88, recent_percentage: 90 }
      }
    ]
  };

  const weakCandidates = getWeakTopicCandidates(mockWeakContext);
  assert(weakCandidates.length === 1, `Expected 1 weak topic candidate, got ${weakCandidates.length}`);
  assert(weakCandidates[0].type === recommendationConfig.TYPES.WEAK_TOPIC, 'Type should be WEAK_TOPIC');
  assert(weakCandidates[0].topic_id === 't-1', 'Target topic should be t-1');
  assert(weakCandidates[0].reason.quiz_average === 45, 'Reason should record 45% quiz average');
  console.log('✅ Weak topic rule accurately identifies weak topic and ignores strong topic.');

  // ==========================================
  // UNIT TEST 2: Unfinished Topic Rule
  // ==========================================
  console.log('\n--- Test 2: Unfinished Topic Rule ---');
  const mockUnfinishedContext = {
    averageSessionMinutes: 45,
    subjects: [{ id: 'sub-1', name: 'OS', daysUntilExam: 10 }],
    topics: [
      {
        id: 't-3',
        subject_id: 'sub-1',
        name: 'Deadlocks',
        completion_percentage: 40,
        is_completed: false,
        estimated_minutes: 60
      },
      {
        id: 't-4',
        subject_id: 'sub-1',
        name: 'Processes',
        completion_percentage: 100,
        is_completed: true,
        estimated_minutes: 60
      }
    ]
  };

  const unfinishedCandidates = getUnfinishedTopicCandidates(mockUnfinishedContext);
  assert(unfinishedCandidates.length === 1, `Expected 1 unfinished candidate, got ${unfinishedCandidates.length}`);
  assert(unfinishedCandidates[0].type === recommendationConfig.TYPES.UNFINISHED_TOPIC, 'Type should be UNFINISHED_TOPIC');
  assert(unfinishedCandidates[0].topic_id === 't-3', 'Target topic should be t-3');
  assert(unfinishedCandidates[0].reason.completion_percentage === 40, 'Reason should record 40% completion');
  console.log('✅ Unfinished topic rule correctly detects in-progress topics and ignores 100% completed topics.');

  // ==========================================
  // UNIT TEST 3: Exam Preparation Rule
  // ==========================================
  console.log('\n--- Test 3: Exam Preparation Rule ---');
  const mockExamContext = {
    averageSessionMinutes: 45,
    examUrgentSubjects: [
      { id: 'sub-urgent', name: 'Computer Networks', daysUntilExam: 4, urgency: 'EXAM_APPROACHING' },
      { id: 'sub-far', name: 'Compiler Design', daysUntilExam: 25, urgency: 'NORMAL' }
    ],
    topics: [
      { id: 't-cn-1', subject_id: 'sub-urgent', name: 'TCP/IP', is_completed: false, completion_percentage: 30 }
    ]
  };

  const examCandidates = getExamPreparationCandidates(mockExamContext);
  assert(examCandidates.length === 1, `Expected 1 exam candidate, got ${examCandidates.length}`);
  assert(examCandidates[0].type === recommendationConfig.TYPES.EXAM_PREPARATION, 'Type should be EXAM_PREPARATION');
  assert(examCandidates[0].subject_id === 'sub-urgent', 'Subject should be sub-urgent');
  assert(examCandidates[0].reason.days_until_exam === 4, 'Reason should record 4 days until exam');
  console.log('✅ Exam preparation rule triggers for upcoming exam within 7 days.');

  // ==========================================
  // UNIT TEST 4: Revision Rule
  // ==========================================
  console.log('\n--- Test 4: Revision Rule ---');
  const mockRevisionContext = {
    subjects: [{ id: 'sub-1', name: 'DBMS' }],
    topics: [
      { id: 't-rev', subject_id: 'sub-1', name: 'SQL Basics', is_completed: true, days_since_last_study: 18 },
      { id: 't-fresh', subject_id: 'sub-1', name: 'Relational Algebra', is_completed: true, days_since_last_study: 3 }
    ]
  };

  const revisionCandidates = getRevisionCandidates(mockRevisionContext);
  assert(revisionCandidates.length === 1, `Expected 1 revision candidate, got ${revisionCandidates.length}`);
  assert(revisionCandidates[0].type === recommendationConfig.TYPES.REVISION, 'Type should be REVISION');
  assert(revisionCandidates[0].topic_id === 't-rev', 'Topic should be t-rev');
  console.log('✅ Revision rule triggers for completed topics not studied in >= 14 days.');

  // ==========================================
  // UNIT TEST 5: Quiz Practice Rule
  // ==========================================
  console.log('\n--- Test 5: Quiz Practice Rule ---');
  const mockQuizContext = {
    topics: [
      {
        id: 't-studied',
        subject_id: 'sub-1',
        name: 'CPU Scheduling',
        study_minutes_recorded: 45,
        completion_percentage: 60,
        performance: null // No quiz attempts recorded
      },
      {
        id: 't-unstudied',
        subject_id: 'sub-1',
        name: 'Virtual Memory',
        study_minutes_recorded: 0,
        completion_percentage: 0,
        performance: null
      }
    ]
  };

  const quizCandidates = getQuizPracticeCandidates(mockQuizContext);
  assert(quizCandidates.length === 1, `Expected 1 quiz practice candidate, got ${quizCandidates.length}`);
  assert(quizCandidates[0].type === recommendationConfig.TYPES.QUIZ_PRACTICE, 'Type should be QUIZ_PRACTICE');
  assert(quizCandidates[0].topic_id === 't-studied', 'Topic should be t-studied');
  console.log('✅ Quiz practice rule triggers only when student has study exposure but 0 quiz attempts.');

  // ==========================================
  // UNIT TEST 6: Backlog Rule
  // ==========================================
  console.log('\n--- Test 6: Backlog Rule ---');
  const mockBacklogContext = {
    backlogTasks: [
      { id: 'p1', status: 'MISSED' },
      { id: 'p2', status: 'MISSED' },
      { id: 'p3', status: 'PENDING' }
    ],
    metrics: { planner: { adherence_percentage: 50 } }
  };

  const backlogCandidates = getBacklogCandidates(mockBacklogContext);
  assert(backlogCandidates.length === 1, `Expected 1 backlog candidate, got ${backlogCandidates.length}`);
  assert(backlogCandidates[0].type === recommendationConfig.TYPES.BACKLOG, 'Type should be BACKLOG');
  assert(backlogCandidates[0].reason.backlog_count === 3, 'Reason should record 3 backlog tasks');
  console.log('✅ Backlog rule triggers when 3 or more tasks remain missed/pending.');

  // ==========================================
  // UNIT TEST 7: Study Balance Rule
  // ==========================================
  console.log('\n--- Test 7: Study Balance Rule ---');
  const mockBalanceContext = {
    averageSessionMinutes: 45,
    subjects: [
      { id: 'sub-A', name: 'DBMS', daysUntilExam: 20, isPast: false },
      { id: 'sub-B', name: 'OS', daysUntilExam: 6, isPast: false }
    ],
    subjectStudyStats: {
      'sub-A': { totalMinutes: 180, shareOfTotal: 0.85 },
      'sub-B': { totalMinutes: 30, shareOfTotal: 0.15 }
    }
  };

  const balanceCandidates = getStudyBalanceCandidates(mockBalanceContext);
  assert(balanceCandidates.length === 1, `Expected 1 balance candidate, got ${balanceCandidates.length}`);
  assert(balanceCandidates[0].type === recommendationConfig.TYPES.STUDY_BALANCE, 'Type should be STUDY_BALANCE');
  assert(balanceCandidates[0].subject_id === 'sub-B', 'Should suggest studying sub-B');
  console.log('✅ Study balance rule triggers when one subject consumes > 70% while another has an upcoming exam.');

  // ==========================================
  // INTEGRATION TEST: Against Real Database Context
  // ==========================================
  console.log('\n--- Test 8: Live Database Context Evaluation ---');
  const userRes = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
  const userId = userRes.rows[0].id;
  const liveContext = await buildRecommendationContext(userId);

  const liveCandidates = generateRecommendationCandidates(liveContext);
  console.log(`✅ Generated ${liveCandidates.length} live recommendation candidate(s) for student user.`);
  for (const c of liveCandidates) {
    console.log(`  - [${c.type}] ${c.title} (${c.estimated_minutes} min) -> Action: ${c.action.type}`);
  }

  console.log('\n🎉 Task 3: Deterministic Recommendation Rules & Candidate Generators PASSED 100%!\n');
  process.exit(0);
}

testRecommendationRules().catch((err) => {
  console.error('❌ Task 3 Test failed:', err.stack || err);
  process.exit(1);
});
