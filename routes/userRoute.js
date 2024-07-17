const express = require("express")
const router = express.Router()
const userController = require("../controllers/users/userController")
const shopController = require('../controllers/users/shopController')
const dashController = require('../controllers/users/dashController')
const orderController = require('../controllers/users/orderController')
const couponController = require('../controllers/users/couponController')
const authUser = require('../middleware/authMiddleware')


//////////////! loading nav items
router.get('/', userController.loadHome)
router.get('/shop', userController.loadShop)
router.get('/about', userController.loadAboutUs);
router.get('/contact', userController.loadContactUs);


//////////////! sign-up side
router.get('/sign-up',authUser.loginedUser, userController.loadSignUp)
router.post('/sign-up', userController.insertUser)


//////////////! sign in side
router.get('/sign-in',authUser.loginedUser, userController.loadSignIn)
router.post('/sign-in', userController.signIn)

router.post('/api/google-authentication', userController.googleAuthSignIn);


//////////////!  logout side
router.get('/logout',authUser.isAuthenticated,  dashController.logoutUser)


//////////////! otp route
router.get('/otp',authUser.loginedUser, userController.loadOtp)
router.post('/otp', userController.userVerification)


//////////////! resend otp
router.post('/resend-otp', userController.resendOtp)


//////////////! shop side
router.get('/product_Details/:productId', shopController.loadProductDetails)


//////////////! My account
router.get('/myAccount',authUser.isAuthenticated,  dashController.loadMyAccount)
router.post('/update-profile', dashController.userDataEdit)
router.post('/update-password', dashController.changePassword)


//////////////! address
router.post('/myAccount', dashController.insertAddress)
router.post('/myAccount/:addressId', dashController.editAddress);
router.delete('/delete-address/:id', dashController.deleteAddress)


//////////////! Cart
router.get('/cart', authUser.isAuthenticated, shopController.loadCart)
router.post('/cart', authUser.isAuthenticated, shopController.addToCart)
router.post('/update-cart-quantity', shopController.cartQuantityUpdate)
router.post('/check-stock', shopController.checkStock)
router.delete('/remove-from-cart', shopController.removeItemCart)


////////////////!  wishlist
router.get('/wishlist',authUser.isAuthenticated,  shopController.loadWishlist)
router.post('/wishlist', shopController.addToWishlist)
router.delete('/remove-from-wishlist', shopController.removeFromWishlist);


//////////////! Checkout
router.get('/checkout',authUser.isAuthenticated,  orderController.loadCheckout)


//////////////!  Coupon 
router.post('/applyCoupon', couponController.applyCoupon)

//////////////! Order
router.post('/placeOrder', orderController.placeOrder)
router.post('/repayment', orderController.repayment)
router.post('/verifyPayment',  orderController.verifyPayment)
router.post('/paymentFailed', orderController.paymentFailed);
router.post('/request-return/:orderId/:itemId', orderController.returnOrder)
router.post('/cancel-order/:orderId/:itemId', orderController.cancelOrder);
router.get('/thankyou',authUser.isAuthenticated, orderController.loadThankYou)
router.get('/trackOrder',authUser.isAuthenticated, orderController.loadTrackOrder)
router.post('/generate-invoice', orderController.invoice);


module.exports = router