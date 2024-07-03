const jwt = require('jsonwebtoken');
const User = require('../../models/userModel')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const errorMessages = require("../../util/errorMessages");
const statusCodes = require("../../util/statusCodes")

const jwtSecret = process.env.JWT_KEY


exports.loadSignIn = asyncHandler((req,res)=>{
    res.render('admin/sign-in')
})

exports.adminSignin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const checkAdmin = await User.findOne({ email: email });

    if (!checkAdmin) {
        return res.status(statusCodes.NOT_FOUND).json({ success: false, message: errorMessages.userNotFound });
    }

    const match = await bcrypt.compare(password, checkAdmin.password);
    if (!match) {
        return res.status(statusCodes.UNAUTHORIZED).json({ success: false, field: 'password', message: errorMessages.invalidPassword });
    }

    if (checkAdmin.is_admin) {
        const token = jwt.sign({ id: checkAdmin._id, email: checkAdmin.email, is_admin: checkAdmin.is_admin }, jwtSecret, { expiresIn: '1h' });

        res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.status(statusCodes.OK).json({ success: true, message: "Admin logged in successfully!" });
    } else {
        res.status(statusCodes.NOT_FOUND).json({ success: false, field: 'email', message: "Access Denied: Not an admin!" });
    }
});


exports.adminLogout = asyncHandler((req,res)=>{
    res.clearCookie('jwt');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
})