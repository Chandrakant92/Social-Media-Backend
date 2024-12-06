const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  const bucket = new GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
  gfs = bucket;
});

// Register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please provide all required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: "Please provide both email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userProfile = user.toObject();

    if (
      userProfile.profile &&
      userProfile.profile.image &&
      userProfile.profile.image.data
    ) {
      userProfile.profile.imageUrl = `data:${
        userProfile.profile.image.contentType
      };base64,${userProfile.profile.image.data.toString("base64")}`;
    } else {
      userProfile.profile.imageUrl = null;
    }

    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserInfo = async (req, res) => {
  try {
    // Assuming the userId is passed as a query parameter, you can extract it like this:
    const { userId } = req.query;

    // Find the user by userId (not using req.user)
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert the user document to a plain object
    const userProfile = user.toObject();

    // Check if the profile image exists and convert it to a base64 string
    if (
      userProfile.profile &&
      userProfile.profile.image &&
      userProfile.profile.image.data
    ) {
      userProfile.profile.imageUrl = `data:${
        userProfile.profile.image.contentType
      };base64,${userProfile.profile.image.data.toString("base64")}`;
    } else {
      userProfile.profile.imageUrl = null;
    }

    // Respond with the user profile (including the imageUrl)
    res.json(userProfile);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user; // Extract user ID from JWT token

    // Check if file is provided
    const file = req.file;
    if (!file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Update user profile with image data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Save image binary data
    user.profile.image = {
      data: file.buffer,
      contentType: file.mimetype,
    };

    await user.save();

    res.json({ msg: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const followUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;


    // Call the followUser function
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    // Check if already following
    if (user.following.includes(targetUserId)) {
      throw new Error("You are already following this user.");
    }

    // Add to following and followers arrays
    user.following.push(targetUserId);
    targetUser.followers.push(userId);

    // Save both users
    await user.save();
    await targetUser.save();

    console.log("Successfully followed the user!");

    res.status(200).json({ message: "Successfully followed the user!" });
  } catch (error) {
    console.error("Error following the user:", error);
    res.status(400).json({ message: "You are already following this user." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserInfo,
  followUser,
};
