import { Router } from 'express';
import { createInquiry, getInquiries, scheduleVisit, getVisits, updateInquiryStatus, updateVisitStatus, createOffer, getOffers, updateOfferStatus } from './interaction.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Inquiries
router.route('/inquiries')
  .post(protect, authorize('Buyer'), createInquiry)
  .get(protect, getInquiries);

router.route('/inquiries/:id')
  .put(protect, updateInquiryStatus);

// Visits
router.route('/visits')
  .post(protect, authorize('Buyer'), scheduleVisit)
  .get(protect, getVisits);

router.route('/visits/:id')
  .put(protect, updateVisitStatus);

// Offers
router.route('/offers')
  .post(protect, authorize('Buyer'), createOffer)
  .get(protect, getOffers);

router.route('/offers/:id')
  .put(protect, updateOfferStatus);

export default router;
