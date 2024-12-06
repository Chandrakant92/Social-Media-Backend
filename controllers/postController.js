const multer = require("multer");
const moment = require("moment");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const Post = require("../models/Post");
// const User = require("../models/User");
const axios = require("axios");

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  const bucket = new GridFSBucket(conn.db, {
    bucketName: "posts", // This bucket will store post images
  });
  gfs = bucket;
});

const createPost = async (req, res) => {
  try {
    const { userId, userName, caption } = req.body;

    const image = req.file; // req.file is used when uploading single files via multer

    // Create a new Post object
    const newPost = new Post({
      userId,
      userName,
      caption,
      image: image
        ? {
            data: image.buffer,
            contentType: image.mimetype,
          }
        : null, // Store image as binary data, or set to null if no image
      file: req.body.file || null, // Optional file URL or path
    });

    // Save the post to the database
    const savedPost = await newPost.save();

    // Return the entire post object in the response
    return res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name").sort({ date: -1 });

    const modifiedPosts = posts.map((post) => {
      return {
        ...post.toObject(),
        timestamp: moment(post.date).fromNow(), // Calculate the relative time
      };
    });

    res.json(modifiedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getImage = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post || !post.image || !post.image.data) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Convert the binary data to a base64 string
    const base64Image = post.image.data.toString("base64");
    const imageSrc = `data:${post.image.contentType};base64,${base64Image}`;

    // Return the base64 string as part of the JSON response
    return res.json({ imageSrc });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//
const getAlImages = async (req, res) => {
  try {
    const posts = await Post.find(); // Fetch all posts

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    // Map through all posts to include the base64-encoded image
    const postsWithImages = posts.map((post) => {
      if (post.image && post.image.data) {
        // Convert the binary data to a base64 string
        const base64Image = post.image.data.toString("base64");
        const imageSrc = `data:${post.image.contentType};base64,${base64Image}`;

        // Return the post with the imageSrc added
        return {
          ...post._doc,
          imageSrc,
          timestamp: moment(post.date).fromNow(),
        };
      } else {
        // Return the post without an imageSrc if no image exists
        return post;
      }
    });

    // Return the modified posts array
    return res.json(postsWithImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllImages = async (req, res) => {
  try {
    const posts = await Post.find(); // Fetch all posts

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    // Fetch user profiles for each post
    const postsWithUserDetails = await Promise.all(
      posts.map(async (post) => {
        try {
          // Fetch user profile for each post's userId
          const userProfileResponse = await axios.get(
            "http://localhost:5000/api/users/user-info",
            {
              params: { userId: post.userId },
            }
          );

          const userProfile = userProfileResponse.data;

          let imageSrc = null;
          if (post.image && post.image.data) {
            // const base64Image = post.image.data.toString("base64");
            const base64Image = post.image.data.toString("base64");
            imageSrc = `data:${post.image.contentType};base64,${base64Image}`;

          }

          const commentsWithRelativeTime = post.comments.map(comment => ({
            ...comment.toObject(), // Convert comment to a plain object
            timestamp: moment(comment.timestamp).fromNow() // Convert timestamp to relative time
          }));

          // Append the userName and userProfileImage to the post
          return {
            postId:post._id,
            userId: post.userId,
            userName: post.userName,
            caption: post.caption,
            likes:post.likes,
            comments:commentsWithRelativeTime,
            imageSrc,
            // userName: userProfile.name,
            avatar: userProfile.profile.imageUrl|| null, // Use profile image if available
            timestamp: moment(post.date).fromNow(),
          };
        } catch (error) {
          console.error(
            `Error fetching user profile for userId ${post.userId}:`,
            error
          );
          return {
            postId:post._id,
            userId: post.userId,
            userName: post.userName,
            caption: post.caption,
            likes,
            comments,
            imageSrc,
            // userName: null,
            userProfileImage: null,
            timestamp: moment(post.date).fromNow(),
          };
        }
      })
    );

    // Return the modified posts array
    return res.json(postsWithUserDetails);
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Increment likes by 1
    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ likes: post.likes });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const postId = req.params.id;  // Get postId from the URL
    // Get userId and comment text from request body
      const { userId, comment, userName } = req.body;
    console.log("postId :", postId, "userId :", userId, "comment :", comment);
    
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Add comment to the post's comments array
    post.comments.push({ userId, comment, userName  });

    // Save the post with the new comment
    await post.save();

    // return res.status(200).json({ message: "Comment added", post });
    return res.json(post.comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { createPost, getPosts, getImage, getAllImages, likePost, addComment };
