import AgentProfile, { IAgentProfile } from './agentProfile.model';

export const findByUserId = async (userId: string): Promise<IAgentProfile | null> => {
  return await AgentProfile.findOne({ user: userId });
};

export const upsertProfile = async (userId: string, profileData: Partial<IAgentProfile>): Promise<IAgentProfile> => {
  return await AgentProfile.findOneAndUpdate(
    { user: userId },
    { $set: profileData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};
