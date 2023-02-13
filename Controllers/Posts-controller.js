const httpError = require("../Models/http-error");
const fs = require("fs");
const Post = require("../Models/Posts");
const { validationResult } = require("express-validator");
const User = require("../Models/Users");
const { default: mongoose } = require("mongoose");
const getPost = async (req, res, next) => {
  const postId = req.params.id;
  let post;
  try {
    post = await Post.findById(postId).populate('author', '-email -password');
  } catch (err) {
    return next(
      new httpError("something went wrong,could not find the post", 500)
    );
  }
  if(!post){
    return next(new httpError("No Post found",400));
  }
  res.status(200).json({ post: post.toObject({ getters: true }) });
};
const getPostsByUserId = async (req,res,next)=>{
  const uid = req.params.uid;
  let posts;
  try{
    posts = await Post.find({author: uid});
  }catch(err){
    return next(
      new httpError("something went wrong,could not fetch posts", 500)
    );
  }
  res 
    .status(200)
    .json({ posts: posts.map((post) => post.toObject({ getters: true })) });
}
const getPosts = async (req, res, next) => {
  const category = req.query.cat;
  const pid = req.query.similar;
  // find all posts with this category
  let posts;
  let catInsight = {};
  try {
    if (pid){
      const post = await Post.findById(pid);
      posts = await Post.find({author : post.author , _id : {$ne : post._id}}).limit(5)
    }
    else if (category) {
      posts = await Post.find({ categories: { $in: category } }).populate('author','-email -password');
      const postCount = await Post.count({ categories: { $in: category }});
      const userCount = await Post.find({categories: { $in : category}}).distinct('author').count();
      catInsight = {postNum: postCount , userNum: userCount}
    } else {
      posts = await Post.find().populate('author', '-email -password');

    }
  } catch (err) {
    return next(
      new httpError("something went wrong,could not fetch posts", 500)
    );
  } 
  res 
    .status(200)
    .json({ posts: posts.map((post) => post.toObject({ getters: true })), catInsight });
};
const updatePost = async (req, res, next) => {
  const errors = validationResult(req).formatWith(({msg}) => msg);
  if (!errors.isEmpty()) {
    return next(new httpError(errors.array(), 422));
  }
  const postId = req.params.id;
  let post;
  try {
    post = await Post.findById(postId);
    if (post.author.toString() === req.userData.userId) {
      const cat = req.body.categories.split(",");
      try {
        post = await Post.findByIdAndUpdate(postId, {
          title: req.body.title,
          description: req.body.description,
          image: req.file && req.file.filename,
          author: req.userData.userId,
          categories: [...cat],
        });
        await post.save();
      } catch (err) {
        return next(new httpError(err, 500));
      }
    } else {
      return next(new httpError("you can update only your post", 401));
    }
  } catch (err) {
    return next(
      new httpError("failed to update the place, please try later", 500)
    );
  }
  res.status(200).json({ post: post.toObject({ getters: true }) });
};
const deletePost = async (req, res, next) => {
  const postId = req.params.id;
  let post;
  try {
    post = await Post.findById(postId).populate("author");
  } catch (err) {
    return next(
      new httpError("something went wrong,could not delete post", 500)
    );
  }
  if (!post) {
    return next(new httpError("could not find the post", 404));
  }
  if(post.author.id.toString() !== req.userData.userId){
    return next(new httpError('you can only delete your post',401));
  }
  try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await post.remove({ session: sess });
      post.author.posts.pull(post);
      await post.author.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
        return next(new httpError(err, 500));
    }
    if(post.image){
        const imgUrl = "uploads/" + post.image;
        fs.unlink(imgUrl, (err) => {
          console.log(err)
        });
    }
  res.status(200).json({ message: "post deleted successfully" });
};
const createPost = async (req, res, next) => {
  const errors = validationResult(req).formatWith(({msg}) => msg);
  if (!errors.isEmpty()) {
    return next(new httpError(errors.array(), 422));
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new httpError(err, 500));
  }
  const cat = req.body.categories.split(',')
  const newPost = new Post({
    title: req.body.title,
    description: req.body.description,
    image: req.file && req.file.filename,
    author: req.userData.userId,
    categories: [...cat],
  });
  
  if (!user) {
    return next(new httpError("could not find the user for provided id", 404));
  }
  //if user exists then create the post and then store the post id in user
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPost.save({ session: sess });
    user.posts.push(newPost);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new httpError(err, 500));
  }

  res.status(201).json({ post: newPost.toObject({getters: true}) });
};

module.exports.createPost = createPost;
module.exports.getPost = getPost;
module.exports.getPosts = getPosts;
module.exports.getPostsByUserId = getPostsByUserId;
module.exports.updatePost = updatePost;
module.exports.deletePost = deletePost;
