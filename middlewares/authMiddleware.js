const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

module.exports = {
    authMiddleware: async (req, res, next) => {
        try {
            const bearerToken = req.headers.authorization;
            const token = bearerToken.split(" ")[1];
            jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
                if (err) {
                    return res
                        .status(401)
                        .json({ message: "You are not authorized" });
                }
                const { id } = payload;
                req.user = await userModel.findById(id);
                next();
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Some error occured",
            });
        }
    },
    authMiddlewareAllowNoAuth: async (req, res, next) => {
        try {
            const bearerToken = req.headers.authorization;
            if (bearerToken) {
                const token = bearerToken.split(" ")[1];
                jwt.verify(
                    token,
                    process.env.JWT_SECRET,
                    async (err, payload) => {
                        if (err) {
                            return next();
                        }
                        const { id } = payload;
                        req.user = await userModel.findById(id);
                        return next();
                    }
                );
            } else {
                return next();
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Some error occured",
            });
        }
    },
};
