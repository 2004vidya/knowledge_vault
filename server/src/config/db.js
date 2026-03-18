import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()

export const connectTodb = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to db")
    } catch (error) {
        console.log("error")
        
    }
}

