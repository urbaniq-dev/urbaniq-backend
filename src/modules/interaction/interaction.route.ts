import { Router } from 'express';
import { createInquiry, getInquiries, scheduleVisit, getVisits } from './interaction.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Inquiries
router.route('/inquiries')
  .post(protect, authorize('Buyer'), createInquiry)
  .get(protect, getInquiries);

// Visits
router.route('/visits')
  .post(protect, authorize('Buyer'), scheduleVisit)
  .get(protect, getVisits);

export default router;
