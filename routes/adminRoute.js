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
router.get('/', authAdmin.checkAdminLoggedIn, signIn.loadSignIn)
router.post('/', authAdmin.isAdminAuthenticated, signIn.adminSignin)


//////////////!   LOGOUT
router.post('/logout', signIn.adminLogout)


//////////////!   DASHBOARD
router.get('/dashboard', authAdmin.redirectIfNotAuthenticated, dashboard.loadAdminPanel)


//////////////!   USERS
router.get('/customers', authAdmin.redirectIfNotAuthenticated, dashboard.loadCustomers)
router.patch('/block-user/:userId', dashboard.userBlocking, authAdmin.logout)


//////////////!   CATEGORIES
router.get('/categories', authAdmin.redirectIfNotAuthenticated, categories.loadCategories)
router.get('/AddCategories', authAdmin.redirectIfNotAuthenticated, categories.loadAddCategories)
router.get('/EditCategories/:categoryId', authAdmin.redirectIfNotAuthenticated, categories.loadEditCategories)
router.post('/AddCategories', categoryUpload.single('image'), categories.insertCategory)
router.patch('/EditCategories/:categoryId', categoryUpload.single('image'), categories.editCategory)
router.patch('/unlist-category/:categoryId', categories.categoryUnlist)


//////////////!   PRODUCTS
router.get('/products', authAdmin.redirectIfNotAuthenticated, products.loadProducts)
router.get('/AddProducts', authAdmin.redirectIfNotAuthenticated, products.loadAddProducts)
router.get('/EditProducts/:productId', authAdmin.redirectIfNotAuthenticated, products.loadEditProducts)
router.get('/productDetails/:productId', authAdmin.redirectIfNotAuthenticated, products.loadProductDetails)
router.post('/AddProducts', productUpload.single('image'), products.insertProduct)
router.patch('/EditProducts/:productId', productUpload.single('image'), products.editProduct)
router.patch('/unlist-product/:productId', products.productUnlist)


//////////////!   VARIENTS
router.get('/AddVariants/:productId', authAdmin.redirectIfNotAuthenticated, variants.loadAddVariants)
router.get('/EditVariant/:variantId', authAdmin.redirectIfNotAuthenticated, variants.loadEditVariants)
router.get('/variantDetails/:variantId', authAdmin.redirectIfNotAuthenticated, variants.loadVariantDetails)
router.post('/AddVariants/:productId', variantUpload.array('image'), variants.insertVariant)
router.patch('/EditVariant/:variantId', variantUpload.array('image'), variants.editVariant)
router.patch('/unlist-variant/:variantId', variants.variantUnlist);


//////////////!   ORDERS
router.get('/orders', authAdmin.redirectIfNotAuthenticated, orders.loadOrderList)
router.get('/salesReport', authAdmin.redirectIfNotAuthenticated, orders.loadSalesReport)
router.get('/orderDetails/:orderId', authAdmin.redirectIfNotAuthenticated, orders.loadOrderDetails);
router.patch('/updateOrderStatus', orders.orderStatusUpdate)


//////////////!   COUPONS
router.get('/coupons', authAdmin.redirectIfNotAuthenticated, coupons.loadCoupons)
router.get('/AddCoupons', authAdmin.redirectIfNotAuthenticated, coupons.loadAddCoupons)
router.get('/EditCoupons/:couponId', authAdmin.redirectIfNotAuthenticated, coupons.loadEditCoupons)
router.post('/AddCoupons', coupons.addCoupons);
router.patch('/EditCoupons/:couponId', coupons.editCoupon)
router.patch('/unlist-coupon/:couponId', coupons.unlistCoupon)


//////////////!    PDF AND EXCEL
router.get('/download-excel', authAdmin.redirectIfNotAuthenticated, orders.downloadExcel);
router.get('/download-pdf', authAdmin.redirectIfNotAuthenticated, orders.downloadPdf);


module.exports = router