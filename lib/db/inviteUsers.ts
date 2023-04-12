import * as mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

export const InvitedUserSchema = new mongoose.Schema(
  {
    invitedEmail: {
      type: String,
      required: true,
    },
    companyId: {
      type: ObjectId,
      ref: 'Company',
      required: false,
    },
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum : ['Admin', 'Moderator'],
      default: 'Moderator'
    },
    expiry: {
      type: Number,
      default: Date.now() + 1 * (60 * 60 * 1000)
    },
    cancelled: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);
