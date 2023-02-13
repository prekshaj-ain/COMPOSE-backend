const httpError = require("../Models/http-error");
const jwt = require('jsonwebtoken')
module.exports = (req,res,next)=>{
    if(req.method === 'OPTIONS'){
        return next()
    }
    const token = req.cookies.access_token;
    if(!token){
        return next(new httpError('Authentication failed', 403));
    }
    try{
        const data = jwt.verify(token, process.env.SECRET);
        req.userData = {userId : data.userId};
        next();
    } catch(err){
        return next(new httpError('Authentication failed!!', 403));
    }
}