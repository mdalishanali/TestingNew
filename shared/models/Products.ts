import * as mongoose from 'mongoose';

export interface Products {
    _id ?: mongoose.Schema.Types.ObjectId;

  name: String;
  price: Number;
  category: String
}
