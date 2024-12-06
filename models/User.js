const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autoIncrement = require("mongoose-sequence")(mongoose);

const UserSchema = new Schema({
  userId: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  date: { type: Date },
  gender: { type: String },
  phone: { type: String },
  address: { type: String, required: false },
  profile: {
    image: {
      data: Buffer,
      contentType: String,
    },
    bio: String,
    location: String,
    website: String,
  },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users who follow this user
  following: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users that this user is following
});

UserSchema.plugin(autoIncrement, { inc_field: "userId" });

module.exports = mongoose.model("User", UserSchema);
