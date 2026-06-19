import { Router } from 'express';
import { getUserProfile, updateProfile, getAgents } from './user.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// In a real application, protect would verify JWT token. 
// We are applying the protect middleware here for profile access.
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateProfile);

router.get('/agents', getAgents);

export default router;
