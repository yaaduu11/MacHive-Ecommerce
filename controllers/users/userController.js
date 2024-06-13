const User = require('../../models/userModel')
const Products = require('../../models/productModel') 
const Variants = require('../../models/variantModel')
const Categories = require('../../models/categoryModel')
const bcrypt = require("bcrypt")
const sendOtpEmail = require('../../util/sendMail')
const jsonwebtoken = require('jsonwebtoken')
const { isAuthenticated, logout } = require('../../middleware/authMiddleware');


//! importing user otp
const Otp = require('../../models/otpModel')
const {generateRandomOtp, saveOtp} =require('../../util/otpGenerate')

const loadHome = async (req,res) =>{
    try {
        res.status(200).render('users/home')
    } catch (error) {
        console.log(error.message)
    }
}

const loadShop = async (req,res) =>{
    try {
        const [ products, variants, categories ] = await Promise.all ([
            Products.find({}).populate('categoryId'),
            Variants.find({}),
            Categories.find({})
        ])
        
        res.status(200).render('users/shop',{ products, variants, categories })
    } catch (error) {
        console.log(error.message)
    }
}

const loadSignIn = async (req,res) =>{
    try {
        res.status(200).render('users/sign-in')
    } catch (error) {
        console.log(error.message)
    }
}

const loadSignUp = async (req,res)=>{
    try {
        res.status(200).render('users/sign-up')
    } catch (error) {
        console.log(error.message);
    }
}



////////!inserting user
const insertUser = async (req, res) => {
    try {
       
        const { name, email, mobile, password } = req.body;
        const checkEmail = await User.find({ email });
        // console.log(checkEmail)
        if (checkEmail.length === 0) {
            const [hashedPassword, otpCode] = await Promise.all([
                bcrypt.hash(password, 10),
                generateRandomOtp()
            ]);

            // Create user
            const user = new User({
                name,
                email,
                mobile,
                password: hashedPassword
            });
            const savedUser = await user.save();
            
            const savedOtp = await saveOtp(savedUser._id, otpCode);

            const userData = { userId: savedOtp.userId };
            console.log(userData)
            const jwtToken = jsonwebtoken.sign(userData, process.env.JWT_KEY);
            
            // Set cookie
            res.cookie('jwtToken', jwtToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            });

           

            sendOtpEmail(email, savedOtp.code).then(() => {
                // console.log('OTP sent to:', email);
            }).catch(err => {
                console.error('Error sending OTP email:', err);
            });
            
            res.json({success:true});
            
           
        } else {
            res.json({success:false, message:"Email is already in use"});
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred on the server.");
    }
};



const loadOtp = async (req,res) =>{
    try {
        res.status(200).render('users/otp')
    } catch (error) {
        console.log(error.message);
    }
}


//////!checking otp is true
//////! verifying the user
const userVerification = async (req, res) => {
    try {
        
        const {A,B,C,D,E,F} = req.body
        const enteredOtp = A+B+C+D+E+F
        console.log(enteredOtp);

        const decodedjwt = jsonwebtoken.decode(req.cookies.jwtToken);
        const userId = decodedjwt.userId;

        const savedOtp = await Otp.findOne({ userId:decodedjwt.userId });
        
        if (savedOtp) {
            if (savedOtp.code === enteredOtp && savedOtp.userId.equals(decodedjwt.userId)) {
                await User.updateOne({ _id: userId }, { is_verified: true });

                res.redirect('/sign-in');
            } else {
                res.status(400).json({success:false, message:"Invalid OTP"});
            }
        } else {
            res.status(400).send("<script>alert('Failed to verify otp. Please resend OTP'); window.history.back();</script>");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("<script>alert('Internal server error'); window.history.back();</script>");
    }
};


const resendOtp = async (req, res) => {
    try {
        const jwtUserId = jsonwebtoken.decode(req.cookies.jwtToken).userId;
        
        const userData = await User.findById(jwtUserId);
        const otpCode = await generateRandomOtp();

        const { code } = await saveOtp(jwtUserId, otpCode);

        await sendOtpEmail(userData.email, code);

        res.status(200).redirect('/otp');


    } catch (error) {
        console.log(error);
        res.status(500).send("<script>alert('Internal server error'); window.history.back();</script>");
    }
}

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, errorField: 'general', message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, errorField: 'email', message: 'No user found with that email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, errorField: 'password', message: 'Incorrect password' });
        }

        req.session.userId = user._id;
        req.session.isAuthenticated = true;

        res.json({ success: true });
    } catch (error) {
        console.error('SignIn Error:', error);
        res.status(500).json({ success: false, errorField: 'general', message: 'Internal server error' });
    }
};



module.exports = {
    loadHome,
    loadShop,
    loadSignIn,
    insertUser,
    loadSignUp,
    loadOtp,
    userVerification,
    resendOtp,
    signIn
};
