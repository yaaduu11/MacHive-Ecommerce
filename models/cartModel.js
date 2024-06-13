const mongoose = require ('mongoose')

const cartSchema = new mongoose.Schema({

    userId :{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required: true
    },
    products :[{
        productVariantId : {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Varients',
            required: true
        },
        quantity :{
            type: String,
            default: 1
        }
    }]
},
{timestamps:true})

module.exports = mongoose.model ('carts',cartSchema);