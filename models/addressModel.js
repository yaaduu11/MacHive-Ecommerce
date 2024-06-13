const mongoose = require('mongoose')
const { schema } = require('./productModel')

const addressSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required:true
    },
    name: {
       type: String,
       required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    }   
})

module.exports = mongoose.model('Addresses', addressSchema)