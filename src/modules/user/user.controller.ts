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
