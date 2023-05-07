const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    content: String,
    author: String,
    likes: [String],
    unique: Number,
    date: String,
    responses: [Number],
    responseTo: Number,
    ip: String
})

module.exports = mongoose.model("Message", messageSchema)