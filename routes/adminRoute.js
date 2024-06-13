const express = require("express")
const router = express.Router()
const dashboard = require("../controllers/admin/dashboard")
const categories = require("../controllers/admin/categories")
const products = require("../controllers/admin/products")
const variants = require("../controllers/admin/varients")
const orders = require('../controllers/admin/orders')
const coupons = require('../controllers/admin/coupons')
const signIn = require("../controllers/admin/sign-in")
const generateStorage = require('../util/multer')
const authAdmin = require('../middleware/authMiddleware')

const categoryUpload = generateStorage('category')
const productUpload = generateStorage('product')
const variantUpload = generateStorage('variant')


//////////////!   SIGN IN
router.get('/', signIn.loadSignIn)
router.post('/', authAdmin.isAdminAuthenticated, signIn.adminSignin)


//////////////!   DASHBOARD
router.get('/dashboard', dashboard.loadAdminPanel)


//////////////!   USERS
router.get('/customers', dashboard.loadCustomers)
router.patch('/block-user/:userId', dashboard.userBlocking, authAdmin.logout)


//////////////!   CATEGORIES
router.get('/categories', categories.loadCategories)
router.get('/AddCategories', categories.loadAddCategories)
router.get('/EditCategories/:categoryId', categories.loadEditCategories)
router.post('/AddCategories', categoryUpload.single('image'), categories.insertCategory)
router.patch('/EditCategories/:categoryId', categoryUpload.single('image'), categories.editCategory)
router.patch('/unlist-category/:categoryId', categories.categoryUnlist)


//////////////!   PRODUCTS
router.get('/products', products.loadProducts)
router.get('/AddProducts', products.loadAddProducts)
router.get('/EditProducts/:productId', products.loadEditProducts)
router.get('/productDetails/:productId', products.loadProductDetails)
router.post('/AddProducts', productUpload.single('image'), products.insertProduct)
router.patch('/EditProducts/:productId', productUpload.single('image'), products.editProduct)
router.patch('/unlist-product/:productId', products.productUnlist)


//////////////!   VARIENTS
router.get('/AddVariants/:productId', variants.loadAddVariants)
router.get('/EditVariant/:variantId', variants.loadEditVariants)
router.get('/variantDetails/:variantId', variants.loadVariantDetails)
router.post('/AddVariants/:productId', variantUpload.array('image'), variants.insertVariant)
router.patch('/EditVariant/:variantId', variantUpload.array('image'), variants.editVariant)
router.patch('/unlist-variant/:variantId', variants.variantUnlist);


//////////////!   ORDERS
router.get('/orders', orders.loadOrderList)
router.get('/orderDetails/:orderId', orders.loadOrderDetails);
router.patch('/updateOrderStatus', orders.orderStatusUpdate)


//////////////!   COUPONS
router.get('/coupons', coupons.loadCoupons)
router.get('/AddCoupons', coupons.loadAddCoupons)
router.get('/EditCoupons/:couponId', coupons.loadEditCoupons)
router.post('/AddCoupons', coupons.addCoupons);
router.patch('/EditCoupons/:couponId', coupons.editCoupon)
router.patch('/unlist-coupon/:couponId', coupons.unlistCoupon)


module.exports = router