const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        bannerImage: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);
blogSchema.index({ title: "text" });

const Blog = mongoose.model("blogs", blogSchema);

module.exports = Blog;
