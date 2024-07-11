const Categories = require('../../models/categoryModel');
const Variants = require('../../models/variantModel');
const asyncHandler = require('express-async-handler');
const Offers = require('../../models/offerModel')

exports.loadOffers = asyncHandler(async (req, res) => {
  const offers = await Offers.find({ block: false })
  const varientName = await Offers.find({ block: false }).populate({
    path: 'offerItems',
    model: 'Varients'
  })
  res.render('admin/offers', { offers, varientName });
});


exports.loadAddOffers = asyncHandler(async (req, res) => {
  res.render('admin/AddOffers');
});


exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Categories.find({}, { _id: 1, name: 1 });
  res.status(200).json({ success: true, items: categories });
});


exports.getAllProducts = asyncHandler(async (req, res) => {
  const variants = await Variants.find({}, { _id: 1, name: 1 });
  res.status(200).json({ success: true, items: variants });
});


exports.insertOffer = asyncHandler(async (req, res) => {
  const { code, offerType, offerItems, discount, expirydate } = req.body;

  if (!code || !offerType || !offerItems || !discount || !expirydate) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  let offerData = {
    offerName: code,
    offerType,
    discountPercentage: discount,
    expiryDate: expirydate,
    offerItems,
  };

  const offer = new Offers(offerData);

  try {
    const savedOffer = await offer.save();

    if (offerType === 'Product Offer') {
      const variant = await Variants.findById(offerItems);
      if (variant) {
        variant.offerPercentage = discount;
        variant.salePrice = variant.salePrice - (variant.salePrice * (discount / 100));
        await variant.save();
      } else {
        return res.status(404).json({ success: false, message: 'Variant not found' });
      }
    } else if (offerType === 'Category Offer') {
      const category = await Categories.findById(offerItems);
      if (category) {
        await Variant.updateMany(
          { productId: { $in: category.products } },
          {
            $set: { offerPercentage: discount },
            $mul: { salePrice: 1 - (discount / 100) }
          }
        );
      } else {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }

    res.status(201).json({ success: true, message: 'Offer created successfully', offer: savedOffer });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again later.', error: error.message });
  }
});

exports.deleteOffer = asyncHandler(async (req, res) => {
  const offerId = req.params.offerId;

  try {
      const offer = await Offers.findByIdAndDelete(offerId);

      if (!offer) {
          return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      if (offer.offerType === 'Product Offer') {
          const variant = await Variants.findById(offer.offerItems);
          if (variant) {
              variant.salePrice = variant.regularPrice;
              variant.offerPercentage = 0;
              await variant.save();
          }
      } else if (offer.offerType === 'Category Offer') {
          const category = await Categories.findById(offer.offerItems);
          if (category) {
              await Variants.updateMany(
                  { productId: { $in: category.products } },
                  {
                      $set: { salePrice: '$regularPrice', offerPercentage: 0 }
                  }
              );
          }
      }

      res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
      console.error('Error deleting offer:', error);
      res.status(500).json({ success: false, message: 'Server Error. Please try again later.', error: error.message });
  }
});


