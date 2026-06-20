import * as agentProfileRepository from './agentProfile.repository';
import User from '../user/user.model';
import { IAgentProfile } from './agentProfile.model';

export const getAgentProfileByUserId = async (userId: string) => {
  const profile = await agentProfileRepository.findByUserId(userId);
  const user = await User.findById(userId).select('firstName lastName email phone isVerified');
  
  if (!user) {
    throw new Error('User not found');
  }

  return {
    ...profile?.toObject(),
    user: user.toObject() // Pre-populate user details
  };
};

export const updateAgentProfile = async (
  userId: string,
  profileData: Partial<IAgentProfile>,
  userData: { firstName?: string; lastName?: string; phone?: string }
) => {
  // Update base User info if provided
  if (Object.keys(userData).length > 0) {
    await User.findByIdAndUpdate(userId, { $set: userData });
  }

  // Upsert Agent Profile
  const updatedProfile = await agentProfileRepository.upsertProfile(userId, profileData);
  
  const user = await User.findById(userId).select('firstName lastName email phone isVerified');
  
  return {
    ...updatedProfile.toObject(),
    user: user?.toObject()
  };
};
