import { Router } from 'express';
import { getUserProfile, updateProfile, getAgents, getAgentProfile, getFavorites, addFavorite, removeFavorite } from './user.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// In a real application, protect would verify JWT token. 
// We are applying the protect middleware here for profile access.
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateProfile);

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:propertyId', protect, addFavorite);
router.delete('/favorites/:propertyId', protect, removeFavorite);

router.get('/agents', getAgents);
router.get('/agents/:id', getAgentProfile);

export default router;
