import { Router } from 'express';
import { getAnalytics, getUsers, updateUser, getProperties, deleteUser, createAdmin } from './admin.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(protect, authorize('Admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/properties', getProperties);
router.post('/admins', createAdmin);

export default router;
