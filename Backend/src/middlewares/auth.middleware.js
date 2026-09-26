const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {

    const token = req.cookies?.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.exists({ token })
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Invalid token."
        })
    }

    req.user = decoded
    return next()
}


module.exports = { authUser }