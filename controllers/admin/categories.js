const statusCodes = require("../../util/statusCodes")
const errorMessages = require('../../util/errorMessages')
const Categories = require('../../models/categoryModel')


exports.loadCategories = async (req, res) => {
    try {
        const categoriess = await Categories.find({})
        res.render('admin/categories', { categoriess })
    } catch (error) {
        console.log(error.messsage);
    }
}

exports.loadAddCategories = async (req, res) => {
    try {
        res.render('admin/AddCategories')
    } catch (error) {
        console.log(error.messsage);
    }
}

exports.loadEditCategories = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Categories.findById(categoryId);
        if (!category) {
            res.status(404).send('Category not found');
        } else {
            res.render('admin/EditCategories', { category });
        }
    } catch (error) {
        console.log(error.message)
    }
}

exports.insertCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existingCategory = await Categories.findOne({ name });
        if (existingCategory) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'This category already exists' });
        }

        if (!name || !description || !req.file) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const imagePath = `/admin/uploads/category/${req.file.filename}`

        const category = new Categories({
            name,
            description,
            image: imagePath
        });

        const savedCategory = await category.save();

        res.status(201).json({ success: true, message: 'Category added successfully!' });

    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
};

exports.editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { name, description } = req.body;
        let imagePath = '';   
        if (req.file) {
            imagePath = `/admin/uploads/category/${req.file.filename}`;
        }
        const updatedCategoryData = { name, description };
        if (imagePath) {
            updatedCategoryData.image = imagePath;
        }
        const existingCategory = await Categories.findOne({ name: updatedCategoryData.name })

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'Category already exists, Give another name' })
        }
        const updatedCategory = await Categories.findByIdAndUpdate(
            categoryId,
            updatedCategoryData,
            { new: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.status(200).json({ success: true, message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
};


exports.categoryUnlist = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        const category = await Categories.findOne({ _id: categoryId })

        category.is_delete = !category.is_delete;

        const updatedcategory = await category.save();

        res.json({ success: true });

    } catch (error) {
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, categoryStatus: updatedcategory.is_delete, message: 'Could not toggle block status.' });
    }
}