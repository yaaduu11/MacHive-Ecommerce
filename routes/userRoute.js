const express = require("express")
const router = express.Router()
const userController = require("../controllers/users/userController")
const shopController = require('../controllers/users/shopController')
const dashController = require('../controllers/users/dashController')
const orderController = require('../controllers/users/orderController')
const authUser = require('../middleware/authMiddleware')


//////////////! loading nav items
router.get('/',userController.loadHome)
router.get('/shop',userController.loadShop)


//////////////! sign-up side
router.get('/sign-up',authUser.isAuthenticated,userController.loadSignUp)
router.post('/sign-up',userController.insertUser)


//////////////! sign in side
router.get('/sign-in',authUser.isAuthenticated,userController.loadSignIn)
router.post('/sign-in',userController.signIn)


//////////////!  logout side
router.get('/logout',dashController.logoutUser)


//////////////! otp route
router.get('/otp',userController.loadOtp)
router.post('/otp',userController.userVerification)


//////////////! resend otp
router.post('/resend-otp',userController.resendOtp)


//////////////! shop side
router.get('/product_Details/:productId',shopController.loadProductDetails)


//////////////! My account
router.get('/myAccount', dashController.loadMyAccount)
router.post('/update-profile',dashController.userDataEdit)
router.post('/update-password',dashController.changePassword)


//////////////! address
router.post('/myAccount',dashController.insertAddress)
router.post('/myAccount/:addressId',dashController.editAddress)
router.delete('/delete-address/:id',dashController.deleteAddress)


//////////////!  WISHLIST
router.get('/wishlist',shopController.loadWishlist)


//////////////! Cart
router.get('/cart',authUser.isAuthenticate,shopController.loadCart)
router.post('/cart',authUser.isAuthenticate,shopController.addToCart)
router.post('/update-cart-quantity', shopController.cartQuantityUpdate)
router.post('/check-stock', shopController.checkStock)
router.delete('/remove-from-cart', shopController.removeItemCart)


////////////////!  wishlist
router.post('/wishlist',shopController.addToWishlist)


//////////////! Checkout
router.get('/checkout',orderController.loadCheckout)


//////////////! Order
router.post('/placeOrder',orderController.placeOrder)
router.post('/verifyPayment', orderController.verifyPayment);
router.post('/cancel-order/:orderId',orderController.cancelOrder)
router.get('/thankyou',orderController.loadThankYou)



module.exports = router