const mongoose = require("mongoose");

const productSchema = new mongoose.Schema ({
    name: {
        type: String,
        required: true,
        unique: true,
      },
      image: {
        type: String,
        required: true
      },
      categoryId: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required :true
      },
      brand : {
        type : String,
        required :true
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: Boolean,
        default:false
      },
      tags : {
        type: [String],
        default: [],
        required: false
      },
      createdAt: {
        type: Date,
        default: Date.now()
      },
      is_delete:{
        type:Boolean,
        default:false
      }
})

module.exports = mongoose.model('Products',productSchema);