const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserInfo,
  followUser,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const User = require("../models/User");

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get user profile
router.get("/profile", authMiddleware, getUserProfile);
router.get("/user-info", getUserInfo);

// Update user profile
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  updateUserProfile
);

router.post("/follow", authMiddleware, followUser);

// Get all users
router.get("/get-all", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("name bio profile");

    // Transform the users data to include base64-encoded image URLs
    const transformedUsers = users.map((user) => {
        const userProfile = user.toObject(); // Convert mongoose document to plain object

        // Ensure profile exists before accessing it
        if (userProfile.profile) {
          if (
            userProfile.profile.image &&
            userProfile.profile.image.data
          ) {
            userProfile.profile.imageUrl = `data:${
              userProfile.profile.image.contentType
            };base64,${userProfile.profile.image.data.toString("base64")}`;
          } else {
            userProfile.profile.imageUrl = null; // or default image URL
          }
        } else {
          userProfile.profile = { imageUrl: null }; // Handle case where profile is missing
        }
  
        // Return the modified user object
        return userProfile;
      });

    // Respond with the transformed user data
    res.status(200).json(transformedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

//  66ba07da9539685cfcb5fdb6 roy
// 66bb061c7b1f76fd07f40021 rdj
