import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Owner' | 'Agent' | 'Buyer';
  googleId?: string;
  isVerified: boolean;
  status: 'Active' | 'Blocked';
  profileImage?: string;
  phone?: string;
  agentProfile?: {
    bio?: string;
    experienceYears?: number;
    specialties?: string[];
    languages?: string[];
    verificationDocument?: string;
    location?: {
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
      operatingAreas?: string[];
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
  savedProperties?: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { 
      type: String, 
      required: true, 
      enum: ['Admin', 'Owner', 'Agent', 'Buyer'],
      default: 'Buyer'
    },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false }, // Useful for agents
    status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' },
    profileImage: { type: String },
    phone: { type: String },
    agentProfile: {
      bio: { type: String },
      experienceYears: { type: Number },
      specialties: [{ type: String }],
      languages: [{ type: String }],
      verificationDocument: { type: String },
      location: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zipCode: { type: String },
        operatingAreas: [{ type: String }],
      },
      socialLinks: {
        linkedin: { type: String },
        twitter: { type: String },
        website: { type: String },
      },
    },
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
