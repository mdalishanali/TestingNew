

import * as mongoose from 'mongoose';
import { foods, gender, skills } from '../../shared/enums/enum';
const ObjectId = mongoose.Schema.Types.ObjectId;
// import { gender } from '../../shared/enums/enum'; 
// import { skills } from '../../shared/enums/enum'; 
// import { foods } from '../../shared/enums/enum';
export const PersonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    pinCode: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: gender
    },
    skills: {
        type: Array,
        required: true,
        // enum: skills
    },
    food: {
        type: Array,
        required: true,
    },
    areaType: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    isAgree: {
        type: Boolean,
        required: true
    },
    companyId: {
        type: ObjectId,
        required: false,
        ref: "Company"
    },
    userId: {
        type: ObjectId,
        required: false,
        ref: "User"
    }
}, { timestamps: true });
PersonSchema.index(
    { name: "text", }
)
