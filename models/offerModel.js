const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({

    offerName:{
       type:String,
       required:true 
    },

    offerType:{
        type:String,
        enum: ['Category Offer','Product Offer'],
        required:true
    },

    discountPercentage:{
        type:Number,
        required:true
    },

    block: {
        type: Boolean,
        default: false
    },

    expiryDate: {
        type: String,
        required: true
    },
    offerItems:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }

},{timestamps:true})

module.exports = mongoose.model('Offers',offerSchema);