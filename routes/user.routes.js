const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: "public_bhtp5wPcf9nFE4nJV+duwJkMk0w=",
    privateKey: "private_HtssTyuIbf4MsPCBBodNr3JPn+I=",
    urlEndpoint: "https://ik.imagekit.io/dchud9yflpr/",
});

const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const {
    authMiddleware,
    authMiddlewareAllowNoAuth,
} = require("../middlewares/authMiddleware.js");
const upload = multer();

//register route
router.post(
    "/register",
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "name", maxCount: 1 },
        { name: "email", maxCount: 1 },
        { name: "password", maxCount: 1 },
        { name: "desc", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { name, email, password, desc } = req.body;
            if (!name || !email || !password || !desc) {
                return res.status(400).json({
                    message: "Please provide correct details",
                });
            }
            const user = await userModel.findOne({
                email,
            });
            if (user) {
                return res.status(400).json({
                    message: "User already exists",
                });
            }
            const newUser = new userModel();
            newUser.name = name;
            newUser.email = email;
            newUser.password = newUser.generatePasswordHash(password);
            newUser.desc = desc;
            newUser.token = jwt.sign(
                {
                    _id: newUser._id,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "10d",
                }
            );
            const { url } = await imagekit.upload({
                file: req.files.profilePic[0].buffer,
                fileName: uuidv4(16),
            });
            newUser.profilePic = url;
            await newUser.save();
            return res.status(200).json({
                message: "User created successfully",
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Some error occured",
            });
        }
    }
);

//login route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password",
            });
        }
        const user = await userModel.findOne({
            email,
        });
        if (user) {
            const isUserAuthenticated = new userModel().validatePassword(
                password,
                user.password
            );
            if (isUserAuthenticated) {
                const token = jwt.sign(
                    {
                        id: user._id,
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "10d",
                    }
                );
                return res.status(200).json({
                    token,
                });
            } else {
                return res.status(400).json({
                    message: "Password is incorrect",
                });
            }
        } else {
            return res.status(400).json({
                message: "Account does not exist",
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

//get user private details by userid
router.get("/userinfo", authMiddleware, async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await userModel.findById(userId);
        if (user) {
            return res.status(200).json({
                email: user.email,
                name: user.name,
                profilePic: user.profilePic,
                desc: user.desc,
            });
        } else {
            return res.status(400).json({
                message: "User does not exist",
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

//get user public details by userid
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);
        if (user) {
            return res.status(200).json({
                email: user.email,
                name: user.name,
                profilePic: user.profilePic,
                desc: user.desc,
            });
        } else {
            return res.status(400).json({
                message: "User does not exist",
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

module.exports = router;
