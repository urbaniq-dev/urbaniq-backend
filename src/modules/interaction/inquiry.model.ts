import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  propertyId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  message: string;
  status: 'Unread' | 'Read' | 'Replied' | 'Closed';
  replyMessage?: string;
}

const InquirySchema: Schema = new Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Unread', 'Read', 'Replied', 'Closed'], default: 'Unread' },
    replyMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);
