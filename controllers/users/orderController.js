const Address = require('../../models/addressModel')
const Cart = require('../../models/cartModel')
const Order = require('../../models/orderModel')
const User = require('../../models/userModel')
const Coupon = require('../../models/couponModel')
const Variant = require('../../models/variantModel')
const Wallet = require('../../models/walletModel')
const Razorpay = require('razorpay');
const asyncHandler = require('express-async-handler');
require('dotenv').config();
const crypto = require('crypto');
const PDFDocument = require('pdfkit');


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
            orderStatus: 'Processing',
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
                couponReversedAmount: 0 
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

            return res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error verifying payment: ' + error.message });
    }
};

exports.returnOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;
        const { reason } = req.body;

        const order = await Order.findOneAndUpdate(
            { _id: orderId, "orderItems._id": itemId },
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

exports.invoice = async (req, res) => {
    const orderDetails = req.body;

    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfData);
    });

    // Add content to PDF
    doc.fontSize(18).text(`Invoice`, { align: 'center' });
    doc.fontSize(12).text(`Order Date: ${new Date(orderDetails.orderDate).toDateString()}`, { align: 'center' });
    doc.moveDown().moveDown(); // Add space between the header and the order details

    // Table headers
    let y = 150; // Starting y position after header
    doc.fontSize(12)
        .text('Product', 50, y)
        .text('Quantity', 200, y)
        .text('Amount', 300, y)
        .text('Status', 400, y)
    y += 20;

    // Table rows
    orderDetails.orderItems.forEach((item) => {
        doc.fontSize(10)
            .text(item.product.productId.name, 50, y)
            .text(item.quantity, 200, y)
            .text(`${item.productPrice}`, 300, y)
            .text(item.orderStatus, 400, y)
        y += 20;
    });

    y += 20; // Extra space before the next section

    // Order Summary
    doc.fontSize(16).text('Order Summary', 50, y);
    y += 20;
    doc.fontSize(12)
        .text(`Order Status: ${orderDetails.orderItems[0].orderStatus}`, 50, y)
        .text(`Payment Method: ${orderDetails.paymentMethod}`, 50, y + 20)
        .text(`Sub Total:  ${orderDetails.subTotal}`, 50, y + 40)
        .text(`Shipping Charge:  100.00`, 50, y + 60)
        .text(`Total Amount:  ${orderDetails.grandTotal}`, 50, y + 80);

    y += 120; // Extra space before the next section

    // User Address
    doc.fontSize(16).text('User Address', 300, y);
    y += 20;
    doc.fontSize(12)
        .text(`Name: ${orderDetails.shippingAddress.name}`, 300, y)
        .text(`Mobile: ${orderDetails.shippingAddress.mobile}`, 300, y + 20)
        .text(`City: ${orderDetails.shippingAddress.city}`, 300, y + 40)
        .text(`Address: ${orderDetails.shippingAddress.address}`, 300, y + 60)
        .text(`State: ${orderDetails.shippingAddress.state}`, 300, y + 80)
        .text(`Pincode: ${orderDetails.shippingAddress.pincode}`, 300, y + 100);

    doc.end();
};

exports.cancelOrder = async (req, res) => {
    const { orderId, itemId } = req.params;
    console.log(`Received cancel request for orderId: ${orderId}, itemId: ${itemId}`);

    try {
        const order = await Order.findOne({ _id: orderId, 'orderItems._id': itemId }).populate('userId');

        if (!order) {
            console.log(`Order or item not found: orderId=${orderId}, itemId=${itemId}`);
            return res.status(404).json({ success: false, message: 'Order or item not found' });
        }

        const orderItem = order.orderItems.id(itemId);
        if (!orderItem) {
            console.log(`Order item not found: ${itemId}`);
            return res.status(404).json({ success: false, message: 'Order item not found' });
        }

        orderItem.orderStatus = 'Cancelled';

        // Process refund if payment method is Razorpay
        if (order.paymentMethod === 'razorpay') {
            const userId = order.userId._id;
            const price = orderItem.productPrice || 0;
            const quantity = orderItem.quantity || 0;
            const refundAmount = price * quantity;

            console.log(`Refund amount calculated: ${refundAmount} (price: ${price}, quantity: ${quantity})`);

            if (isNaN(refundAmount)) {
                console.error('Refund amount is NaN. Check price and quantity values.');
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }

            let wallet = await Wallet.findOne({ userID: userId });

            if (!wallet) {
                wallet = new Wallet({
                    userID: userId,
                    balance: 0,
                    transactions: []
                });
            }

            wallet.balance += refundAmount;

            wallet.transactions.push({
                amount: refundAmount,
                transactionMethod: 'Cancelled',
                date: new Date()
            });

            await wallet.save();
        }

        await order.save();
        console.log(`Order item ${itemId} in order ${orderId} cancelled successfully`);
        res.json({ success: true, message: 'Order item cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


