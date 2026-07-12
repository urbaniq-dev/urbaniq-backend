import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  inquiryId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  isCollaboration?: boolean;
  senderId: mongoose.Types.ObjectId;
  text: string;
}

const MessageSchema: Schema = new Schema(
  {
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', required: false },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: false },
    isCollaboration: { type: Boolean, default: false },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
