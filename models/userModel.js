const mongoose = require("mongoose")

const userSchema = new mongoose.Schema ({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String
    },
    password:{
        type:String
    },
    is_admin:{
        type:Boolean,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:0
    },
    is_verified:{
        type:Boolean,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    token:{
        type:String,
        default:''
    }
})

module.exports = new mongoose.model('Users',userSchema)