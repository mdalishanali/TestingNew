import { ObjectId } from 'mongoose';

export interface CompanyInterface {
    name?: string;
    userId?: string;
    status?: string;
    website?: string;
}

export interface RefundInterface {
    chargeId?: string;
    status?:  string;
    created?: Number;
    refundId?: string;
    amount?: Number;
    reason?: string;
    paymentId?: string;
    currency?: string;
    user?: string;
}

export interface FcmTokenInterface {
    userId: ObjectId;
    deviceType: String;
    token:  String;
    isDeleted: Boolean;
}
