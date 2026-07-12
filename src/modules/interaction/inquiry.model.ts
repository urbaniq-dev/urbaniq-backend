import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  propertyId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  status: 'Unread' | 'Read' | 'Replied' | 'Closed';
  // Legacy fields for backward compatibility
  message?: string;
  replyMessage?: string;
}

const InquirySchema: Schema = new Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Unread', 'Read', 'Replied', 'Closed'], default: 'Unread' },
    message: { type: String },
    replyMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);
