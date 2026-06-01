
import express  from "express"
import cors from "cors"
import authRoutes from "./routes/auth.routes.js"
import itemRoutes from "./routes/item.routes.js"
import cookieParser from "cookie-parser"

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use("/api/auth",authRoutes)
app.use("/api/items",itemRoutes)

export default app