import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  propertyId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

const VisitSchema: Schema = new Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  },
  { timestamps: true }
);

export default mongoose.model<IVisit>('Visit', VisitSchema);
