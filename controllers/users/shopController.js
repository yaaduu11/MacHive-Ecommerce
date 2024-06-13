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

        res.render('users/product_Details', { user: req.user, products, categories, variants });

    } catch (error) {
        
    }
}

exports.loadWishlist = async(req,res)=>{
    try {
        const userId = req.session.userId; 
        if (!userId) {
            return res.redirect('/sign-in');
        }
        const wishlist = await Wishlist.find({ userId:userId }).populate({
            path: 'products.productVariantId',
            model: 'Varients', 
            populate: {
                path: 'productId',
                model: 'Products' 
            }
        });
        
        res.render('users/wishlist',{ wishlist })
    } catch (error) {
        console.log(error)
    }
}

exports.addToWishlist = async (req, res) => {
    const { productVariantId } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    try {
        let wishlist = await Wishlist.findOne({ userId: userId });
        if (wishlist) {
            let itemIndex = wishlist.products.findIndex(p => p.productVariantId.equals(productVariantId));
            if (itemIndex > -1) {
                return res.status(200).json({ success: true, message: "Item already in wishlist", wishlist });
            } else {
                wishlist.products.push({ productVariantId, quantity: 1 });
            }
            wishlist = await wishlist.save();
            return res.status(200).json({ success: true, wishlist });
        } else {
            const newWishlist = await Wishlist.create({
                userId,
                products: [{ productVariantId, quantity: 1 }]
            });
            return res.status(201).json({ success: true, wishlist: newWishlist });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not add item to wishlist", error: error.message });
    }
};

exports.loadCart = async (req, res) => {
    try {
        const userId = req.session.userId; 
        if (!userId) {
            return res.redirect('/sign-in');
        }

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

exports.addToCart = async (req, res) => {
    const { productVariantId, quantity } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/sign-in')
    }

    try {
        let cart = await Cart.findOne({ userId: userId });
        if (cart) {
            let itemIndex = cart.products.findIndex(p => p.productVariantId.equals(productVariantId));
            if (itemIndex > -1) {
                let productItem = cart.products[itemIndex];
                productItem.quantity = parseInt(productItem.quantity) + parseInt(quantity);
                cart.products[itemIndex] = productItem;
            } else {
                cart.products.push({ productVariantId, quantity });
            }
            cart = await cart.save();
            return res.status(200).json({ success: true, cart });
        } else {
            const newCart = await Cart.create({
                userId,
                products: [{ productVariantId, quantity }]
            });
            return res.status(201).json({ success: true, cart: newCart });
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


