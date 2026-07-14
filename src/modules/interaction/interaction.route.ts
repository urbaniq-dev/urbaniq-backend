import { Router } from 'express';
import { 
  createInquiry, 
  getInquiries, 
  updateInquiryStatus,
  scheduleVisit, 
  getVisits, 
  updateVisitStatus,
  createOffer,
  getOffers,
  updateOfferStatus,
  getMessages,
  sendMessage,
  getCollaborationMessages,
  sendCollaborationMessage,
  createReview,
  getAgentReviews
} from './interaction.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Inquiries & Messages
router.route('/inquiries')
  .post(protect, authorize('Buyer'), createInquiry)
  .get(protect, getInquiries);

router.route('/inquiries/:id')
  .put(protect, authorize('Owner', 'Agent'), updateInquiryStatus);

router.route('/inquiries/:id/messages')
  .get(protect, getMessages)
  .post(protect, sendMessage);

// Visits
router.route('/visits')
  .post(protect, authorize('Buyer'), scheduleVisit)
  .get(protect, getVisits);

router.route('/visits/:id')
  .put(protect, authorize('Owner', 'Agent', 'Admin', 'Buyer'), updateVisitStatus);

// Offers
router.route('/offers')
  .post(protect, authorize('Buyer'), createOffer)
  .get(protect, getOffers);

router.route('/offers/:id')
  .put(protect, updateOfferStatus);

// Collaboration Chat
router.route('/properties/:id/collaboration-messages')
  .get(protect, authorize('Owner', 'Agent'), getCollaborationMessages)
  .post(protect, authorize('Owner', 'Agent'), sendCollaborationMessage);

// Reviews
router.route('/reviews')
  .post(protect, authorize('Buyer', 'Owner'), createReview);

router.route('/reviews/agent/:agentId')
  .get(getAgentReviews); // Public route, can be viewed by anyone

export default router;
