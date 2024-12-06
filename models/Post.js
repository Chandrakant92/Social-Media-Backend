const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");

const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User",  }, // Reference to the user who made the comment
  userName: { type: String },
  comment: { type: String, required: true }, // Comment content
  likes: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }, // Time when the comment was made
});

const PostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true }, // Store the user's name
    caption: { type: String }, // Optional content
    image: {
      data: Buffer, // Binary data for the image
      contentType: String, // MIME type of the image
    },
    file: { type: String }, // Optional file URL or path
    date: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now },
    likes: { type: Number, default: 1 }, // Initial likes set to 1
    comments: [CommentSchema], // Array of embedded comment objects
    shares: { type: Number, default: 0 }, // Initial shares set to 0
  },
  {
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true }, // Include virtuals when converting to objects
  }
);

module.exports = mongoose.model("Post", PostSchema);
