import { Request, Response } from 'express';
import Inquiry from './inquiry.model';
import Visit from './visit.model';
import Property from '../property/property.model';

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
