import { Router } from 'express';
<<<<<<< Updated upstream
import { getUserProfile, updateProfile, getAgents, getAgentById } from './user.controller';
=======
import { getUserProfile, updateProfile, getAgents, getFavorites, addFavorite, removeFavorite, getAgentById } from './user.controller';
>>>>>>> Stashed changes
import { protect } from '../../core/middlewares/auth.middleware';
import { upload } from '../../core/middlewares/upload.middleware';

const router = Router();

// In a real application, protect would verify JWT token. 
// We are applying the protect middleware here for profile access.
router.get('/me', protect, getUserProfile);
router.put('/me', protect, upload.single('profileImage'), updateProfile);

router.get('/agents', getAgents);
router.get('/agents/:id', getAgentById);

export default router;
