const express = require('express');
const { check } = require('express-validator');
const { login, signup, logout, getUsers, getUser, updateUser } = require('../Controllers/User-controller');
const upload = require('../Middleware/fileUpload');
const verifyToken = require('../Middleware/verifyToken');
const router = express.Router();


router.post('/login',[
    check('email').normalizeEmail().toUpperCase()
],login);
router.post('/signup',upload.single('image'),[
    check('username')
        .isLength({min: 3,max:20})
        .withMessage("Username should be atleast 3 characters long and should not exceed 20 characters. "),
    check('email')
        .isEmail()
        .normalizeEmail()
        .toUpperCase()
        .withMessage('Input should be a email.'),
    check('password')
        .trim()
        .isLength({min:8, max:16})
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@/$/!/%/*/#/?/&/-/_])(?=.*\d)[A-Za-z\d@$!%*#?&-_]{8,16}$/,'i')
        .withMessage('Password should contain (atleast 8-16 characters, 1 numeric digit, lowercase, uppercase, special character).')
],signup);
router.post('/logout',logout);
router.get('/',getUsers);
router.get('/:uid',getUser);
router.use(verifyToken)
router.patch('/:uid',upload.single('image'),
    [
        check('username')
            .isLength({min:3,max: 20})
            .withMessage("username should have minimun 3 characters and should not exceed 20 characters"),
        check('about')
            .isLength({max: 120})
            .withMessage("bio should not exceed 120 characters")
    ],updateUser)

module.exports = router;