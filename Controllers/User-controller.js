const { validationResult } = require("express-validator");
const httpError = require('../Models/http-error');
const User = require('../Models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const getUser = async (req,res,next)=>{
    let user;
    try{
        user = await User.findById(req.params.uid, '-password -email');
    }catch(err){
        return next(new httpError('something went wrong, could not fetch user',500));
    }
    if(!user){
        return next(new httpError('User does not exist for given id',404));
    }
    res.status(200).json({user: user.toObject({getters:true})});

}
const getUsers = async (req,res,next)=>{
    let users;
    try{
        users = await User.find({}, '-password -email');
    }catch(err){
        return next(new httpError('something went wrong,could not fetch users',500))
    }
    res.status(200).json({users: users.map(user => user.toObject({getters:true}))});
}
const login = async (req,res,next)=>{
   const {email,password} = req.body;
   let existingUser;
   try{
    existingUser = await User.findOne({email: email})
   }catch(err){
    return next(new httpError('something went wrong, login failed', 500))
   }
   if(!existingUser){
    return next(new httpError('wrong credentials, you can not log in',401))
   }
   let isValidPassword = false;
   try{
    isValidPassword = await bcrypt.compare(password, existingUser.password);
   } catch(err){
    return next(new httpError('could not log you in, please check your credentials and try again',500));
   }
   if(!isValidPassword){
    return next(new httpError('wrong credentials, you can not log in',401))
   }
   let token;
   try{
    token = jwt.sign({
        userId: existingUser.id,
        email: existingUser.email
    }, process.env.SECRET, {expiresIn: '20h'});
   }catch(err){
    return next(new httpError('could not log you in, please try again later',500));
   }
   res.cookie("access_token", token , {
    expires: new Date(Date.now() + (20 * 3600 * 1000)) ,
    httpOnly : true
   }).status(200).json({userId: existingUser.id, email: existingUser.email })
}
const logout = (req,res,next)=>{
    res.clearCookie("access_token",{
        sameSite: "none",
        secure:true
    })
       .status(200)
       .json({message: "successFully logged Out!"})

}
const signup = async (req,res,next)=>{
    const errors = validationResult(req).formatWith(({msg}) => msg);
    if(!errors.isEmpty()){
        return next(new httpError(errors.array(),422));
    }
    let existingUser;
    try{
        existingUser = await User.findOne({ $or: [{email: req.body.email }, {username: req.body.username}]});
    }catch(err){
        return next(new httpError('signup failed, please try later',500));
    }
    if(existingUser){
        return next(new httpError('User already exists,Login instead',422))
    }
    let hashedPassword;
    try{
       hashedPassword =  await bcrypt.hash(req.body.password,12);
    }catch(err){
        return next(new httpError('could not create User, please try again later',500))
    }
    let newUser;
    newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        image: req.file && req.file.filename 
    });
    try{
        await newUser.save();
    }catch(err){
        return next(new httpError('signup failed, Please try again later', 500));
    }

    let token;
    try{
        token = jwt.sign({
            userId: newUser.id,
            email: newUser.email
        }, process.env.SECRET, {expiresIn: '20h'});
    }catch(err){
        return next(new httpError('signup failed, please try again later',500));
    }

    res.cookie("access_token" , token , {
        expires: new Date(Date.now() + (20 * 3600 * 1000)) ,
        httpOnly: true
    }).status(201).json({userId: newUser.id , email: newUser.email})
}
const updateUser = async (req,res,next)=>{
    const error = validationResult(req).formatWith(({msg}) => msg);
    if(!error.isEmpty()){
        return next(new httpError(error.array(),422));
    }
    const uid = req.params.uid;
    let user;
    try{
        user = await User.findById(uid);
        if(user){
            try{
                user = await User.findByIdAndUpdate(uid,{
                    ...req.body,
                    image: req.file ? req.file.filename : ""
                });
                await user.save();
            }catch(err){
                return next(new httpError('Something went wrong, Could not update the user',500));
            }
        }else{
            return next(new httpError('User does not exist',400))
        }
    }catch(err){
        return next(new httpError('something went wrong, Couldnt update the user',500));
    }
    res.status(200).json({message:"user updated successfully"});
}

module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.getUsers = getUsers;
module.exports.getUser = getUser;
module.exports.updateUser = updateUser;