import { geminiService } from './gemini.service.js';
import { aiContextService } from './ai-context.service.js';
import { recommendationPrompt } from '../ai/prompts/recommendation.prompt.js';
import { explainPlanPrompt } from '../ai/prompts/explainPlan.prompt.js';
import { studyStrategyPrompt } from '../ai/prompts/studyStrategy.prompt.js';
import { askPrompt } from '../ai/prompts/ask.prompt.js';
import { quizGenerationPrompt } from '../ai/prompts/quizGeneration.prompt.js';
import { quizExplanationPrompt } from '../ai/prompts/quizExplanation.prompt.js';
import { topicStudyGuidePrompt } from '../ai/prompts/topicStudyGuide.prompt.js';
import { aiGeneratedQuizSchema } from '../validators/quiz.validator.js';
import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

class AIService {
  /**
   * Generates a personalized daily study recommendation using Gemini.
   * If Gemini is unavailable, falls back to a deterministic, rule-based recommendation.
   */
  async getStudyRecommendation(userId, dateStr) {
    const context = await aiContextService.buildRecommendationContext(userId, dateStr);

    // If student has no subjects enrolled
    if (!context.subjects || context.subjects.length === 0) {
      return {
        summary: 'Add your semester subjects and syllabus topics to unlock personalized AI study guidance.',
        recommendations: [],
        study_strategy: [
          'Navigate to the Subjects page.',
          'Add your enrolled courses and upcoming exam dates.',
          'Define syllabus modules with difficulty ratings.'
        ],
        source: 'FALLBACK_RULE_ENGINE'
      };
    }

    try {
      const promptText = recommendationPrompt.buildPrompt(context);
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: recommendationPrompt.systemInstruction,
        expectJson: true
      });

      // Validate required response fields
      if (aiResponse && aiResponse.summary && Array.isArray(aiResponse.recommendations)) {
        return {
          ...aiResponse,
          source: 'GEMINI_AI',
          prompt_version: recommendationPrompt.version
        };
      }
      throw new Error('AI response schema validation failed');
    } catch (err) {
      console.warn('⚠️  Gemini recommendation unavailable, returning deterministic rule-engine fallback:', err.message);
      return this.buildRecommendationFallback(context);
    }
  }

  /**
   * Explains why the Phase 5 rule engine generated today's schedule.
   * Read-only: never modifies the plan.
   */
  async explainPlan(userId, dateStr) {
    const context = await aiContextService.buildExplainPlanContext(userId, dateStr);

    if (!context.scheduled_tasks || context.scheduled_tasks.length === 0) {
      return {
        explanation: 'No study tasks are scheduled for this date. Generate a timetable from the Planner page to see an explanation.',
        key_factors: ['No active study blocks generated yet.'],
        encouragement: 'Generate a plan whenever you are ready to start studying today!',
        source: 'FALLBACK_RULE_ENGINE'
      };
    }

    try {
      const promptText = explainPlanPrompt.buildPrompt(context);
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: explainPlanPrompt.systemInstruction,
        expectJson: true
      });

      if (aiResponse && aiResponse.explanation && Array.isArray(aiResponse.key_factors)) {
        return {
          ...aiResponse,
          source: 'GEMINI_AI',
          prompt_version: explainPlanPrompt.version
        };
      }
      throw new Error('Explain plan response schema validation failed');
    } catch (err) {
      console.warn('⚠️  Gemini plan explanation unavailable, returning deterministic fallback:', err.message);
      return this.buildExplainPlanFallback(context);
    }
  }

  /**
   * Generates a step-by-step 45-60 minute study roadmap for a specific topic.
   */
  async getStudyStrategy(userId, topicId) {
    const context = await aiContextService.buildStudyStrategyContext(userId, topicId);

    try {
      const promptText = studyStrategyPrompt.buildPrompt(context);
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: studyStrategyPrompt.systemInstruction,
        expectJson: true
      });

      if (aiResponse && aiResponse.phases && Array.isArray(aiResponse.phases)) {
        return {
          ...aiResponse,
          source: 'GEMINI_AI',
          prompt_version: studyStrategyPrompt.version
        };
      }
      throw new Error('Study strategy schema validation failed');
    } catch (err) {
      console.warn('⚠️  Gemini study strategy unavailable, returning deterministic fallback:', err.message);
      return this.buildStudyStrategyFallback(context);
    }
  }

  /**
   * Answers a direct student query grounded in their timetable and academic context.
   */
  async askAI(userId, userMessage) {
    const todayStr = new Date().toISOString().split('T')[0];
    const context = await aiContextService.buildRecommendationContext(userId, todayStr);

    try {
      const promptText = askPrompt.buildPrompt(userMessage, context);
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: askPrompt.systemInstruction,
        expectJson: false
      });

      return {
        answer: aiResponse,
        source: 'GEMINI_AI'
      };
    } catch (err) {
      console.warn('⚠️  Gemini ask response unavailable, returning fallback:', err.message);
      return {
        answer: 'AI assistance is temporarily unavailable. However, your study timetable and active sessions remain fully functional. Please check your schedule on the Planner page.',
        source: 'FALLBACK_RULE_ENGINE'
      };
    }
  }

  // ============================================================================
  // DETERMINISTIC RULE-BASED FALLBACKS (Zero-crash guarantee if Gemini is down)
  // ============================================================================

  buildRecommendationFallback(context) {
    const topTask = context.today_plan && context.today_plan.length > 0 ? context.today_plan[0] : null;

    if (topTask) {
      return {
        summary: `Based on your rule-based timetable, focus primarily on ${topTask.subject} (${topTask.topic}) today.`,
        recommendations: [
          {
            topic: topTask.topic,
            subject: topTask.subject,
            action: `Dedicate ${topTask.planned_minutes} minutes to focused study`,
            reason: topTask.reason || 'Highest priority based on exam proximity and completion need.'
          }
        ],
        study_strategy: [
          'Review fundamental lecture notes and textbook definitions.',
          'Solve 2 to 3 standard practice problems.',
          'Perform a 5-minute active recall summary before taking a break.'
        ],
        source: 'FALLBACK_RULE_ENGINE'
      };
    }

    const firstTopic = context.incomplete_topics && context.incomplete_topics.length > 0 ? context.incomplete_topics[0] : null;
    return {
      summary: firstTopic
        ? `Recommend starting with ${firstTopic.subject} — ${firstTopic.name} to advance syllabus coverage.`
        : 'Review your upcoming exams and generate today’s study plan from the Planner page.',
      recommendations: firstTopic ? [
        {
          topic: firstTopic.name,
          subject: firstTopic.subject,
          action: `Study for ${firstTopic.estimated_minutes || 45} minutes`,
          reason: `Topic is currently ${firstTopic.completion_percentage}% complete.`
        }
      ] : [],
      study_strategy: [
        'Review core formulas and theoretical concepts.',
        'Work through sample exercises.',
        'Record study duration in the Focus Room.'
      ],
      source: 'FALLBACK_RULE_ENGINE'
    };
  }

  buildExplainPlanFallback(context) {
    const tasks = context.scheduled_tasks;
    const top = tasks[0];
    return {
      explanation: `Today's schedule allocates ${context.daily_capacity_hours} hours. ${top.subject} (${top.topic}) is placed first with highest priority score (${(top.priority_score * 100).toFixed(0)}%) because ${top.rule_reason.toLowerCase()}.`,
      key_factors: tasks.map(t => `${t.subject} — ${t.topic}: ${t.rule_reason}`),
      encouragement: 'Follow today’s timetable sequentially to maximize focus and retention.',
      source: 'FALLBACK_RULE_ENGINE'
    };
  }

  buildStudyStrategyFallback(context) {
    const duration = context.estimated_minutes || 60;
    const p1 = Math.round(duration * 0.25);
    const p2 = Math.round(duration * 0.45);
    const p3 = duration - p1 - p2;

    return {
      topic: context.topic,
      subject: context.subject,
      recommended_duration_minutes: duration,
      phases: [
        {
          phase_name: 'Concept Priming & Theoretical Foundations',
          duration_minutes: p1,
          instruction: 'Skim key definitions, diagrams, and fundamental theorems.'
        },
        {
          phase_name: 'Active Problem Solving & Applied Exercises',
          duration_minutes: p2,
          instruction: 'Work through standard university questions and past exam problems.'
        },
        {
          phase_name: 'Active Recall & Self-Testing',
          duration_minutes: p3,
          instruction: 'Write out core concepts from memory without looking at reference notes.'
        }
      ],
      pro_tips: [
        'Break complex derivations into smaller logical steps.',
        'Use the built-in Focus Room stopwatch to maintain strict focus blocks.'
      ],
      source: 'FALLBACK_RULE_ENGINE'
    };
  }

  /**
   * Generates structured multiple-choice quiz questions using Gemini AI.
   * Sanitizes all inputs, enforces system boundaries, and strictly validates response schema.
   *
   * @param {Object} params
   * @param {string} params.subjectName
   * @param {string} params.topicName
   * @param {string} [params.topicDescription]
   * @param {string} params.difficulty - 'EASY' | 'MEDIUM' | 'HARD'
   * @param {number} params.questionCount - between 3 and 20
   * @returns {Promise<Object>} Validated quiz data containing title, description, questions
   */
  async generateQuizContent({ subjectName, topicName, topicDescription, difficulty, questionCount }) {
    const cleanSubject = aiContextService.sanitizeText(subjectName);
    const cleanTopic = aiContextService.sanitizeText(topicName);
    const cleanDesc = aiContextService.sanitizeText(topicDescription || '');

    // Fast memory cache check (0ms for repeat quizzes)
    const cacheKey = `quiz:${cleanSubject}:${cleanTopic}:${difficulty}:${questionCount}`;
    const cachedQuiz = appCache.get(cacheKey);
    if (cachedQuiz) {
      logger.info(`Serving quiz from memory cache [0ms]: ${cacheKey}`);
      return cachedQuiz;
    }

    const promptText = quizGenerationPrompt.buildPrompt({
      subjectName: cleanSubject,
      topicName: cleanTopic,
      topicDescription: cleanDesc,
      difficulty,
      questionCount
    });

    try {
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: quizGenerationPrompt.systemInstruction,
        expectJson: true,
        maxOutputTokens: 8192
      });

      // Strict schema validation using Zod
      const parseResult = aiGeneratedQuizSchema.safeParse(aiResponse);
      if (!parseResult.success) {
        console.error('AI Quiz validation failure:', parseResult.error.format());
        const err = new Error('AI generated malformed quiz format or invalid options.');
        err.code = 'AI_INVALID_QUIZ_RESPONSE';
        err.statusCode = 502;
        throw err;
      }

      const quizData = {
        ...parseResult.data,
        source: 'AI',
        prompt_version: quizGenerationPrompt.version
      };

      // Store in memory cache for 12 hours
      appCache.set(cacheKey, quizData, 12 * 60 * 60 * 1000);
      return quizData;
    } catch (err) {
      logger.warn(`Quiz generation AI call failed (${err.message}), activating smart curriculum quiz fallback`, {
        error: err.message,
        code: err.code
      });
      return this.generateFallbackQuiz({
        subjectName: cleanSubject,
        topicName: cleanTopic,
        difficulty,
        questionCount
      });
    }
  }

  /**
   * Generates a deterministic, curriculum-aligned fallback quiz when AI API is unavailable.
   */
  generateFallbackQuiz({ subjectName, topicName, difficulty, questionCount = 5 }) {
    const questions = [];
    const count = Math.min(Math.max(questionCount, 3), 20);

    const templates = [
      {
        question_text: `What is the core conceptual objective of studying ${topicName} in ${subjectName}?`,
        options: [
          `To optimize resource utilization and establish verifiable performance bounds.`,
          `To completely avoid using memory or data structures in runtime execution.`,
          `To eliminate the need for compilation and type checking.`,
          `To bypass operating system kernel protection rings.`
        ],
        correct_answer: `To optimize resource utilization and establish verifiable performance bounds.`,
        explanation: `${topicName} provides foundational algorithms and structures to balance computational time and space trade-offs effectively.`
      },
      {
        question_text: `Which computational invariant must strictly hold when executing operations in ${topicName}?`,
        options: [
          `State transitions must preserve the underlying structural invariants and boundary correctness.`,
          `All pointer dereferences must resolve to constant memory addresses without modification.`,
          `The algorithm must terminate in zero clock cycles regardless of input cardinality.`,
          `Subroutines must always execute in non-deterministic order.`
        ],
        correct_answer: `State transitions must preserve the underlying structural invariants and boundary correctness.`,
        explanation: `Maintaining structural consistency and invariant validation ensures deterministic correctness across state updates in ${topicName}.`
      },
      {
        question_text: `What is the primary trade-off to consider when applying ${topicName} in real-world software architecture?`,
        options: [
          `Time complexity efficiency versus auxiliary memory and pointer overhead.`,
          `Screen resolution rendering versus network bandwidth.`,
          `File compression ratio versus hard drive spindle speed.`,
          `Source code line count versus power grid voltage.`
        ],
        correct_answer: `Time complexity efficiency versus auxiliary memory and pointer overhead.`,
        explanation: `Modern systems engineering balances execution speedups against cache locality and memory footprint.`
      },
      {
        question_text: `How should edge cases and boundary limits be handled when implementing ${topicName}?`,
        options: [
          `Validate null pointers, empty inputs, single-element collections, and capacity overflows before state manipulation.`,
          `Ignore input bounds and catch general hardware faults at runtime.`,
          `Restrict all inputs to prime numbers strictly greater than 100.`,
          `Re-initialize the entire operating system stack upon encountering invalid input.`
        ],
        correct_answer: `Validate null pointers, empty inputs, single-element collections, and capacity overflows before state manipulation.`,
        explanation: `Robust implementations defensively verify boundary parameters to avoid undefined behavior and segmentation faults.`
      },
      {
        question_text: `When comparing ${topicName} against naive brute-force approaches, what is the principal advantage gained?`,
        options: [
          `Substantially reduced asymptotic complexity across large-scale input sets.`,
          `Complete elimination of instruction pipeline hazards.`,
          `Automatic generation of user interface components.`,
          `Prevention of physical network hardware disconnects.`
        ],
        correct_answer: `Substantially reduced asymptotic complexity across large-scale input sets.`,
        explanation: `Theoretical efficiency gains compound significantly as dataset scale grows into production dimensions.`
      }
    ];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      questions.push({
        question_text: i >= templates.length ? `[Set ${Math.floor(i / templates.length) + 1}] ${template.question_text}` : template.question_text,
        options: [...template.options],
        correct_answer: template.correct_answer,
        explanation: template.explanation,
        points: 1
      });
    }

    return {
      title: `${subjectName} — ${topicName} Assessment`,
      description: `Targeted conceptual assessment covering ${topicName} (${difficulty} difficulty).`,
      questions,
      source: 'CURRICULUM_FALLBACK',
      prompt_version: 'fallback_v1'
    };
  }

  /**
   * Generates a pedagogical on-demand explanation for why an answer was wrong and why the correct answer is right.
   */
  async explainQuizQuestion({ topicName, questionText, selectedAnswer, correctAnswer, existingExplanation }) {
    const cleanTopic = aiContextService.sanitizeText(topicName);
    const cleanQuestion = aiContextService.sanitizeText(questionText);
    const cleanSelected = aiContextService.sanitizeText(selectedAnswer || '');
    const cleanCorrect = aiContextService.sanitizeText(correctAnswer);
    const cleanExisting = aiContextService.sanitizeText(existingExplanation || '');

    const promptText = quizExplanationPrompt.buildPrompt({
      topicName: cleanTopic,
      questionText: cleanQuestion,
      selectedAnswer: cleanSelected,
      correctAnswer: cleanCorrect,
      existingExplanation: cleanExisting
    });

    try {
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: quizExplanationPrompt.systemInstruction,
        expectJson: true
      });

      if (aiResponse && aiResponse.why_correct && aiResponse.why_incorrect) {
        return {
          ...aiResponse,
          source: 'GEMINI_AI',
          prompt_version: quizExplanationPrompt.version
        };
      }
      throw new Error('AI explanation schema incomplete');
    } catch (err) {
      console.warn('AI quiz explanation fallback triggered:', err.message);
      return {
        summary: `Conceptual breakdown for ${cleanTopic}`,
        why_correct: cleanExisting || `The correct answer is "${cleanCorrect}" based on standard core definitions of ${cleanTopic}.`,
        why_incorrect: cleanSelected ? `"${cleanSelected}" is not correct for this question.` : 'No option was selected for this question.',
        key_takeaway: `Review key concepts of ${cleanTopic} to reinforce this topic.`,
        source: 'FALLBACK_EXPLANATION'
      };
    }
  }

  /**
   * Generates high-yield university syllabus topic suggestions for a given subject name.
   */
  async suggestTopicsForSubject(subjectName, existingTopics = []) {
    const cleanSubject = aiContextService.sanitizeText(subjectName);
    const existingList = Array.isArray(existingTopics)
      ? existingTopics.map((t) => aiContextService.sanitizeText(String(t))).filter(Boolean)
      : [];

    const systemInstruction = `You are a university academic syllabus coordinator and curriculum expert.
Your job is to recommend 5 to 8 high-yield, foundational, and exam-critical curriculum topics for an undergraduate course named "${cleanSubject}".
Rules:
1. Return ONLY valid JSON adhering strictly to the schema.
2. Exclude any topics that closely match these already existing topics: ${JSON.stringify(existingList)}.
3. Each topic must have:
   - "name": string (concise topic title, e.g. "Normalization: 3NF & BCNF")
   - "difficulty": "EASY" | "MEDIUM" | "HARD"
   - "estimated_minutes": integer between 30 and 90
   - "description": concise 1-sentence academic scope description
4. Output Schema:
{
  "topics": [
    {
      "name": "Topic Name",
      "difficulty": "MEDIUM",
      "estimated_minutes": 45,
      "description": "Short description"
    }
  ]
}`;

    const promptText = `Suggest 5 to 8 core syllabus topics for the university course: "${cleanSubject}".`;

    try {
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction,
        expectJson: true
      });

      if (aiResponse && Array.isArray(aiResponse.topics) && aiResponse.topics.length > 0) {
        const sanitized = aiResponse.topics
          .filter((t) => t && typeof t.name === 'string' && t.name.trim().length > 0)
          .map((t) => ({
            name: t.name.trim().substring(0, 150),
            difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(t.difficulty) ? t.difficulty : 'MEDIUM',
            estimated_minutes:
              Number.isInteger(t.estimated_minutes) && t.estimated_minutes >= 15 && t.estimated_minutes <= 240
                ? t.estimated_minutes
                : 60,
            description: t.description ? String(t.description).trim().substring(0, 500) : ''
          }));

        if (sanitized.length > 0) {
          return {
            topics: sanitized,
            source: 'GEMINI_AI'
          };
        }
      }
      throw new Error('AI topics generation returned empty or invalid schema');
    } catch (err) {
      console.warn('⚠️ Gemini topic suggestion fallback triggered:', err.message);
      return {
        topics: this.getFallbackTopics(cleanSubject, existingList),
        source: 'FALLBACK_CATALOG'
      };
    }
  }

  /**
   * Deterministic catalog fallback for topic suggestions when offline.
   */
  getFallbackTopics(subjectName, existingList = []) {
    const lower = subjectName.toLowerCase();
    const existingSet = new Set(existingList.map((t) => t.toLowerCase().trim()));

    const catalogs = [
      {
        keys: ['dbms', 'database', 'sql'],
        topics: [
          { name: 'ER Modeling & Relational Schema', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Entities, attributes, relationships and relational mapping' },
          { name: 'Normalization: 1NF, 2NF, 3NF & BCNF', difficulty: 'HARD', estimated_minutes: 60, description: 'Functional dependencies, lossless join and dependency preservation' },
          { name: 'Transaction Management & ACID', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Atomicity, Consistency, Isolation, Durability and serializability' },
          { name: 'Concurrency Control & 2PL Locking', difficulty: 'HARD', estimated_minutes: 50, description: 'Lock-based protocols, timestamp ordering and deadlock handling' },
          { name: 'B+ Tree Indexing & Query Processing', difficulty: 'HARD', estimated_minutes: 50, description: 'Search trees, file organization and query cost estimation' },
          { name: 'Advanced SQL Joins & Subqueries', difficulty: 'MEDIUM', estimated_minutes: 40, description: 'Aggregations, nested queries and relational algebra' }
        ]
      },
      {
        keys: ['os', 'operating system'],
        topics: [
          { name: 'CPU Scheduling Algorithms', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'FCFS, SJF, Round Robin and Priority scheduling metrics' },
          { name: 'Process Synchronization & Semaphores', difficulty: 'HARD', estimated_minutes: 60, description: 'Critical section problem, mutex locks and classic IPC problems' },
          { name: 'Deadlock Avoidance & Banker Algorithm', difficulty: 'HARD', estimated_minutes: 50, description: 'Resource allocation graphs, safety algorithm and prevention' },
          { name: 'Memory Management: Paging & Segmentation', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Logical vs physical address space and translation lookaside buffer (TLB)' },
          { name: 'Virtual Memory & Page Replacement', difficulty: 'HARD', estimated_minutes: 50, description: 'Demand paging, FIFO, LRU and Optimal page replacement' },
          { name: 'File Systems & Disk Scheduling', difficulty: 'EASY', estimated_minutes: 35, description: 'FCFS, SSTF, SCAN and C-SCAN disk arm mechanics' }
        ]
      },
      {
        keys: ['network', 'cn', 'computer network'],
        topics: [
          { name: 'OSI vs TCP/IP Protocol Architecture', difficulty: 'EASY', estimated_minutes: 35, description: 'Layer responsibilities, encapsulation and protocol data units' },
          { name: 'IP Addressing & Subnetting (CIDR)', difficulty: 'HARD', estimated_minutes: 50, description: 'Classless routing, subnet masks and network address calculation' },
          { name: 'TCP Congestion Control & Sliding Window', difficulty: 'HARD', estimated_minutes: 60, description: 'Flow control, sequence numbers, AIMD and slow start' },
          { name: 'Routing Protocols: OSPF & BGP', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Distance vector vs link state routing mechanics' },
          { name: 'DNS, HTTP/HTTPS & Application Layer', difficulty: 'MEDIUM', estimated_minutes: 40, description: 'Name resolution, request/response cycles and TLS handshake' }
        ]
      },
      {
        keys: ['dsa', 'data structure', 'algorithm'],
        topics: [
          { name: 'Binary Search Trees & AVL Trees', difficulty: 'HARD', estimated_minutes: 50, description: 'Self-balancing trees, tree traversals and rotation mechanics' },
          { name: 'Graph Traversals: BFS & DFS', difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Adjacency list/matrix, connected components and shortest path' },
          { name: 'Dynamic Programming (0/1 Knapsack)', difficulty: 'HARD', estimated_minutes: 60, description: 'Optimal substructure, overlapping subproblems and memoization' },
          { name: 'Dijkstra & Minimum Spanning Trees', difficulty: 'HARD', estimated_minutes: 50, description: 'Greedy algorithms, Prim and Kruskal implementations' },
          { name: 'Sorting & Searching Complexities', difficulty: 'EASY', estimated_minutes: 35, description: 'QuickSort, MergeSort, Binary Search time and space bounds' }
        ]
      }
    ];

    const matched = catalogs.find((c) => c.keys.some((k) => lower.includes(k)));
    const candidateTopics = matched
      ? matched.topics
      : [
          { name: `${subjectName}: Fundamental Principles`, difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Core definitions, history and essential terminology' },
          { name: `${subjectName}: Theoretical Foundations`, difficulty: 'HARD', estimated_minutes: 60, description: 'Mathematical models, algorithms and primary frameworks' },
          { name: `${subjectName}: Practical Problem Solving`, difficulty: 'MEDIUM', estimated_minutes: 45, description: 'Standard numericals, case studies and application scenarios' },
          { name: `${subjectName}: Advanced Concepts & Systems`, difficulty: 'HARD', estimated_minutes: 60, description: 'Complex architectures, optimizations and edge cases' },
          { name: `${subjectName}: Comprehensive Exam Review`, difficulty: 'EASY', estimated_minutes: 40, description: 'Summary checklists, formulas and revision notes' }
        ];

    return candidateTopics.filter((t) => !existingSet.has(t.name.toLowerCase().trim()));
  }

  /**
   * Generates or retrieves an interactive, time-calibrated study guide for a topic.
   * Strictly respects the topic's estimated_minutes budget (40% Concept, 35% Example, 25% Practice).
   */
  async getTopicStudyGuide(userId, { topicId, subjectId = null, estimatedMinutes = null }) {
    // 1. Fetch topic & subject details from Postgres
    let topicRow = null;

    if (topicId) {
      const topRes = await query(
        `
        SELECT 
          t.id AS topic_id,
          t.name AS topic_name,
          t.difficulty,
          t.estimated_minutes,
          s.id AS subject_id,
          s.name AS subject_name
        FROM public.topics t
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE t.id = $1;
        `,
        [topicId]
      );
      if (topRes.rows.length > 0) {
        topicRow = topRes.rows[0];
      }
    }

    // If topic is not in DB or custom, fallback to provided arguments or defaults
    const effectiveSubject = topicRow?.subject_name || 'General Computer Science';
    const effectiveTopic = topicRow?.topic_name || 'Core Fundamentals';
    const effectiveDifficulty = topicRow?.difficulty || 'MEDIUM';
    const effectiveDuration = Math.max(
      10,
      Math.min(180, parseInt(estimatedMinutes || topicRow?.estimated_minutes || 25, 10))
    );

    // 2. Check Cache
    const cacheKey = `study_guide:${topicId || `${effectiveSubject}_${effectiveTopic}`}:${effectiveDuration}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        source: 'CACHE'
      };
    }

    const context = {
      topic_id: topicId || '',
      topic_name: effectiveTopic,
      subject_name: effectiveSubject,
      difficulty: effectiveDifficulty,
      estimated_minutes: effectiveDuration
    };

    // 3. Generate via Gemini AI
    try {
      const promptText = topicStudyGuidePrompt.buildPrompt(context);
      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: topicStudyGuidePrompt.systemInstruction,
        expectJson: true
      });

      const hasExamples = (Array.isArray(aiResponse.worked_examples) && aiResponse.worked_examples.length > 0) || aiResponse.worked_example;
      if (aiResponse && aiResponse.concept && hasExamples && Array.isArray(aiResponse.self_check_questions)) {
        const normalizedExamples = Array.isArray(aiResponse.worked_examples) && aiResponse.worked_examples.length > 0
          ? aiResponse.worked_examples
          : [aiResponse.worked_example];

        const payload = {
          ...aiResponse,
          worked_examples: normalizedExamples,
          worked_example: normalizedExamples[0],
          topic_id: topicId || '',
          topic_name: effectiveTopic,
          subject_name: effectiveSubject,
          source: 'GEMINI_AI',
          prompt_version: topicStudyGuidePrompt.version
        };

        // Store in cache for 24 hours (86400000ms)
        appCache.set(cacheKey, payload, 86400000);
        return payload;
      }
      throw new Error('AI study guide returned invalid or incomplete schema');
    } catch (err) {
      console.warn('⚠️ Gemini study guide generation unavailable, using fallback:', err.message);
      const fallback = this.buildTopicStudyGuideFallback(context);
      appCache.set(cacheKey, fallback, 3600000);
      return fallback;
    }
  }

  /**
   * High-quality deterministic fallback when AI is unavailable or rate-limited.
   * Tailors content intelligently to the subject and topic domain.
   */
  buildTopicStudyGuideFallback(context) {
    const totalMinutes = context.estimated_minutes || 25;
    const theoryMinutes = Math.max(4, Math.round(totalMinutes * 0.40));
    const exampleMinutes = Math.max(3, Math.round(totalMinutes * 0.35));
    const practiceMinutes = Math.max(3, totalMinutes - theoryMinutes - exampleMinutes);

    const topicLower = (context.topic_name || '').toLowerCase();
    const subjectLower = (context.subject_name || '').toLowerCase();

    let intuition = `Mastering ${context.topic_name} gives you the exact mental model to reason about state transitions and performance bounds in ${context.subject_name}.`;
    let codeOrSteps = `// Core implementation pattern for ${context.topic_name}\nfunction processTopic(input) {\n  if (!input) return null;\n  // Step 1: Validate input constraints\n  // Step 2: Traverse / apply transformation\n  // Step 3: Return verified output\n  return true;\n}`;
    let example2Title = `Edge-Case Verification: ${context.topic_name}`;
    let example2Code = `// Edge-case & Boundary handling\nif (!input || input.length <= 1) {\n  return handleBaseCase(input);\n}`;
    let question1 = `What is the primary operational advantage of applying ${context.topic_name}?`;
    let question2 = `Which condition represents a critical edge case for ${context.topic_name}?`;

    if (topicLower.includes('trie') || topicLower.includes('string')) {
      intuition = `A Trie trades space for instant prefix matching by sharing common prefixes across words, giving O(L) lookup independent of total dictionary size.`;
      codeOrSteps = `// Trie Node & Insert Example (JavaScript / TypeScript)\nclass TrieNode {\n  constructor() {\n    this.children = {}; // 26 alphabet branches\n    this.isEndOfWord = false;\n  }\n}\n\nfunction insertWord(root, word) {\n  let curr = root;\n  for (const ch of word) {\n    if (!curr.children[ch]) curr.children[ch] = new TrieNode();\n    curr = curr.children[ch];\n  }\n  curr.isEndOfWord = true;\n}`;
      example2Title = 'Trie Prefix Search & Autocomplete Example';
      example2Code = `function startsWith(root, prefix) {\n  let curr = root;\n  for (const ch of prefix) {\n    if (!curr.children[ch]) return false;\n    curr = curr.children[ch];\n  }\n  return true; // Valid prefix exists in Trie\n}`;
      question1 = 'What is the time complexity of searching for a word of length L in a Trie containing N words?';
      question2 = 'Why would a Hash Map be preferred over a Trie for exact word lookups without prefix queries?';
    } else if (topicLower.includes('search') || topicLower.includes('sort')) {
      intuition = `Searching and sorting algorithms exploit monotonic ordering to cut search spaces exponentially (e.g. Binary Search O(log n)) or reorganize datasets for rapid retrieval.`;
      codeOrSteps = `// Binary Search in Sorted Array\nfunction binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    const mid = low + Math.floor((high - low) / 2); // Avoid integer overflow\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1; // Target not found\n}`;
      example2Title = 'Binary Search: Finding Lower Bound / First Occurrence';
      example2Code = `function lowerBound(arr, target) {\n  let low = 0, high = arr.length - 1, ans = -1;\n  while (low <= high) {\n    const mid = low + Math.floor((high - low) / 2);\n    if (arr[mid] >= target) {\n      ans = mid; high = mid - 1; // Try finding smaller index on left\n    } else { low = mid + 1; }\n  }\n  return ans;\n}`;
      question1 = 'Why is `mid = low + Math.floor((high - low) / 2)` preferred over `(low + high) / 2`?';
      question2 = 'What is the minimum requirement for Binary Search to guarantee correct results?';
    } else if (subjectLower.includes('os') || topicLower.includes('cpu') || topicLower.includes('page') || topicLower.includes('deadlock')) {
      intuition = `Operating System mechanics balance concurrency, memory abstraction, and latency guarantees to provide safe hardware virtualization for user programs.`;
      codeOrSteps = `// Mutex Lock & Critical Section\nacquire_lock(&mutex); // Atomically test-and-set\n/* --- CRITICAL SECTION --- */\nshared_counter++;\n/* ------------------------ */\nrelease_lock(&mutex); // Wake up waiting threads`;
      example2Title = 'Deadlock Prevention: Ordered Resource Acquisition';
      example2Code = `// Always acquire locks in strict numerical order to break circular wait\nif (lockA < lockB) {\n  lock(lockA); lock(lockB);\n} else {\n  lock(lockB); lock(lockA);\n}`;
      question1 = 'What condition is strictly required to guarantee mutual exclusion in concurrent execution?';
      question2 = 'Which condition is NOT one of Coffman\'s four conditions for deadlock?';
    } else if (subjectLower.includes('dbms') || topicLower.includes('sql') || topicLower.includes('normal') || topicLower.includes('acid')) {
      intuition = `Database systems enforce ACID invariants to guarantee data integrity across crashes, network partitions, and concurrent transactions.`;
      codeOrSteps = `-- ACID Transaction Block Example\nBEGIN TRANSACTION;\n  UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT; -- Atomically written to WAL`;
      example2Title = 'Handling Concurrency: Optimistic Concurrency Control (OCC)';
      example2Code = `-- Using row versioning to detect concurrent conflicting updates\nUPDATE products\nSET stock = stock - 1, version = version + 1\nWHERE id = 42 AND version = @current_version;\n-- If 0 rows affected, retry transaction due to conflict`;
      question1 = 'Which ACID property guarantees that intermediate state is invisible to concurrent transactions?';
      question2 = 'What dependency violation does 2nd Normal Form (2NF) eliminate?';
    }

    const workedExamples = [
      {
        id: 'ex1',
        title: `Example 1: Standard Execution Flow for ${context.topic_name}`,
        problem_statement: `Demonstrate primary algorithmic operation and state transitions under representative inputs.`,
        code_or_steps: codeOrSteps,
        step_by_step_explanation: [
          'Step 1: Validate input constraints and initialize state tracking pointers.',
          'Step 2: Execute state transitions while preserving formal system invariants.',
          'Step 3: Return the finalized state or target result with bounded complexity.'
        ]
      },
      {
        id: 'ex2',
        title: example2Title,
        problem_statement: `Handle boundary states, concurrency contention, or query optimizations safely.`,
        code_or_steps: example2Code,
        step_by_step_explanation: [
          'Step 1: Inspect the edge or boundary condition before applying the standard pathway.',
          'Step 2: Apply the safe variant to prevent runtime exceptions or corruption.'
        ]
      }
    ];

    return {
      topic_id: context.topic_id,
      topic_name: context.topic_name,
      subject_name: context.subject_name,
      time_budget: {
        total_minutes: totalMinutes,
        theory_minutes: theoryMinutes,
        example_minutes: exampleMinutes,
        practice_minutes: practiceMinutes
      },
      concept: {
        one_liner_intuition: intuition,
        key_takeaways: [
          `Key Invariant: Understand the foundational mechanics governing state in ${context.topic_name}.`,
          `Asymptotic Bounds: Trace best, average, and worst-case execution performance.`,
          `Edge-Case Verification: Inspect boundary inputs, null checks, and capacity thresholds.`
        ],
        explanation_markdown: `### Core Fundamentals of ${context.topic_name}\n\nWhen studying **${context.topic_name}** in **${context.subject_name}**, focus on building an intuitive mental model:\n\n1. **Theoretical Motivation**: Solves scalability, consistency, or performance bottlenecks.\n2. **Execution Flow**: Step-by-step state transitions follow deterministic invariant rules.\n3. **Practical Engineering**: Always balance space requirements with computation latency.`
      },
      worked_examples: workedExamples,
      worked_example: workedExamples[0],
      self_check_questions: [
        {
          id: 'q1',
          question: question1,
          options: [
            'O(L) where L is string/key length, independent of total dataset size',
            'O(N * L) linear scan through all records',
            'O(1) without any memory overhead',
            'O(2^N) exponential time'
          ],
          correct_index: 0,
          explanation: 'Optimal algorithmic representations like Tries and Binary Search isolate search paths to branch depth, bounding time strictly to key length.'
        },
        {
          id: 'q2',
          question: question2,
          options: [
            'Hash maps have O(1) average lookup and do not incur pointer tree overhead when prefixes are not needed',
            'Hash maps consume strictly zero RAM',
            'Hash maps automatically sort all elements',
            'Tries cannot store strings longer than 10 characters'
          ],
          correct_index: 0,
          explanation: 'Hash maps provide faster average single-key lookups without per-node pointer memory overhead when prefix matching is unnecessary.'
        }
      ],
      source: 'SMART_CATALOG_FALLBACK'
    };
  }
}

export const aiService = new AIService();
