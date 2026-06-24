import { Request, Response } from 'express';
import Inquiry from './inquiry.model';
import Visit from './visit.model';
import Property from '../property/property.model';
import { emitToUser } from '../../socket';

// @desc    Create an inquiry
// @route   POST /api/interactions/inquiries
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { propertyId, message } = req.body;
    
    const inquiry = new Inquiry({
      propertyId,
      buyerId: (req as any).user._id,
      message
    });

    const createdInquiry = await inquiry.save();
    
    // Notify Owner and Agent
    const property = await Property.findById(propertyId);
    if (property) {
      if (property.ownerId) emitToUser(property.ownerId.toString(), 'new_interaction', { type: 'Inquiry', propertyTitle: property.title });
      if (property.agentId) emitToUser(property.agentId.toString(), 'new_interaction', { type: 'Inquiry', propertyTitle: property.title });
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
      const inquiries = await Inquiry.find({ buyerId: userId }).populate('propertyId');
      return res.json(inquiries);
    } 
    
    // For Owners or Agents, we find properties they own or manage
    let properties: any[] = [];
    if (role === 'Owner') {
      properties = await Property.find({ ownerId: userId }).select('_id');
    } else if (role === 'Agent') {
      properties = await Property.find({ agentId: userId }).select('_id');
    }

    const propertyIds = properties.map(p => p._id);
    const inquiries = await Inquiry.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title location price')
      .populate('buyerId', 'firstName lastName email phone');

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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
      agentId: property.agentId || property.ownerId, // Fallback to owner if no agent
      date,
      timeSlot
    });

    const createdVisit = await visit.save();

    if (property.ownerId) emitToUser(property.ownerId.toString(), 'new_interaction', { type: 'Visit', propertyTitle: property.title });
    if (property.agentId) emitToUser(property.agentId.toString(), 'new_interaction', { type: 'Visit', propertyTitle: property.title });

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

    if (role === 'Buyer') {
      const visits = await Visit.find({ buyerId: userId })
        .populate('propertyId', 'title location')
        .populate('agentId', 'firstName lastName phone');
      return res.json(visits);
    } 
    
    const visits = await Visit.find({ agentId: userId })
      .populate('propertyId', 'title location')
      .populate('buyerId', 'firstName lastName phone');

    res.json(visits);
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
    
    emitToUser(updatedInquiry.buyerId.toString(), 'inquiry_updated', updatedInquiry);
    
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
    
    emitToUser(updatedVisit.buyerId.toString(), 'visit_updated', updatedVisit);
    
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

    if (property.ownerId) emitToUser(property.ownerId.toString(), 'new_interaction', { type: 'Offer', propertyTitle: property.title });
    if (property.agentId) emitToUser(property.agentId.toString(), 'new_interaction', { type: 'Offer', propertyTitle: property.title });

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
    
    emitToUser(updatedOffer.buyerId.toString(), 'offer_updated', updatedOffer);
    
    res.json(updatedOffer);
  } catch (error) {
    res.status(400).json({ message: 'Error updating offer' });
  }
};
