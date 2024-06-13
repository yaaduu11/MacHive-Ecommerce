const mongoose = require("mongoose")
const { schema } = require("./categoryModel")

const varientSchema = new mongoose.Schema ({
    productId: {
      type : mongoose.Schema.Types.ObjectId,
      ref: 'Products',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: [String],
      required: true
    },
    color:{
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true
    },
    ram: {
      type: String,
      required: true
    },
    rom: {
      type: String,
      required: true
    },
    regularPrice : {
      type : Number,
      required :true
    },
    salePrice : {
      type : Number,
      required :true
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt:{
      type:Date, 
      default:Date.now()
    },
    is_blocked:{
      type:Boolean,
        default: false
    },
})

module.exports = mongoose.model('Varients',varientSchema)