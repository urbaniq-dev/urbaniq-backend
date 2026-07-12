import { Request, Response } from 'express';
import Inquiry from './inquiry.model';
import Message from './message.model';
import Visit from './visit.model';
import Property from '../property/property.model';
import Notification from '../notification/notification.model';
import Review from './review.model';
import { emitToUser } from '../../socket';

const sendNotification = async (userId: string, type: string, title: string, message: string, relatedId?: string) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, relatedId });
    emitToUser(userId, 'new_notification', notification.toJSON());
  } catch (error) {
    console.error('Error sending notification', error);
  }
};

// @desc    Create an inquiry
// @route   POST /api/interactions/inquiries
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { propertyId, message } = req.body;
    
    const inquiry = new Inquiry({
      propertyId,
      buyerId: (req as any).user._id,
      message, // legacy field
    });

    const createdInquiry = await inquiry.save();
    
    // Create the first message
    if (message) {
      await Message.create({
        inquiryId: createdInquiry._id,
        senderId: (req as any).user._id,
        text: message
      });
    }
    
    // Notify the manager of the property
    const property = await Property.findById(propertyId);
    if (property) {
      if (property.agentId) {
        sendNotification(property.agentId.toString(), 'Inquiry', 'New Inquiry', `New inquiry on ${property.title}`, createdInquiry._id.toString());
      } else if (property.ownerId) {
        sendNotification(property.ownerId.toString(), 'Inquiry', 'New Inquiry', `New inquiry on ${property.title}`, createdInquiry._id.toString());
      }
    }
    
    res.status(201).json(createdInquiry);
  } catch (error) {
    res.status(400).json({ message: 'Error creating inquiry' });
  }
};

// @desc    Get user inquiries (Buyer sees their sent, Owner/Agent sees received)
// @route   GET /api/interactions/inquiries
export const getInquiries = async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;
    const userId = (req as any).user._id;

    if (role === 'Buyer') {
      const inquiries = await Inquiry.find({ buyerId: userId })
        .populate({
          path: 'propertyId',
          populate: [
            { path: 'agentId', select: 'firstName lastName profileImage' },
            { path: 'ownerId', select: 'firstName lastName profileImage' }
          ]
        });
      return res.json(inquiries);
    } 
    
    // For Owners or Agents, we find properties they own or manage
    let properties: any[] = [];
    if (role === 'Owner') {
      // If property has an agent, it goes to the agent, not the owner.
      properties = await Property.find({ 
        ownerId: userId, 
        $or: [{ agentId: { $exists: false } }, { agentId: null }]
      }).select('_id');
    } else if (role === 'Agent') {
      properties = await Property.find({ agentId: userId }).select('_id');
    }

    const propertyIds = properties.map(p => p._id);
    const inquiries = await Inquiry.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title location price images')
      .populate('buyerId', 'firstName lastName email phone');

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get messages for an inquiry
// @route   GET /api/interactions/inquiries/:id/messages
export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ inquiryId: req.params.id })
      .populate('senderId', 'firstName lastName profileImage role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send a message in an inquiry thread
// @route   POST /api/interactions/inquiries/:id/messages
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const inquiryId = req.params.id;
    const senderId = (req as any).user._id;

    const inquiry = await Inquiry.findById(inquiryId).populate('propertyId');
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    const message = new Message({
      inquiryId,
      senderId,
      text
    });

    const createdMessage = await message.save();
    await createdMessage.populate('senderId', 'firstName lastName profileImage role');

    // Notify the other party
    const property: any = inquiry.propertyId;
    if ((req as any).user.role === 'Buyer') {
      // Buyer sent message, notify agent if one exists, else owner
      if (property.agentId) {
        sendNotification(property.agentId.toString(), 'Message', 'New Message', `New message regarding ${property.title}`, inquiryId.toString());
      } else if (property.ownerId) {
        sendNotification(property.ownerId.toString(), 'Message', 'New Message', `New message regarding ${property.title}`, inquiryId.toString());
      }
    } else {
      // Owner/Agent sent message, notify buyer
      sendNotification(inquiry.buyerId.toString(), 'Message', 'New Message', `New message regarding ${property.title}`, inquiryId.toString());
    }

    // Update inquiry status
    if (inquiry.status === 'Unread') {
       inquiry.status = 'Read';
       await inquiry.save();
    }

    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ message: 'Error sending message' });
  }
};

// @desc    Schedule a visit
// @route   POST /api/interactions/visits
export const scheduleVisit = async (req: Request, res: Response) => {
  try {
    const { propertyId, date, timeSlot } = req.body;
    
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const visit = new Visit({
      propertyId,
      buyerId: (req as any).user._id,
      agentId: property.agentId || undefined, // Only set if an agent is actually assigned
      date,
      timeSlot
    });

    const createdVisit = await visit.save();

    if (property.ownerId) {
      sendNotification(property.ownerId.toString(), 'Visit', 'New Visit Request', `New visit request for ${property.title}`, createdVisit._id.toString());
      emitToUser(property.ownerId.toString(), 'new_interaction', { type: 'Visit', data: createdVisit.toJSON() });
    }
    if (property.agentId) {
      sendNotification(property.agentId.toString(), 'Visit', 'New Visit Request', `New visit request for ${property.title}`, createdVisit._id.toString());
      emitToUser(property.agentId.toString(), 'new_interaction', { type: 'Visit', data: createdVisit.toJSON() });
    }

    res.status(201).json(createdVisit);
  } catch (error) {
    res.status(400).json({ message: 'Error scheduling visit' });
  }
};

// @desc    Get visits
// @route   GET /api/interactions/visits
export const getVisits = async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;
    const userId = (req as any).user._id;

    // Buyer: sees their own scheduled visits
    if (role === 'Buyer') {
      const visits = await Visit.find({ buyerId: userId })
        .populate('propertyId', 'title location')
        .populate('agentId', 'firstName lastName phone')
        .sort({ date: 1 });
      return res.json(visits);
    }

    // Agent: sees visits for properties they are assigned to
    if (role === 'Agent') {
      const visits = await Visit.find({ agentId: userId })
        .populate('propertyId', 'title location address')
        .populate('buyerId', 'firstName lastName phone')
        .sort({ date: 1 });
      return res.json(visits);
    }

    // Owner: sees visits for all properties they own
    if (role === 'Owner') {
      const ownedProperties = await Property.find({ ownerId: userId }).select('_id');
      const propertyIds = ownedProperties.map((p) => p._id);
      const visits = await Visit.find({ propertyId: { $in: propertyIds } })
        .populate('propertyId', 'title location')
        .populate('buyerId', 'firstName lastName phone')
        .populate('agentId', 'firstName lastName phone')
        .sort({ date: 1 });
      return res.json(visits);
    }

    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update inquiry status/reply
// @route   PUT /api/interactions/inquiries/:id
export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status, replyMessage } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    inquiry.status = status || inquiry.status;
    if (replyMessage) {
      inquiry.replyMessage = replyMessage;
    }

    const updatedInquiry = await inquiry.save();
    
    sendNotification(updatedInquiry.buyerId.toString(), 'Status', 'Inquiry Status Updated', `Your inquiry status was updated to ${status}`, updatedInquiry._id.toString());
    
    res.json(updatedInquiry);
  } catch (error) {
    res.status(400).json({ message: 'Error updating inquiry' });
  }
};

// @desc    Update visit status
// @route   PUT /api/interactions/visits/:id
export const updateVisitStatus = async (req: Request, res: Response) => {
  try {
    const { status, date, timeSlot } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    visit.status = status || visit.status;
    if (date) visit.date = date;
    if (timeSlot) visit.timeSlot = timeSlot;

    const updatedVisit = await visit.save();

    // Notify the buyer about the status change
    sendNotification(updatedVisit.buyerId.toString(), 'Status', 'Visit Status Updated', `Your visit request status was updated to ${status}`, updatedVisit._id.toString());
    emitToUser(updatedVisit.buyerId.toString(), 'visit_updated', updatedVisit.toJSON());

    // Also notify the property owner and agent so their dashboard updates in real-time
    const property = await Property.findById(updatedVisit.propertyId);
    if (property?.ownerId) {
      sendNotification(property.ownerId.toString(), 'Status', 'Visit Status Updated', `Visit request status was updated to ${status}`, updatedVisit._id.toString());
      emitToUser(property.ownerId.toString(), 'visit_updated', updatedVisit.toJSON());
    }
    if (property?.agentId) {
      sendNotification(property.agentId.toString(), 'Status', 'Visit Status Updated', `Visit request status was updated to ${status}`, updatedVisit._id.toString());
      emitToUser(property.agentId.toString(), 'visit_updated', updatedVisit.toJSON());
    }

    res.json(updatedVisit);
  } catch (error) {
    res.status(400).json({ message: 'Error updating visit' });
  }
};
// @desc    Create an offer (Cash)
// @route   POST /api/interactions/offers
export const createOffer = async (req: Request, res: Response) => {
  try {
    const { propertyId, amount, paymentMethod } = req.body;
    
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const Offer = (await import('./offer.model')).default;
    const offer = new Offer({
      propertyId,
      buyerId: (req as any).user._id,
      agentId: property.agentId || property.ownerId, // Fallback to owner if no agent
      amount,
      paymentMethod: paymentMethod || 'Cash'
    });

    const createdOffer = await offer.save();

    if (property.ownerId) sendNotification(property.ownerId.toString(), 'Offer', 'New Offer Received', `New offer received for ${property.title}`, createdOffer._id.toString());
    if (property.agentId) sendNotification(property.agentId.toString(), 'Offer', 'New Offer Received', `New offer received for ${property.title}`, createdOffer._id.toString());

    res.status(201).json(createdOffer);
  } catch (error) {
    res.status(400).json({ message: 'Error submitting offer' });
  }
};

// @desc    Get offers
// @route   GET /api/interactions/offers
export const getOffers = async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;
    const userId = (req as any).user._id;
    const Offer = (await import('./offer.model')).default;

    if (role === 'Buyer') {
      const offers = await Offer.find({ buyerId: userId })
        .populate('propertyId', 'title location price images')
        .populate('agentId', 'firstName lastName phone email');
      return res.json(offers);
    } 
    
    // For Owners or Agents
    let properties: any[] = [];
    if (role === 'Owner') {
      properties = await Property.find({ ownerId: userId }).select('_id');
    } else if (role === 'Agent') {
      properties = await Property.find({ agentId: userId }).select('_id');
    }

    const propertyIds = properties.map(p => p._id);
    const offers = await Offer.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title location price')
      .populate('buyerId', 'firstName lastName email phone');

    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update offer status
// @route   PUT /api/interactions/offers/:id
export const updateOfferStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const Offer = (await import('./offer.model')).default;
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    offer.status = status || offer.status;

    const updatedOffer = await offer.save();
    
    sendNotification(updatedOffer.buyerId.toString(), 'Status', 'Offer Status Updated', `Your offer status was updated to ${status}`, updatedOffer._id.toString());
    
    res.json(updatedOffer);
  } catch (error) {
    res.status(400).json({ message: 'Error updating offer' });
  }
};

// @desc    Get collaboration messages for a property
// @route   GET /api/interactions/properties/:id/collaboration-messages
export const getCollaborationMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ propertyId: req.params.id, isCollaboration: true })
      .populate('senderId', 'firstName lastName profileImage role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send a collaboration message for a property
// @route   POST /api/interactions/properties/:id/collaboration-messages
export const sendCollaborationMessage = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const propertyId = req.params.id;
    const senderId = (req as any).user._id;
    const role = (req as any).user.role;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const message = new Message({
      propertyId,
      senderId,
      text,
      isCollaboration: true
    });

    const createdMessage = await message.save();
    await createdMessage.populate('senderId', 'firstName lastName profileImage role');

    // Notify the other party
    if (role === 'Owner' && property.agentId) {
      sendNotification(property.agentId.toString(), 'Message', 'New Collaboration Message', `New message from owner on ${property.title}`, propertyId.toString());
    } else if (role === 'Agent' && property.ownerId) {
      sendNotification(property.ownerId.toString(), 'Message', 'New Collaboration Message', `New message from agent on ${property.title}`, propertyId.toString());
    }

    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ message: 'Error sending message' });
  }
};

// @desc    Create an agent review
// @route   POST /api/interactions/reviews
export const createReview = async (req: Request, res: Response) => {
  try {
    const { agentId, rating, comment } = req.body;
    const reviewerId = (req as any).user._id;

    if (!agentId || !rating) {
      return res.status(400).json({ message: 'Agent ID and Rating are required' });
    }

    const review = await Review.create({
      reviewerId,
      agentId,
      rating,
      comment
    });

    const populatedReview = await review.populate('reviewerId', 'firstName lastName profileImage role');

    sendNotification(agentId.toString(), 'Review', 'New Review Received', `You received a ${rating}-star review`, review._id.toString());

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(400).json({ message: 'Error creating review' });
  }
};

// @desc    Get reviews for an agent
// @route   GET /api/interactions/reviews/agent/:agentId
export const getAgentReviews = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments({ agentId });
    const reviews = await Review.find({ agentId })
      .populate('reviewerId', 'firstName lastName profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate average rating across all reviews, not just this page
    const allReviews = await Review.find({ agentId }).select('rating');
    const averageRating = allReviews.length > 0 ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length : 0;

    res.json({
      reviews,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      meta: {
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

