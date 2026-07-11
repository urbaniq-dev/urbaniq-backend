import { Request, Response } from 'express';
import User from '../user/user.model';
import Property from '../property/property.model';
import Visit from '../interaction/visit.model';
import Inquiry from '../interaction/inquiry.model';
import Offer from '../interaction/offer.model';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const buyers = await User.countDocuments({ role: 'Buyer' });
    const owners = await User.countDocuments({ role: 'Owner' });
    const agents = await User.countDocuments({ role: 'Agent' });
    const admins = await User.countDocuments({ role: 'Admin' });

    const totalProperties = await Property.countDocuments();
    const publishedProperties = await Property.countDocuments({ status: 'Published' });
    const pendingProperties = await Property.countDocuments({ status: 'Pending Approval' });
    const soldProperties = await Property.countDocuments({ status: 'Sold' });

    const totalVisits = await Visit.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();
    const totalOffers = await Offer.countDocuments();

    res.json({
      users: { total: totalUsers, buyers, owners, agents, admins },
      properties: { total: totalProperties, published: publishedProperties, pending: pendingProperties, sold: soldProperties },
      interactions: { visits: totalVisits, inquiries: totalInquiries, offers: totalOffers }
    });
  } catch (error) {
    console.error('Admin getAnalytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { role: { $ne: 'Agent' } };
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }
    if (req.query.role && req.query.role !== 'All') {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isVerified, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (status) user.status = status;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Admin updateUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.agentId) query.agentId = req.query.agentId;
    if (req.query.ownerId) query.ownerId = req.query.ownerId;
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { 'location.city': searchRegex }
      ];
    }

    const properties = await Property.find(query)
      .populate('ownerId', 'firstName lastName email')
      .populate('agentId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(query);

    res.json({
      properties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin getProperties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (password is hashed in pre-save hook)
    const admin = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'Admin',
      isVerified: true,
      status: 'Active'
    });

    res.status(201).json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error('Admin createAdmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
