import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()


async function authUser(req, res, next){
    // Check cookies first, then Authorization header
    let token = req.cookies.token;
    
    if (!token) {
        // Try to get token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }
    
    console.log("🔍 Auth Debug - Token from cookies:", req.cookies.token ? "✅ Found" : "❌ Not found");
    console.log("🔍 Auth Debug - Token from header:", req.headers.authorization ? "✅ Found" : "❌ Not found");
    
    if (!token) {
        console.log("❌ No token provided in cookies or Authorization header");
        return res.status(401).json({
            success: false,
            message: "token not provided"
        })
    }

     try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        console.log("✅ Token verified successfully for user:", req.user.id);
        next();

    }
    catch (err) {
        console.log("❌ Token verification failed:", err.message)
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        })
    }   
}

export default authUser