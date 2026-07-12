import express from 'express';
import { protect } from '../../core/middlewares/auth.middleware';
import { getNotifications, markAsRead, markAllAsRead } from './notification.controller';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
