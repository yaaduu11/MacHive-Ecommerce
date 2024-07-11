const Coupons = require('../../models/couponModel')
const statusCodes = require('../../util/statusCodes')


exports.loadCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4; 
    const skip = (page - 1) * limit; 

    const totalCoupons = await Coupons.countDocuments({});
    const totalPages = Math.ceil(totalCoupons / limit); 

    const coupons = await Coupons.find({}).skip(skip).limit(limit);

    res.render('admin/coupons', {
      coupons,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
};


exports.loadAddCoupons = async (req, res) => {
  try {
    res.render('admin/AddCoupons')
  } catch (error) {
    console.log(error)
  }
}

exports.loadEditCoupons = async (req, res) => {
  try {
    const couponId = req.params.couponId
    const coupons = await Coupons.findById(couponId)
    res.render('admin/EditCoupons', { coupons })
  } catch (error) {
    console.log(error)
  }
}

exports.addCoupons = async (req, res) => {
  try {
    const { code, description, minamount, maxamount, discount, expirydate } = req.body;

    const newCoupon = new Coupons({
      couponCode: code,
      description: description,
      minPurchaseAmount: minamount,
      maxDiscountAmount: maxamount,
      discountPercentage: discount,
      expiryDate: expirydate
    });

    await newCoupon.save();

    res.status(200).json({ success: true, message: 'Coupon added successfully' });
  } catch (error) {
    console.error('Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add coupon', error: error.message });
    }
  }
};


exports.editCoupon = async (req, res) => {
  try {
    const { couponCode, description, minamount, maxamount, discount, expirydate } = req.body;
    const couponId = req.params.couponId;

    const updatedCouponData = { couponCode, description, minPurchaseAmount: minamount, maxDiscountAmount: maxamount, discountPercentage: discount, expiryDate: expirydate };

    const existingData = await Coupons.findOne({ couponCode: updatedCouponData.couponCode });

    if (existingData && existingData._id.toString() !== couponId) {
      return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'This coupon code is already taken.' });
    }

    const updatedCoupon = await Coupons.findByIdAndUpdate(
      couponId,
      updatedCouponData,
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.status(200).json({ success: true, message: 'Coupon updated successfully', coupons: updatedCoupon });

  } catch (error) {
    console.error('Error:', error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error' });
  }
};

exports.unlistCoupon = async(req, res)=>{
  const couponId = req.params.couponId
  try {
    const coupon = await Coupons.findOne({_id : couponId})

    coupon.block = !coupon.block;
    const updatedCoupon = await coupon.save()
    res.json({ success: true });

  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, couponStatus: updatedCoupon.block, message: 'Could not toggle block status.' });
  }
}
