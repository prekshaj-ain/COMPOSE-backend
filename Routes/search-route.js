const express = require('express');
const { search, searchUser, searchPost } = require('../Controllers/Search-controller');
const router = express.Router();

router.get('/',search);
router.get('/user',searchUser);
router.get('/post',searchPost);
module.exports  = router;