const asyncHandler = require('express-async-handler');
const Coupon = require('../../models/couponModel');
const Order = require('../../models/orderModel');
const Cart = require('../../models/cartModel');

exports.applyCoupon = asyncHandler(async (req, res) => {
    try {
        const { couponCode } = req.body;

        // Check if coupon code is provided
        if (!couponCode) {
            return res.status(400).json({ success: false, error: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ success: false, error: 'Invalid coupon code' });
        }

        if (coupon.block) {
            return res.status(400).json({ success: false, error: 'Coupon is blocked' });
        }

        const currentDate = new Date();
        const expiryDate = new Date(coupon.expiryDate);

        if (currentDate > expiryDate) {
            return res.status(400).json({ success: false, error: 'Coupon has expired' });
        }

        const userId = req.session.userId;

        // Check if the user has already used this coupon
        const existingOrderWithCoupon = await Order.findOne({
            userId,
            'couponDetails.couponCode': couponCode
        });

        if (existingOrderWithCoupon) {
            return res.status(400).json({ success: false, error: 'You have already used this coupon' });
        }

        // Proceed with other validations and calculations
        const cart = await Cart.findOne({ userId }).populate('products.productVariantId');

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        const subTotal = cart.products.reduce((sum, item) => sum + item.productVariantId.salePrice * item.quantity, 0);

        if (subTotal < coupon.minPurchaseAmount) {
            return res.status(400).json({ success: false, error: `Minimum purchase amount is ₹ ${coupon.minPurchaseAmount}` });
        }

        const discountAmount = Math.min((subTotal * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
        const deliveryCharge = 100;
        const grandTotal = subTotal + deliveryCharge - discountAmount;

        res.json({
            success: true,
            discountAmount,
            grandTotal
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to apply coupon' });
    }
});


