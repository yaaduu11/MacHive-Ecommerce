const Otp = require('../models/otpModel')
const nodemailer = require("nodemailer")
const { generateRandomOtp, saveOtp } = require("./otpGenerate");


const  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    auth: {
      user: 'yadukrishnankzr@gmail.com',
      pass: 'giid ofbc khrr qwzf'
    }
  });

//  OTP Generation and Sending Function
const sendOtpEmail = async (userEmail,otp) => {
  
  try {
      
      const mailOptions = {
          from: 'yadukrishnankzr@gmail.com', 
          to: userEmail, 
          subject: "Your OTP for Registration",
          text: `Your OTP is ${otp}.`
      };
      await transporter.sendMail(mailOptions);
      // console.log('OTP sent successfully');
  } catch (error) {
      console.error('Failed to send OTP:', error);
  }
};


module.exports = sendOtpEmail