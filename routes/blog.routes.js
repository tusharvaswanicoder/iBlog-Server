const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: "public_bhtp5wPcf9nFE4nJV+duwJkMk0w=",
    privateKey: "private_HtssTyuIbf4MsPCBBodNr3JPn+I=",
    urlEndpoint: "https://ik.imagekit.io/dchud9yflpr/",
});

const blogModel = require("../models/blog.model.js");

const multer = require("multer");
const {
    authMiddleware,
    authMiddlewareAllowNoAuth,
} = require("../middlewares/authMiddleware.js");
const BlogLike = require("../models/bloglike.model.js");
const upload = multer();

//get all blogs
router.get("/search", authMiddlewareAllowNoAuth, async (req, res) => {
    try {
        const { filter, query, key, page } = req.query;
        let findQueryObject = {};
        let select;
        if (req.user) {
            findQueryObject = { user: req.user.id };
        }
        if ((query && key) || key) {
            findQueryObject = { ...findQueryObject, $text: { $search: key } };
        } else if (query) {
            findQueryObject = {
                ...findQueryObject,
                title: {
                    $regex: query,
                    $options: "i",
                },
            };
            select = "title -_id";
        }
        let sortObject = {};
        switch (filter) {
            case "all":
                break;
            case "mostpopular":
                sortObject = { likes: -1 };
                break;
            case "newest":
                sortObject = { createdAt: -1 };
                break;
            case "oldest":
                sortObject = { createdAt: 1 };
                break;
            default:
                return res.status(400).json({ message: "Invalid filter" });
        }
        const data = await blogModel
            .find(findQueryObject, select)
            // .skip((Number(page) - 1) * 10)
            // .limit(10)
            .sort(sortObject)
            .populate(...(select ? [] : ["user", "name profilePic -_id"]));
        console.log(data.length);
        return res.status(200).json(data);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

//create a blog
router.post(
    "/create",
    authMiddleware,
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "title", maxCount: 1 },
        { name: "content", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const user = req.user;
            const { url } = await imagekit.upload({
                file: req.files.bannerImage[0].buffer,
                fileName: uuidv4(16),
            });
            const newBlog = new blogModel();
            newBlog.title = req.body.title;
            newBlog.content = req.body.content;
            newBlog.bannerImage = url;
            newBlog.user = user._id;
            await newBlog.save();
            return res
                .status(200)
                .json({ message: "Blog created successfully!" });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Some error occured",
            });
        }
    }
);

//get blog data
router.get("/:blogId", authMiddlewareAllowNoAuth, async (req, res) => {
    try {
        const { blogId } = req.params;
        let userLiked;
        const blog = await blogModel
            .findById(blogId, "-_id")
            .populate("user", "name profilePic -_id");
        if (req.user) {
            userLiked = Boolean(
                await BlogLike.findOne({ userId: req.user._id })
            );
        }
        if (blog) {
            return res
                .status(200)
                .json({ ...blog._doc, ...(req.user ? { userLiked } : {}) });
        } else {
            return res.status(400).json({
                message: "Blog does not exist",
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

//get blogs of a user
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const blog = await blogModel
            .find({ user: userId })
            .populate("user", "name profilePic -_id");
        console.log(blog);
        if (blog) {
            return res.status(200).json(blog);
        } else {
            return res.status(400).json({
                message: "Blog does not exist",
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

//like/dislike a blog
router.post("/vote/:blogId", authMiddleware, async (req, res) => {
    try {
        const { blogId } = req.params;
        const user = req.user;
        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.status(400).json({ message: "Blog not found!" });
        }
        const alreadyLiked = await BlogLike.findOne({ userId: user._id });
        if (alreadyLiked) {
            await BlogLike.deleteOne({ userId: user._id, blogId: blogId });
            blog.likes -= 1;
            await blog.save();
            return res.status(200).json({ message: "Blog Disliked!" });
        }
        blog.likes += 1;
        const newLike = new BlogLike();
        newLike.userId = user._id;
        newLike.blogId = blogId;
        await newLike.save();
        await blog.save();
        return res.status(200).json({ message: "Blog Liked!" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

module.exports = router;
