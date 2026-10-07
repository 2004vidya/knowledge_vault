import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()


 async function register(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields (username, email, password) are required"
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            })
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [
                { email },
                { username }
            ]
        })
        if (isAlreadyRegistered) {
            return res.status(400).json({
                success: false,
                message: "User already registered"
            })
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            password: hash
        })
        const token = jwt.sign({
            id: user._id,
            username: user.username,
        }, process.env.JWT_SECRET, {
            expiresIn: "3d"
        })
        res.cookie("token", token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: "Lax"
        })
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }

}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            })
        }
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "invalid credentials"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        const token = jwt.sign({
            id: user._id,
            username: user.username,
        }, process.env.JWT_SECRET, {
            expiresIn: "3d"
        })
        res.cookie("token", token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: "Lax"
        })
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}

async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user.id);

        res.status(200).json({
            message: "user fetched successfully",
            user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }

}

export default {register,login,getMe}
