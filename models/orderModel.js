const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Varients',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            default: 'Processing',
            enum: ['Pending', 'Payment pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed', 'Return requested', 'Return approved', 'Return Rejected', 'Refunded'],
        },
        productPrice: {
            type: Number,
            required: true
        },
        returnReason: {
            type: String
        },
    }],
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: true
    },
    subTotal: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: String,
    },
    grandTotal: {
        type: Number,
        required: true
    },
    shippingAddress: {
        name: { type: String, required: true },
        mobile: { type: Number, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: Number, required: true },
    },
    razorpayOrderId: {
        type: String,
    },
    razorpayPaymentId: {
        type: String
    },
    couponDetails: {
        discountPercentage: {
            type: Number
        },
        claimedAmount: {
            type: Number
        },
        couponCode: {
            type: String
        },
        minPurchaseAmount: {
            type: Number
        },
        maxDiscountAmount: {
            type: Number
        },
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);


//     offerDiscount :{
//         type : Number
//     }

