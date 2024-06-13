const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema ({
      name: {
        type: String,
        required: true,
        unique: true,
      },
      image: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: Boolean,
        default:false
      },
      createdAt: {
        type: Date,
        default: Date.now()
      },
      is_delete:{
        type:Boolean, //soft deleting
        default:false
      }
});

module.exports = mongoose.model('Categories', categorySchema);