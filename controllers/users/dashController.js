const User = require('../../models/userModel')
const Adress = require('../../models/addressModel');
const statusCodes = require('../../util/statusCodes');
const Order = require('../../models/orderModel')
const Coupon = require('../../models/couponModel')
const Wallet = require('../../models/walletModel')
const bcrypt = require("bcrypt")

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;


exports.loadMyAccount = async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/sign-in');
    }

    try {
        const ITEMS_PER_PAGE = 4; 
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1;

        const [user, address, ordersCount, orders, coupons, wallet] = await Promise.all([
            User.findById(userId),
            Adress.find({ userId }),
            Order.countDocuments({ userId }),
            Order.find({ userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
                .populate({
                    path: 'orderItems.product',
                    model: 'Varients',
                    populate: {
                        path: 'productId',
                        model: 'Products'
                    }
                }),
            Coupon.find({block:false}),
            Wallet.findOne({ userID: userId })
        ]);

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        const totalPages = Math.ceil(ordersCount / ITEMS_PER_PAGE);

        res.render('users/myAccount', {
            user,
            address,
            orders,
            coupons,
            wallet,
            errors: {},
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Load Account Error:', error);
        res.status(500).send('Internal Server Error');
    }
};


exports.userDataEdit = async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/sign-in');
    }

    try {
        const userId = req.session.userId;
        const { name, email, mobile } = req.body;

        await User.findByIdAndUpdate(userId, {
            name: name,
            email: email,
            mobile: mobile
        });

        res.redirect('/myAccount');
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

exports.changePassword = async (req, res) => {
    try {
        const userId = req.session.userId;

        const { currentPassword, newPassword, confirmPassword } = req.body;
        const errors = {};

        const user = await User.findById(userId);

        if (!user) {
            errors.general = 'User not found';
            return res.json({ success: false, errors });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            errors.currentPassword = 'Current password is incorrect';
        }

        if(currentPassword == newPassword){
            errors.newPassword = 'Current password and new password must be different.'
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'New password and confirm password do not match';
        }

        if (!passwordRegex.test(newPassword)) {
            errors.newPassword = 'Password must be at least 6 characters long and contain at least one letter and one number';
        }

        if (Object.keys(errors).length > 0) {
            return res.json({ success: false, errors });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        return res.json({ success: true, successMessage: 'Password updated successfully' });

    } catch (error) {
        console.error('Password Update Error:', error);
        res.status(500).send('Internal Server Error');
    }
};


exports.insertAddress = async (req, res) => {
    try {
        const { name, mobile, city, address, state, pincode } = req.body;

        if (!name || !mobile || !city || !address || !state || !pincode) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'All inputs required' });
        }

        const userId = req.session.userId;

        const addressObject = new Adress({
            name,
            mobile,
            city,
            address,
            state,
            pincode,
            userId
        });

        const savedAddress = await addressObject.save();

        return res.status(statusCodes.OK).json({ success: true, message: 'Address added successfully', address: savedAddress });
    } catch (error) {
        console.error('Error:', error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteAddress = async (req, res) => {
    const itemId = req.params.id;
    try {
        const result = await Adress.findByIdAndDelete(itemId);

        if (result) {
            res.status(200).json({ success: true, message: 'Address deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Address not found' });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.editAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { name, mobile, city, address, state, pincode } = req.body;

        const updatedAddressData = { name, mobile, city, address, state, pincode };

        const updatedAddress = await Adress.findByIdAndUpdate(
            addressId,
            updatedAddressData,
            { new: true }
        );

        if (updatedAddress) {
            res.status(200).json({ message: 'Address updated successfully' });
        } else {
            res.status(404).json({ message: 'Address not found' });
        }

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.logoutUser = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("logout succesful");
        }
        res.redirect('/sign-in');
    });
}