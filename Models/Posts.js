const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:false,
    },
    author:{
        type: mongoose.Types.ObjectId,
        required:true,
        ref: 'User'
    },
    categories:[{
        type: String,
        required:false
    }]
},{timestamps:true});

module.exports = mongoose.model('Post',postSchema);
