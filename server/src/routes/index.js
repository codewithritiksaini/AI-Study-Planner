import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Healthcheck route
router.use('/health', healthRoutes);

// Placeholder markers for future phases
// router.use('/auth', authRoutes);        // Phase 2
// router.use('/subjects', subjectRoutes); // Phase 3
// router.use('/study', studyRoutes);       // Phase 4
// router.use('/planner', plannerRoutes);   // Phase 5
// router.use('/quizzes', quizRoutes);     // Phase 7
// router.use('/analytics', analyticsRoutes);// Phase 9
// router.use('/ai', aiRoutes);            // Phase 10

export default router;
