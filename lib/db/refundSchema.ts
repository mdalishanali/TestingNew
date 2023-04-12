import * as mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

export const RefundsSchema = new mongoose.Schema(
  {
    chargeId: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: false,
    },
    created: {
        type: Number,
    },
    refundId: {
        type: String,
        required: false,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: false
    },
    paymentId: {
        type: ObjectId,
        required: true
    },
    currency: {
        type: String,
        required: false
    },
    user: {
        type: ObjectId,
        ref: 'User',
        index: true
    }
  },
  { timestamps: true }
);
RefundsSchema.index(
    { chargeId: 'text', refundId: 'text', paymentId: 'text' }
);
