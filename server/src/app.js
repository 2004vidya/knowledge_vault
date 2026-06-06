
import express  from "express"
import cors from "cors"
import authRoutes from "./routes/auth.routes.js"
import itemRoutes from "./routes/item.routes.js"
import cookieParser from "cookie-parser"

const app = express()
app.use(express.json())
app.use(cookieParser())

const staticAllowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean)

const vercelPreviewRegex = process.env.VERCEL_PREVIEW_ORIGIN_REGEX
  ? new RegExp(process.env.VERCEL_PREVIEW_ORIGIN_REGEX)
  : /^https:\/\/knowledge-vault-[a-z0-9-]+\.vercel\.app$/

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (staticAllowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true
}))

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running ✅" })
})

app.use("/api/auth",authRoutes)
app.use("/api/items",itemRoutes)

export default app