const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

    usedList :{
        type :[mongoose.Schema.Types.ObjectId],
        ref: 'userData'
    },
    couponCode :{
        type : String,
        required : true,
    },
    description :{
        type : String,
        required : true
    },
    block :{
        type : Boolean,
        default : false
    },
    discountPercentage :{
        type : Number,
        required : true
    },
    minPurchaseAmount :{
        type : Number,
        required : true
    },
    maxDiscountAmount :{
        type : Number,
        required : true
    },
    expiryDate : {
        type : String,
        required : true
    }

},

{timestamps:true})


module.exports = mongoose.model ('coupon',couponSchema);