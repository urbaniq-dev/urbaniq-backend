import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentProfile extends Document {
  user: mongoose.Types.ObjectId;
  profileImage?: string;
  whatsapp?: string;
  bio?: string;
  location?: {
    city?: string;
    area?: string;
  };
  specialties?: string[];
}

const AgentProfileSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profileImage: { type: String },
    whatsapp: { type: String },
    bio: { type: String },
    location: {
      city: { type: String },
      area: { type: String }
    },
    specialties: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model<IAgentProfile>('AgentProfile', AgentProfileSchema);
