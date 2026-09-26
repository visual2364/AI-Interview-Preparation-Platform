const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserController
 * @description register a new user, expects username,email and password in the request body
 * @access Public
 */

async function registerUserController(req,res){
    const{username,email,password} = req.body
    const normalizedUsername = typeof username === "string" ? username.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!normalizedUsername || normalizedUsername.length > 40 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
        typeof password !== "string" || password.length < 8 || password.length > 72) {
        return res.status(400).json({
            message:"Provide a username of 1 to 40 characters, a valid email address, and a password between 8 and 72 characters."
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or:[{ username: normalizedUsername },{ email: normalizedEmail }]

    })
    if(isUserAlreadyExists){
        return res.status(400).json({
            message:"Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password,10)

    const user = await userModel.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password:hash
    })

    const token = jwt.sign(
        { id:user._id,username: user.username },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )

    const isProduction = process.env.NODE_ENV === "production"

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
    })

    res.status(201).json({
        message:"User registered successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user,expects email and password in the request body
 * @access Public
 */

async function loginUserController(req,res){
    const {email,password} = req.body

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required." })
    }

    const user = await userModel.findOne({ email: email.trim().toLowerCase() })

    if(!user){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return res.status(400).json({
            message:"Invalid email or password"
        })   
    }

    const token = jwt.sign(
        {id:user._id,username:user.username},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )

    const isProduction = process.env.NODE_ENV === "production"

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
    })

    res.status(200).json({
        message:"User loggedIn successfully.",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req,res){
    const token = req.cookies?.token

    if(token){
        await tokenBlacklistModel.create({token})
    }
    const isProduction = process.env.NODE_ENV === "production"

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
    })

    res.status(200).json({
        message:"User logged out successfully"
    })

}


/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req,res){
    const user = await userModel.findById(req.user.id)

    if (!user) {
        return res.status(404).json({ message: "User not found." })
    }

    res.status(200).json({
        message:"User details fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })

}

module.exports ={
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}