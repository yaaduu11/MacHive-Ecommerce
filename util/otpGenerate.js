const Otp = require('../models/otpModel')


//generate random otp
exports.generateRandomOtp = function(){
    const length = 6;
    let otp = '';
    for(let i=0;i<length;i++){
        otp += Math.floor(Math.random() *10);
    }
    return otp;
}

//saving the otp in my database
exports.saveOtp = async function (userId, code) {
    try {

        const currentTime = new Date();
        
        // Add 30 seconds to the current time
        currentTime.setSeconds(currentTime.getSeconds() + 20);
       
        const otp = new Otp({
            userId,
            code,
            expiresAt:currentTime
        });

        const otpResult = await otp.save();
        return otpResult;
    } catch (error) {
        console.log(error.message);
        return null;
    }
}

