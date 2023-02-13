const express = require('express');
const { check } = require('express-validator');
const { getPost, getPosts, createPost, updatePost, deletePost, getPostsByUserId } = require('../Controllers/Posts-controller');
const upload = require('../Middleware/fileUpload');
const verifyToken = require('../Middleware/verifyToken');
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.get('/user/:uid',getPostsByUserId);
router.use(verifyToken)
router.post('/', upload.single('image'),
    [check('title')
        .not()
        .isEmpty()
        .withMessage('Title should not be empty '),
    check('description')
        .not()
        .isEmpty()
        .withMessage('Description should not be empty.')
    ]
    , createPost);
router.patch('/:id', upload.single('image'),
    [check('title')
        .not()
        .isEmpty()
        .withMessage('Title should not be empty '),
    check('description')
        .not()
        .isEmpty()
        .withMessage('Description should not be empty ')
    ]
    , updatePost);
router.delete('/:id', deletePost);

module.exports = router;