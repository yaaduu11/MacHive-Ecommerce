const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    code:{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    expiresAt: {
        type: Date,
        expires: 0
    }
});

module.exports = mongoose.model('Otp',otpSchema)