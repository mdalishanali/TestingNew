import * as mongoose from 'mongoose';

export interface Person {
    _id ?: mongoose.Schema.Types.ObjectId;

  name: String;
  pinCode: Number;
  gender: String;
  areaType: String;
  dob: String;
  isAgree: Boolean
}
