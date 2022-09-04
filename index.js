require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const blogRouter = require("./routes/blog.routes");
const userRouter = require("./routes/user.routes");
const app = express();
const ImageKit = require("imagekit");
const imagekit = new ImageKit({
    publicKey: "public_bhtp5wPcf9nFE4nJV+duwJkMk0w=",
    privateKey: "private_HtssTyuIbf4MsPCBBodNr3JPn+I=",
    urlEndpoint: "https://ik.imagekit.io/dchud9yflpr/",
});
const multer = require("multer");
const { authMiddleware } = require("./middlewares/authMiddleware.js");
const upload = multer();

// db
mongoose
    .connect(
        `mongodb+srv://tusharvaswanicoder:jsismylove@cluster0.4botggk.mongodb.net/?retryWrites=true&w=majority`
    )
    .then(() => console.log("**DB CONNECTED**"))
    .catch((err) => console.log("DB CONNECTION ERR => ", err));

// apply middlewares

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/users", userRouter);
app.use("/blogs", blogRouter);
app.post("/rte/image", upload.single("image"), async (req, res) => {
    try {
        const { url } = await imagekit.upload({
            file: req.file.buffer,
            fileName: uuidv4(16),
        });
        return res.status(200).json({ url });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Some error occured",
        });
    }
});

// port
const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Server is running on port ${port}`));
