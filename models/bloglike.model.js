const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogLikeSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        blogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "blogs",
        },
    },
    { timestamps: true }
);

const BlogLike = mongoose.model("bloglikes", blogLikeSchema);

module.exports = BlogLike;
