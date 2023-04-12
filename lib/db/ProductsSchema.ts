
      
      import * as mongoose from 'mongoose';
      const ObjectId = mongoose.Schema.Types.ObjectId;
      import {category} from '../../shared/enums/enum';
      export const ProductsSchema = new mongoose.Schema( {
    name: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    category: {
        type: String,
        required: false,
        enum: category
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
      ProductsSchema.index(
      {name:"text",}
    )
      