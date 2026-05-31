import mongoose from "mongoose";
import dns from "dns";

// Workaround for Node.js DNS resolution issues with mongodb+srv
dns.setDefaultResultOrder('ipv4first');

export const connectTodb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
}

