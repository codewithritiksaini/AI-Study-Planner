import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/register', register);

// Protected session check endpoint
router.get('/me', requireAuth, getMe);

export default router;
