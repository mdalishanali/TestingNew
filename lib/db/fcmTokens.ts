import * as mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;
export const FcmTokensSchema = new mongoose.Schema({
    userId : {
        type: ObjectId,
        required: true,
        ref: 'User'
    },
    deviceType: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});
