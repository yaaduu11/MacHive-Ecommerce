const Products = require("../../models/productModel")
const Categories = require('../../models/categoryModel')
const Variants = require('../../models/variantModel')
const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel');
const statusCodes = require("../../util/statusCodes");
const Wishlist = require('../../models/wishlistModel')


exports.loadProductDetails = async (req,res)=>{
    try {
        const productId = req.params.productId;

        const [ products, categories, variants ] = await Promise.all([
            Products.findById(productId).populate('categoryId'),
            Categories.find({}),
            Variants.find({productId:productId})
        ]);
 
        console.log(variants)

        res.render('users/product_Details', { user: req.user, products, categories, variants });

    } catch (error) {
        
    }
}

exports.loadWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;

        const wishlist = await Wishlist.findOne({ userId: userId }).populate({
            path: 'products.productVariantId',
            model: 'Varients', 
            populate: {
                path: 'productId',
                model: 'Products' 
            }
        });

        if (wishlist) {
            res.render('users/wishlist', { wishlist: wishlist });
        }else{
            res.status(404).render('users/wishlist', { wishlist: null, message: "Wishlist not found" });
        }

    } catch (error) {
        console.error('Error loading wishlist:', error);
        res.status(500).send('Internal Server Error');
    }
};




exports.loadCart = async (req, res) => {
    try {
        const userId = req.session.userId; 

        const cart = await Cart.findOne({ userId: userId }).populate({
            path: 'products.productVariantId',
            model: 'Varients', 
            populate: {
                path: 'productId',
                model: 'Products' 
            }
        });

        if (cart) {
            res.render('users/cart', { cart: cart });
        } else {
            res.status(404).render('users/cart', { cart: null, message: "Cart not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('error', { message: "Error fetching cart", error: error.message });
    }
};


exports.addToWishlist = async (req, res) => {
    const { productVariantId, quantity } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    try {
        let wishlist = await Wishlist.findOne({ userId: userId });
        if (wishlist) {
            let itemIndex = wishlist.products.findIndex(p => p.productVariantId.equals(productVariantId));
            if (itemIndex > -1) {
                return res.status(200).json({ success: true, alreadyExists: true, message: "Product is already in your wishlist" });
            } else {
                wishlist.products.push({ productVariantId, quantity: quantity || 1 });
                wishlist = await wishlist.save();
                return res.status(200).json({ success: true, wishlist, alreadyExists: false });
            }
        } else {
            const newWishlist = await Wishlist.create({
                userId,
                products: [{ productVariantId, quantity: quantity || 1 }]
            });
            return res.status(201).json({ success: true, wishlist: newWishlist, alreadyExists: false });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not add item to wishlist", error: error.message });
    }
};


exports.addToCart = async (req, res) => {
    const { productVariantId, quantity } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    try {
        let cart = await Cart.findOne({ userId: userId });
        if (cart) {
            let itemIndex = cart.products.findIndex(p => p.productVariantId.equals(productVariantId));
            if (itemIndex > -1) {
                return res.status(200).json({ success: true, alreadyExists: true, message: "Product is already in your cart" });
            } else {
                cart.products.push({ productVariantId, quantity });
                cart = await cart.save();
                return res.status(200).json({ success: true, cart, alreadyExists: false });
            }
        } else {
            const newCart = await Cart.create({
                userId,
                products: [{ productVariantId, quantity }]
            });
            return res.status(201).json({ success: true, cart: newCart, alreadyExists: false });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not add item to cart", error: error.message });
    }
};



exports.checkStock = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const variant = await Variants.findById(productId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }
        if (variant.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} items left in stock` });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.cartQuantityUpdate = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please log in to update cart items.' });
        }

        const variant = await Variants.findById(productId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.is_blocked) {
            return res.status(400).json({ success: false, message: 'Product is unavailable' });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} items left in stock` });
        }

        const updatedCart = await Cart.findOneAndUpdate(
            { userId: userId, "products.productVariantId": productId },
            { $set: { "products.$.quantity": quantity } },
            { new: true }
        );

        if (updatedCart) {
            res.json({ success: true, updatedCart });
        } else {
            res.status(404).json({ success: false, message: 'Cart item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


exports.removeItemCart = async (req, res) => {
    const { productVariantId } = req.body; 
    const userId = req.session.userId; 

    if (!userId) {
        return res.status(401).json({ success: false, message: "Please log in to remove items from the cart." });
    }

    try {
        let cart = await Cart.findOne({ userId: userId });
        if (cart) {
            cart.products = cart.products.filter(item => !item.productVariantId.equals(productVariantId));
            cart = await cart.save();
            return res.status(200).json({ success: true, cart });
        } else {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not remove item from cart", error: error.message });
    }
};


exports.removeFromWishlist = async (req, res) => {
    const userId = req.session.userId;
    const { productVariantId } = req.body;  // Updated to get productVariantId from the request body

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const wishlist = await Wishlist.findOne({ userId: userId });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(product => !product.productVariantId.equals(productVariantId));

            await wishlist.save();
            return res.json({ success: true, wishlist });
        } else {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
