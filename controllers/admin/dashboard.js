const asyncHandler = require('express-async-handler')
const User = require('../../models/userModel')
const statusCodes = require("../../util/statusCodes")
const errorMessages = require('../../util/errorMessages')
const Order = require('../../models/orderModel')
const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')


exports.loadAdminPanel = asyncHandler(async (req, res) => {
    const orders = await Order.find({});
    const totalCustomers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const bestProduct = await Product.findOne({name:'IPHONE 16'})
    const bestCategory = await Category.findOne({name: 'Iphones'})

    const deliveredAndCompletedOrders = await Order.find({
        'orderItems.orderStatus': { $in: ['Delivered', 'Completed'] }
    });

    const totalRevenue = deliveredAndCompletedOrders.reduce((acc, order) => acc + order.grandTotal, 0);

    const today = new Date();
    const oneDay = 1000 * 60 * 60 * 24;

    const currentWeekOrders = deliveredAndCompletedOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return today - orderDate < 7 * oneDay;
    });

    const pastWeekOrders = deliveredAndCompletedOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return today - orderDate >= 7 * oneDay && today - orderDate < 14 * oneDay;
    });

    const todaysEarnings = deliveredAndCompletedOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.toDateString() === today.toDateString();
    }).reduce((acc, order) => acc + order.grandTotal, 0);

    const currentWeekEarnings = currentWeekOrders.reduce((acc, order) => acc + order.grandTotal, 0);
    const pastWeekEarnings = pastWeekOrders.reduce((acc, order) => acc + order.grandTotal, 0);

    res.render('admin/dashboard', {
        orders,
        totalCustomers,
        totalProducts,
        bestProduct,
        bestCategory,
        totalRevenue,
        currentWeekEarnings,
        pastWeekEarnings,
        todaysEarnings
    });
});




exports.loadCustomers = asyncHandler(async(req,res)=>{
    try {
        const users = await User.find({is_admin:false})
        res.render('admin/customers',{users})
    } catch (error) {
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({success:false, message:errorMessages.internalServerError})
    }
})

exports.userBlocking = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findOne({ _id: userId });
        
        user.is_blocked = !user.is_blocked;
        
        await user.save();
        
        res.json({ success: true });
    } catch (error) {
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Could not toggle block status.' });
    }
};

