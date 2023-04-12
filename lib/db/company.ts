import * as mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

export const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      mockName: 'name'
    },
    userId: {
      type: ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: [ 'Active', 'InActive' ],
      default: 'Active',
    },
    website: {
      type: String,
      required: false,
      mockName: 'url'
    }
  },
  { timestamps: true }
);
CompanySchema.index(
  { name: 'text', website: 'text' }
);
