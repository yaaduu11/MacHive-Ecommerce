const Orders = require('../../models/orderModel')

exports.loadOrderList = async(req, res) => {
    try {
        const orders = await Orders.find({})
            .populate('userId', 'name')

        res.render('admin/orders', { orders })
    } catch (error) {
        console.log(error)
        res.status(500).send("Server Error")
    }
}

exports.loadOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId; 
        const order = await Orders.findById(orderId).populate({
            path: 'orderItems.product',
            model: 'Varients',
            populate: {
                path: 'productId',
                model: 'Products'
            }
        });

        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('admin/orderDetails', { order });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error loading order details');
    }
};

exports.orderStatusUpdate = async (req, res) => {
    const { orderId, newStatus } = req.body;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderItems.forEach(item => {
            item.orderStatus = newStatus;
        });

        await order.save();
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};