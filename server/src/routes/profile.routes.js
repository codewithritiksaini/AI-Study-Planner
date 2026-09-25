import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All profile routes require a verified Supabase authentication token
router.use(requireAuth);

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
