const Address = require('../../models/addressModel')
const Cart = require('../../models/cartModel')
const Order = require('../../models/orderModel')
const User = require('../../models/userModel')
const Coupon = require('../../models/couponModel')
const Variant = require('../../models/variantModel')
const Razorpay = require('razorpay');
const asyncHandler = require('express-async-handler');
require('dotenv').config();
const crypto = require('crypto');


exports.loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/sign-in');
        }

        const [cart, addresses, user] = await Promise.all([
            Cart.find({ userId: userId }).populate({
                path: 'products.productVariantId',
                model: 'Varients', 
                populate: {
                    path: 'productId',
                    model: 'Products'
                }
            }),
            Address.find({ userId: userId }),
            User.findById(userId)
        ]);

        if (!user) {
            return res.status(404).send('User not found');
        }

        let subtotal = 0;
        cart.forEach(cartItem => {
            cartItem.products.forEach(product => {
                subtotal += product.productVariantId.salePrice * product.quantity;
            });
        });

        res.render('users/checkout', { cart, addresses, subtotal, user });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.placeOrder = asyncHandler(async (req, res) => {
    try {
        const { addressId, paymentMethod, couponCode } = req.body;
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
                orderStatus: 'Processing', // Set to 'Processing' for all items
            };
        });

        const subTotal = orderItems.reduce((sum, item) => sum + item.quantity * item.productPrice, 0);
        const deliveryCharge = 100;
        let grandTotal = subTotal + deliveryCharge;

        let discountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode });
            if (!coupon) {
                return res.status(404).json({ error: 'Invalid coupon code' });
            }

            if (coupon.block) {
                return res.status(400).json({ error: 'Coupon is blocked' });
            }

            const currentDate = new Date();
            const expiryDate = new Date(coupon.expiryDate);

            if (currentDate > expiryDate) {
                return res.status(400).json({ error: 'Coupon has expired' });
            }

            if (subTotal < coupon.minPurchaseAmount) {
                return res.status(400).json({ error: `Minimum purchase amount is ₹ ${coupon.minPurchaseAmount}` });
            }

            discountAmount = Math.min((subTotal * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
            grandTotal -= discountAmount;
        }

        const order = new Order({
            userId,
            orderItems,
            paymentMethod,
            subTotal,
            deliveryCharge,
            grandTotal,
            orderStatus: 'Processing', // Set to 'Processing' for the whole order
            shippingAddress: {
                name: address.name,
                mobile: address.mobile,
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
        });

        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode });
            order.couponDetails = {
                discountPercentage: coupon.discountPercentage,
                claimedAmount: discountAmount,
                couponCode,
                minPurchaseAmount: coupon.minPurchaseAmount,
                maxDiscountAmount: coupon.maxDiscountAmount,
                couponReversedAmount: 0 // This field can be used later if you need to reverse the coupon
            };
        }

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

        // Reduce product quantities
        // for (const item of orderItems) {
        //     await Variant.updateOne(
        //         { _id: item.product },
        //         { $inc: { stockQuantity: -item.quantity } }
        //     );
        // }

        res.send('Order placed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error placing order: ' + error.message);
    }
});    

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

exports.returnOrder = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const { reason } = req.body;

        const order = await Order.findOneAndUpdate(
            { "orderItems._id": orderId },
            {
                $set: {
                    "orderItems.$.orderStatus": "Return requested",
                    "orderItems.$.returnReason": reason
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Return request submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.loadThankYou = async(req,res)=>{
    try {
        const latestOrder = await Order.findOne().sort({ createdAt: -1 }).limit(1);
        if (!latestOrder) {
            throw new Error('No orders found.');
        }
        res.render('users/thankyou', { orderId: latestOrder._id }); 
    } catch (error) {
        console.error('Error fetching latest order:', error);
        res.status(500).send('Error fetching latest order');
    }
}

exports.loadTrackOrder = async(req,res) =>{

    const orderId = req.query.orderId;
    try {
        const orderDetails = await Order.findById(orderId).populate({
            path: 'orderItems.product',
            model: 'Varients',
            populate: {
                path: 'productId',
                model: 'Products'
            }
        });

        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }
        res.render('users/trackOrder', { orderDetails });
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).send('Error fetching order');
    }
}

exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    console.log(`Received cancel request for orderId: ${orderId}`);

    try {
        // Attempt to find the order by ID
        // const order = await Order.findOne({'orderItems.product'});
        
        // Log the result of the find operation
        console.log(`Order search result: ${order}`);

        if (!order) {
            console.log(`Order not found: ${orderId}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Log the found order
        console.log(`Order found: ${orderId}`, order);

        // Update the status of each order item
        order.orderItems.forEach(item => {
            console.log(`Cancelling item: ${item._id}`);
            item.orderStatus = 'Cancelled';
        });

        // Save the updated order
        await order.save();
        console.log(`Order ${orderId} cancelled successfully`);
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};