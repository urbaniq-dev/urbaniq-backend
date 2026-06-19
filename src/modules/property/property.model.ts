import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number; // sqft
  };
  amenities: string[];
  images: string[];
  status: 'Available' | 'Pending' | 'Sold' | 'Rented';
  propertyType: 'Villa' | 'Apartment' | 'Penthouse' | 'Commercial' | 'Townhouse';
  ownerId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
}

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String },
    },
    features: {
      bedrooms: { type: Number, required: true },
      bathrooms: { type: Number, required: true },
      area: { type: Number, required: true },
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['Available', 'Pending', 'Sold', 'Rented'],
      default: 'Available',
    },
    propertyType: {
      type: String,
      enum: ['Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse'],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProperty>('Property', PropertySchema);
