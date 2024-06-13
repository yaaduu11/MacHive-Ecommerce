const Address = require('../../models/addressModel')
const Cart = require('../../models/cartModel')
const Order = require('../../models/orderModel')
const User = require('../../models/userModel')
const Variant = require('../../models/variantModel')
const Razorpay = require('razorpay');
require('dotenv').config();
const crypto = require('crypto');


exports.loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        const [cart, addresses] = await Promise.all([
            Cart.find({ userId: userId }).populate({
                path: 'products.productVariantId',
                model: 'Varients',
                populate: {
                    path: 'productId', 
                    model: 'Products'
                }
            }),
            Address.find({ userId: userId })
        ]);

        res.render('users/checkout', { cart, addresses });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;
        const userId = req.session.userId;

        if (!addressId || !paymentMethod || !userId) {
            return res.status(400).send('Invalid order data');
        }

        const cart = await Cart.findOne({ userId }).populate('products.productVariantId');

        if (!cart || cart.products.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            return res.status(400).send('Address not found');
        }

        const orderItems = cart.products.map(item => {
            if (!item.productVariantId || !item.productVariantId.productId) {
                throw new Error('Product details are incomplete in the cart');
            }
            return {
                product: item.productVariantId._id,
                quantity: item.quantity,
                productPrice: item.productVariantId.salePrice,
                orderStatus: paymentMethod === 'razorpay' ? 'Pending' : 'Processing',
            };
        });

        const subTotal = orderItems.reduce((sum, item) => sum + item.quantity * item.productPrice, 0);
        const deliveryCharge = 100;
        const grandTotal = subTotal + deliveryCharge;

        const order = new Order({
            userId,
            orderItems,
            paymentMethod,
            subTotal,
            deliveryCharge,
            grandTotal,
            orderStatus: paymentMethod === 'razorpay' ? 'Pending' : 'Processing',
            shippingAddress: {
                name: address.name,
                mobile: address.mobile,
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
        });

        if (paymentMethod === 'razorpay') {
            const options = {
                amount: grandTotal * 100, 
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`,
            };

            const razorpayOrder = await razorpay.orders.create(options);
            order.razorpayOrderId = razorpayOrder.id;
            await order.save();

            return res.json({
                message: 'Order created',
                razorpayOrderId: order.razorpayOrderId,
                orderId: order._id,
                key_id: process.env.RAZORPAY_KEY_ID,
                amount: grandTotal * 100
            });
        }

        await order.save();
        await Cart.findOneAndDelete({ userId });

        res.send('Order placed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error placing order: ' + error.message);
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: orderId },
                { razorpayPaymentId: paymentId, orderStatus: 'Processing' },
                { new: true }
            );

            if (!order) {
                return res.status(400).send('Order not found');
            }

            await Cart.findOneAndDelete({ userId: order.userId });

            res.send('Payment verified successfully');
        } else {
            res.status(400).send('Payment verification failed');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error verifying payment: ' + error.message);
    }
};


exports.cancelOrder = async(req,res)=>{
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId);
        if (order) {
            order.orderItems.forEach(item => item.orderStatus = 'Cancelled');
            await order.save();
            res.json({ success: true, message: 'Order cancelled successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

exports.loadThankYou = async(req,res)=>{
    try {
        res.render('users/thankyou')
    } catch (error) {
        console.log(error)
    }
}