import { Router } from 'express';
import { createAssignment, getAssignments, respondToAssignment } from './assignment.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

router.route('/')
  .post(protect, authorize('Owner'), createAssignment)
  .get(protect, authorize('Owner', 'Agent'), getAssignments);

router.route('/:id/respond')
  .put(protect, authorize('Agent'), respondToAssignment);

export default router;
