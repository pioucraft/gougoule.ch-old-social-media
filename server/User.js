const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    unique: String,
    following: [String],
    followers: [String],
    likes: [Number],
    messages: [Number],
    password: String,
    token: String,
    bio: String,
    profilePicture: String
})

module.exports = mongoose.model("User", userSchema)