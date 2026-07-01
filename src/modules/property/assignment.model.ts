import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Accepted' | 'Rejected';
  commissionInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
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
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
    commissionInfo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
