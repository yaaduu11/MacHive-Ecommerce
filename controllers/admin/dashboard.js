const asyncHandler = require('express-async-handler')
const User = require('../../models/userModel')
const statusCodes = require("../../util/statusCodes")
const errorMessages = require('../../util/errorMessages')



exports.loadAdminPanel = asyncHandler((req,res)=>{
    res.render('admin/dashboard')
})

exports.loadCustomers = asyncHandler(async(req,res)=>{
    try {
        const users = await User.find({is_admin:false});
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

