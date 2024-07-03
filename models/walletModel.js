const mongoose = require('mongoose')

const transactionShema = new mongoose.Schema({
    amount:{
        type:Number,
        required:true
    },
    transactionMethod:{
        type: String,
        required: true,
        enum: ['Refund','Cancelled']
    },
    date:{
        type:Date,
        default:Date.now
    }
});

const walletSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true,
        index: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [transactionShema]
},
    {timestamps: true});


module.exports = mongoose.model('Wallet',walletSchema);
    