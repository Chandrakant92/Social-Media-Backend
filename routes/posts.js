const express = require('express');
const router = express.Router();
const multer = require("multer");
const { createPost, getPosts,getAllImages, getImage, likePost, addComment } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const storage = multer.memoryStorage(); // Store files in memory buffer
const upload = multer({ storage: storage });

// Create a post
router.post('/create-post', authMiddleware, upload.single('image'), createPost);

// Get all posts
// router.get('/', authMiddleware, getPosts);'
router.get('/all-posts', getAllImages);

router.get('/image/:id', getImage);
router.post('/:id/likes', likePost);
router.post('/:id/comment', addComment);

module.exports = router;
