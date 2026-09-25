import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import subjectRoutes from './subject.routes.js';
import topicRoutes from './topic.routes.js';

const router = Router();

// Healthcheck route
router.use('/health', healthRoutes);

// Profile routes (Phase 2)
router.use('/profile', profileRoutes);

// Subject & Topic routes (Phase 3)
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
// router.use('/study', studyRoutes);       // Phase 4
// router.use('/planner', plannerRoutes);   // Phase 5
// router.use('/quizzes', quizRoutes);     // Phase 7
// router.use('/analytics', analyticsRoutes);// Phase 9
// router.use('/ai', aiRoutes);            // Phase 10

export default router;
