const Orders = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')
const User = require('../../models/userModel')
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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

exports.loadSalesReport = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 7
        const { sortBy = 'All Orders', startDate, endDate, page = 1 } = req.query;
        let filter = {
            'orderItems.orderStatus': { $in: ['Delivered', 'Completed'] }
        };

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today.setDate(today.getDate() - 7));
        const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));

        if (sortBy === 'Today') {
            filter.orderDate = { $gte: startOfToday };
        } else if (sortBy === 'Last 7 Days') {
            filter.orderDate = { $gte: startOfWeek };
        } else if (sortBy === 'Last 30 Days') {
            filter.orderDate = { $gte: startOfMonth };
        } else if (sortBy === 'Custom Date' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set the end date to the end of the day

            filter.orderDate = { $gte: start, $lte: end };
        }

        const totalOrders = await Orders.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

        const orders = await Orders.find(filter)
            .populate({ path: 'userId', select: 'name' })
            .sort({ orderDate: -1 })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        res.render('admin/salesReport', { orders, sortBy, startDate, endDate, currentPage: parseInt(page), totalPages });
    } catch (error) {
        console.error('Error loading sales report:', error);
        res.status(500).send('Failed to load sales report');
    }
};

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
        const order = await Orders.findById(orderId).populate('userId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderItems.forEach(item => {
            item.orderStatus = newStatus;
        });

        if (newStatus === 'Refunded' && order.paymentMethod === 'razorpay') {
            const userId = order.userId._id;
            const refundAmount = order.grandTotal;

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
                transactionMethod: 'Refund',
                date: new Date()
            });

            await wallet.save();
        }

        await order.save();
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.downloadExcel = async (req, res) => {
    try {
      const { sortBy, startDate, endDate } = req.query;
      let filter = {
        'orderItems.orderStatus': { $in: ['Delivered', 'Completed'] }
      };
  
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - 7));
      const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));
  
      if (sortBy === 'Today') {
        filter.orderDate = { $gte: startOfToday };
      } else if (sortBy === 'Last 7 Days') {
        filter.orderDate = { $gte: startOfWeek };
      } else if (sortBy === 'Last 30 Days') {
        filter.orderDate = { $gte: startOfMonth };
      } else if (startDate && endDate) {
        filter.orderDate = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
  
      const orders = await Orders.find(filter)
        .populate({ path: 'userId', select: 'name' })
        .sort({ orderDate: -1 });
  
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
  
      worksheet.columns = [
        { header: 'No.', key: 'no', width: 5 },
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Coupon Applied', key: 'coupon', width: 15 },
        { header: 'Grand Total', key: 'total', width: 15 }
      ];
  
      orders.forEach((order, index) => {
        let displayed = false;
        order.orderItems.forEach((item) => {
          if (!displayed && (item.orderStatus === 'Delivered' || item.orderStatus === 'Completed')) {
            worksheet.addRow({
              no: index + 1,
              orderId: order._id,
              userName: order.userId.name,
              date: order.orderDate.toLocaleDateString(),
              status: item.orderStatus,
              coupon: order.couponDetails ? 'Yes' : 'No',
              total: order.grandTotal.toFixed(2)
            });
            displayed = true;
          }
        });
      });
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      res.status(500).send('Failed to download Excel report');
    }
  };
  
  exports.downloadPdf = async (req, res) => {
    try {
      const { sortBy, startDate, endDate } = req.query;
      let filter = {
        'orderItems.orderStatus': { $in: ['Delivered', 'Completed'] }
      };
  
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - 7));
      const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));
  
      if (sortBy === 'Today') {
        filter.orderDate = { $gte: startOfToday };
      } else if (sortBy === 'Last 7 Days') {
        filter.orderDate = { $gte: startOfWeek };
      } else if (sortBy === 'Last 30 Days') {
        filter.orderDate = { $gte: startOfMonth };
      } else if (startDate && endDate) {
        filter.orderDate = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
  
      const orders = await Orders.find(filter)
        .populate({ path: 'userId', select: 'name' })
        .sort({ orderDate: -1 });
  
      // Generate PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
      doc.pipe(res);
  
      doc.fontSize(20).text('Sales Report', { align: 'center' });
      doc.moveDown();
  
      orders.forEach((order, index) => {
        let displayed = false;
        order.orderItems.forEach((item) => {
          if (!displayed && (item.orderStatus === 'Delivered' || item.orderStatus === 'Completed')) {
            doc.fontSize(12).text(`No: ${index + 1}`);
            doc.fontSize(12).text(`Order ID: ${order._id}`);
            doc.fontSize(12).text(`User Name: ${order.userId.name}`);
            doc.fontSize(12).text(`Date: ${order.orderDate.toLocaleDateString()}`);
            doc.fontSize(12).text(`Status: ${item.orderStatus}`);
            doc.fontSize(12).text(`Coupon Applied: ${order.couponDetails ? 'Yes' : 'No'}`);
            doc.fontSize(12).text(`Grand Total: ₹${order.grandTotal.toFixed(2)}`);
            doc.moveDown();
            displayed = true;
          }
        });
      });
  
      doc.end();
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      res.status(500).send('Failed to download PDF report');
    }
  };