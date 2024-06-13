const statusCodes = require("../../util/statusCodes")
const errorMessages = require('../../util/errorMessages')
const Products = require("../../models/productModel")
const Categories = require('../../models/categoryModel')
const Variants = require('../../models/variantModel')


exports.loadProducts = async(req,res)=>{
    try {
        const [ productss, variantss ] = await Promise.all ([
            Products.find({}).populate("categoryId"),
            Variants.find({})
        ])
        res.render('admin/products',{ productss, variantss })
    } catch (error) {
        console.log(error)
    }
}

exports.loadAddProducts = async(req,res)=>{
    try {
        const categoriess = await Categories.find({})
        res.render('admin/AddProducts', { categoriess })
    } catch (error) {
        console.log(error)
    }
}

exports.loadEditProducts = async(req,res)=>{
    try {
        const categoriess = await Categories.find({})
        const productId = req.params.productId;
        const product = await Products.findById(productId);
        if (!product) {
            res.status(404).send('Product not found');
        } else {
            res.render('admin/EditProducts', { product, categoriess })
        }
    } catch (error) {
        console.log(error)
    }
}

exports.loadProductDetails = async(req,res)=>{
    try {
        const productId = req.params.productId;

        const [product, categories, variants] = await Promise.all([
            Products.findById(productId),
            Categories.find({}),
            Variants.find({ productId: productId }),
        ]);

        const variantId = variants.map(variant => variant._id);

        if (!product) {
            res.status(404).json('Product not found')
        } 

        res.render('admin/product-Details', { product, categories, variants , productId, variantId })
        
    } catch (error) {
        console.log(error)
    }
}

exports.insertProduct = async (req,res)=>{
    try {
        const { name, description, categoryId, brand, tags } = req.body
        
        const existingProduct = await Products.findOne({ name })

        if(existingProduct){
            return res.status(statusCodes.BAD_REQUEST).json({success:false, message: 'This Product already exists'})
        }

        const imagePath = `/admin/uploads/product/${req.file.filename}`

        const product =  new Products({
            name,
            description,
            categoryId,
            brand,
            tags,
            image: imagePath
        })
           
        const savedProduct = await product.save()

        res.status(statusCodes.CREATED).json({success:true,productId:savedProduct._id, message: 'Product added Successfully!'})

    } catch (error) {
        console.log(error);
        
    }
}

exports.editProduct = async(req,res) =>{
    try {
        const productId = req.params.productId
        const { name, description, category, brand } = req.body
        let imagePath = ''

        if(req.file){
            imagePath = `/admin/uploads/product/${req.file.filename}`;
        }

        const updatedProductData = { name, description, category, brand };
        if (imagePath) {
            updatedProductData.image = imagePath;
        }

        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            updatedProductData,
            { new: true }
        )

        if (!updatedProduct) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'product not found' });
        }
        

        res.status(statusCodes.BAD_REQUEST).json({ success: true, message: 'Product updated successfully', product: updatedProduct });

    } catch (error) {
        console.log(error)
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to update Product', error: error.message });
    }
}

exports.productUnlist = async(req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Products.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        product.is_delete = !product.is_delete;
        const updatedProduct = await product.save();

        res.json({ success: true, ProductStatus: updatedProduct.is_delete });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Could not toggle block status.' });
    }
};
