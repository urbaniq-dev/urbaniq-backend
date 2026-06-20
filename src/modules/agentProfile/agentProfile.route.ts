import { Router } from 'express';
import { protect, authorize } from '../../core/middlewares/auth.middleware';
import { upload } from '../../core/middlewares/upload.middleware';
import * as agentProfileController from './agentProfile.controller';

const router = Router();

router.get('/me', protect, authorize('Agent'), agentProfileController.getMyProfile);
router.put('/me', protect, authorize('Agent'), upload.single('profileImage'), agentProfileController.updateMyProfile);

router.get('/user/:userId', agentProfileController.getProfileByUserId);

export default router;
