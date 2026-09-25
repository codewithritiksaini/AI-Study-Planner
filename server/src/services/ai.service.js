import { geminiService } from './gemini.service.js';
import { aiContextService } from './ai-context.service.js';
import { recommendationPrompt } from '../ai/prompts/recommendation.prompt.js';
import { explainPlanPrompt } from '../ai/prompts/explainPlan.prompt.js';
import { studyStrategyPrompt } from '../ai/prompts/studyStrategy.prompt.js';
import { askPrompt } from '../ai/prompts/ask.prompt.js';
import { quizGenerationPrompt } from '../ai/prompts/quizGeneration.prompt.js';
import { quizExplanationPrompt } from '../ai/prompts/quizExplanation.prompt.js';
import { aiGeneratedQuizSchema } from '../validators/quiz.validator.js';

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

      return {
        ...parseResult.data,
        source: 'AI',
        prompt_version: quizGenerationPrompt.version
      };
    } catch (err) {
      if (err.code === 'AI_INVALID_QUIZ_RESPONSE') {
        throw err;
      }
      console.error('Quiz generation AI call failed:', err.message);
      const error = new Error('Quiz generation is temporarily unavailable. Please try again later.');
      error.code = 'AI_QUIZ_GENERATION_FAILED';
      error.statusCode = 503;
      throw error;
    }
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
}

export const aiService = new AIService();
