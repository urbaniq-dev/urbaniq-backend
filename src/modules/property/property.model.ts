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
    area: number; // sqft
    bedrooms?: number;
    bathrooms?: number;
    furnishing?: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
    suitableFor?: string[]; // e.g. ['Office', 'Shop', 'Warehouse']
    zoning?: 'Residential' | 'Commercial' | 'Agricultural' | 'Industrial';
  };
  amenities: string[];
  images: string[];
  documents: string[];
  contactDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Sold' | 'Rented';
  propertyType: 'Villa' | 'Apartment' | 'Penthouse' | 'Commercial' | 'Townhouse' | 'Land';
  ownerId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  views?: number;
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
      area: { type: Number, required: true },
      bedrooms: { type: Number },
      bathrooms: { type: Number },
      furnishing: { type: String, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
      suitableFor: [{ type: String }],
      zoning: { type: String, enum: ['Residential', 'Commercial', 'Agricultural', 'Industrial'] },
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    documents: [{ type: String }],
    contactDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Sold', 'Rented'],
      default: 'Pending Approval',
    },
    propertyType: {
      type: String,
      enum: ['Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse', 'Land'],
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
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProperty>('Property', PropertySchema);
