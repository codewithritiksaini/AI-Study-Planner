import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getDashboardSummary
} from '../controllers/subject.controller.js';
import {
  getTopicsBySubject,
  createTopic
} from '../controllers/topic.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All subject endpoints require authentication
router.use(requireAuth);

// Academic summary for dashboard
router.get('/summary', getDashboardSummary);

// Subject CRUD
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

// Nested Topic endpoints under Subject
router.get('/:subjectId/topics', getTopicsBySubject);
router.post('/:subjectId/topics', createTopic);

export default router;
