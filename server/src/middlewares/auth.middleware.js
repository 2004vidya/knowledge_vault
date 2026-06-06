import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()


async function authUser(req,res,next){
    const authHeader = req.headers.authorization || ""
    const bearerToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null
    const token = bearerToken || req.cookies?.token

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "token not provided"
        })
    }

     try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();

    }
    catch (err) {
        console.log(err)
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        })
    }
}

export default authUser