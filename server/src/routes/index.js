import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import subjectRoutes from './subject.routes.js';
import topicRoutes from './topic.routes.js';
import studyRoutes from './study.routes.js';
import plannerRoutes from './planner.routes.js';
import aiRoutes from './ai.routes.js';
import quizRoutes from './quiz.routes.js';
import performanceRoutes from './performance.routes.js';

const router = Router();

// Healthcheck route
router.use('/health', healthRoutes);

// Profile routes (Phase 2)
router.use('/profile', profileRoutes);

// Subject & Topic routes (Phase 3)
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);

// Study Session & Activity Tracking routes (Phase 4)
router.use('/study', studyRoutes);

// Rule-Based Study Planner routes (Phase 5)
router.use('/planner', plannerRoutes);

// Gemini AI Advisory & Recommendations (Phase 6)
router.use('/ai', aiRoutes);

// AI Quiz & Assessment routes (Phase 7)
router.use('/quizzes', quizRoutes);

// Topic Performance & Mastery Detection (Phase 7)
router.use('/performance', performanceRoutes);

// router.use('/analytics', analyticsRoutes);// Phase 9

export default router;
