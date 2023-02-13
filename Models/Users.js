const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    about:{
        type:String,
        required: false,
        default:'',
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        default:"",
    },
    posts:[{
        type:mongoose.Types.ObjectId,
        ref: 'Post'
    }]

},{timestamps: true});

module.exports = mongoose.model('User',userSchema);