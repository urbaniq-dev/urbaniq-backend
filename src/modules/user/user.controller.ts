import { Request, Response } from 'express';
import User from './user.model';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phone = req.body.phone || user.phone;
    
    // In real app, handle profileImage upload

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await User.find({ role: 'Agent' }).select('-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id).populate('savedProperties');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.savedProperties || []);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById((req as any).user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.savedProperties) user.savedProperties = [];
    
    // Check if already added
    if (!user.savedProperties.includes(propertyId as any)) {
      user.savedProperties.push(propertyId as any);
      await user.save();
    }
    
    res.json({ message: 'Added to favorites', savedProperties: user.savedProperties });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById((req as any).user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.savedProperties) {
      user.savedProperties = user.savedProperties.filter(id => id.toString() !== propertyId);
      await user.save();
    }
    
    res.json({ message: 'Removed from favorites', savedProperties: user.savedProperties });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
