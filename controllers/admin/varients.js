const statusCodes = require("../../util/statusCodes")
const errorMessages = require('../../util/errorMessages')
const Variants = require('../../models/variantModel')


exports.loadAddVariants = async (req,res)=>{
    try {
        const productId = req.params.productId;
        const variant = await Variants.findById(productId).populate('productId');

        res.render('admin/AddVariants',{variant,productId})
    } catch (error) {
        console.log(error);
    }
}

exports.loadEditVariants = async(req,res)=>{
     try {
    const variantId = req.params.variantId;
    const variant = await Variants.findById(variantId)

    if (!variant) {
      return res.status(404).send('Variant not found')
    }

    res.render('admin/EditVariants', { variant });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}

exports.loadVariantDetails = async (req, res) => {
    try {
      const variantId = req.params.variantId;
  
      if (!variantId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json('Invalid Variant ID');
      }
  
      const variants = await Variants.findById(variantId);
  
      if (!variants) {
        return res.status(404).json('Variant not found');
      }
  
      res.render('admin/variantDetails', { variants });
    } catch (error) {
      console.error('Error loading variant details:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  

exports.insertVariant = async (req,res)=>{
    try {
        const { name, color, ram, rom, stock, regularPrice, salePrice } = req.body
        const productId  = req.params.productId

        const img = []
        for(let i of req.files) {
            img.push(`/admin/uploads/variant/${i.filename}`)
        }
        // const imagePath = `/admin/uploads/variant/${req.files[0].filename}`

        const variants =  new Variants({
            productId,
            name,
            color,
            ram,
            rom,
            stock,
            regularPrice: parseFloat(regularPrice), 
            salePrice: parseFloat(salePrice),
            image: img
        })

        const savedVariant = await variants.save()

        res.status(statusCodes.CREATED).json({success:true, message: 'Varient added succesfully',productId:productId})

    } catch (error) {
        console.log(error);
    }
}

exports.editVariant = async(req,res)=>{
    try {
        const variantId = req.params.variantId
        const { name, color, ram, rom, stock, regularPrice, salePrice } = req.body
        let imagePath = ''

        let img = [];
        if(req.files){
          for(let i of req.files){
              img.push(`/admin/uploads/variant/${i.filename}`)
          }
        }
        // if(req.files){
        //     imagePath = `/admin/uploads/variant/${req.files.filename}`;
        // }

        const updatedVariantData = { name, color, ram, rom, stock, regularPrice, salePrice }
        if(img){
            updatedVariantData.image = img
        }

        const updatedVariant = await Variants.findByIdAndUpdate(
            variantId,
            updatedVariantData,
            { new: true }
        )


        if (!updatedVariant) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'variant not found' });
        }
        
        res.status(statusCodes.BAD_REQUEST).json({ success: true, message: 'Variant updated successfully', variant: updatedVariant });

    } catch (error) {
        console.log(error)
    }
}

exports.variantUnlist = async (req, res) => {
  const variantId = req.params.variantId;
  try {
    const variant = await Variants.findOne({ _id: variantId });
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    variant.is_blocked = !variant.is_blocked;
    const updatedVariant = await variant.save();

    res.json({ success: true, VariantStatus: updatedVariant.is_blocked });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not toggle block status.' });
  }
};
