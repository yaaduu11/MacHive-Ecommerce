const Orders = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')
const User = require('../../models/userModel')
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.loadOrderList = async (req, res) => {
  try {
    const orders = await Orders.find({})
      .populate('userId', 'name')

    res.render('admin/orders', { orders })
  } catch (error) {
    console.log(error)
    res.status(500).send("Server Error")
  }
}

function formatNumber(num) {
  const str = num.toString().split('.');
  const integerPart = str[0];
  const decimalPart = str.length > 1 ? '.' + str[1] : '';
  const lastThreeDigits = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  const formattedNumber = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherDigits ? ',' : '') + lastThreeDigits;
  return formattedNumber + decimalPart;
}


exports.loadSalesReport = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 7;
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
      end.setHours(23, 59, 59, 999);

      filter.orderDate = { $gte: start, $lte: end };
    }

    const totalOrders = await Orders.countDocuments(filter);
    const totalGrandTotal = await Orders.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    const orders = await Orders.find(filter)
      .populate({ path: 'userId', select: 'name' })
      .sort({ orderDate: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const grandTotalAmount = totalGrandTotal.length > 0 ? totalGrandTotal[0].total : 0;
    const formattedGrandTotalAmount = formatNumber(grandTotalAmount);

    res.render('admin/salesReport', {
      orders,
      sortBy,
      startDate,
      endDate,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / ITEMS_PER_PAGE),
      totalOrders,
      grandTotalAmount: formattedGrandTotalAmount
    });
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

    // Add title
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();

    // Define table headers
    const tableTop = 100;
    const itemLeftMargin = 50;
    const columnWidths = [40, 150, 100, 80, 70, 100];

    doc.fontSize(12)
      .text('No', itemLeftMargin, tableTop, { width: columnWidths[0], align: 'left' })
      .text('Order ID', itemLeftMargin + columnWidths[0], tableTop, { width: columnWidths[1], align: 'left' })
      .text('User Name', itemLeftMargin + columnWidths[0] + columnWidths[1], tableTop, { width: columnWidths[2], align: 'left' })
      .text('Date', itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, { width: columnWidths[3], align: 'left' })
      .text('Status', itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop, { width: columnWidths[4], align: 'left' })
      .text('Grand Total', itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], tableTop, { width: columnWidths[5], align: 'left' });

    let position = tableTop + 20;

    orders.forEach((order, index) => {
      let displayed = false;
      order.orderItems.forEach((item) => {
        if (!displayed && (item.orderStatus === 'Delivered' || item.orderStatus === 'Completed')) {
          doc.fontSize(10)
            .text(index + 1, itemLeftMargin, position, { width: columnWidths[0], align: 'left' })
            .text(order._id.toString(), itemLeftMargin + columnWidths[0], position, { width: columnWidths[1], align: 'left' })
            .text(order.userId.name, itemLeftMargin + columnWidths[0] + columnWidths[1], position, { width: columnWidths[2], align: 'left' })
            .text(order.orderDate.toLocaleDateString(), itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2], position, { width: columnWidths[3], align: 'left' })
            .text(item.orderStatus, itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], position, { width: columnWidths[4], align: 'left' })
            .text(`${order.grandTotal.toFixed(2)}`, itemLeftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], position, { width: columnWidths[5], align: 'left' });
          position += 20;
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
