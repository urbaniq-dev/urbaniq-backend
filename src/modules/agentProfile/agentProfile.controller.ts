import { Request, Response } from 'express';
import * as agentProfileService from './agentProfile.service';

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const profile = await agentProfileService.getAgentProfileByUserId(userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getProfileByUserId = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const profile = await agentProfileService.getAgentProfileByUserId(userId);
    res.json(profile);
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Parse location if it's sent as JSON string
    let location = undefined;
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        try { location = JSON.parse(req.body.location); } catch(e) {}
      } else {
        location = req.body.location;
      }
    }

    const profileData: any = {};
    if (req.body.whatsapp !== undefined) profileData.whatsapp = req.body.whatsapp;
    if (req.body.bio !== undefined) profileData.bio = req.body.bio;
    if (location !== undefined) profileData.location = location;
    
    if (req.file) {
      profileData.profileImage = `/uploads/users/${req.file.filename}`;
    }

    const userData: any = {};
    if (req.body.firstName !== undefined) userData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) userData.lastName = req.body.lastName;
    if (req.body.phone !== undefined) userData.phone = req.body.phone;

    const updatedProfile = await agentProfileService.updateAgentProfile(userId, profileData, userData);
    
    res.json(updatedProfile);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
