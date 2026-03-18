import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()


 async function register(req, res) {
    try {
        const { username, email, password } = req.body

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
        res.cookie("token", token)
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        })
    } catch (error) {
        console.log(error)
    }

}

async function login(req, res) {
    try {
        const { email, password } = req.body;
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
        res.cookie("token", token)
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user
        })
    } catch (error) {
        console.log(error);

    }
}

async function getMe(req, res) {
    const user = await userModel.findById(req.user.id);

    res.status(200).json({
        message: "user fetched successfully",
        user
    })

}

export default {register,login,getMe}
