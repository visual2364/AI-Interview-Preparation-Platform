const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
].filter(Boolean)

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
            return
        }

        callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
}))

/*require all the routes hear */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/*using all the routes here */
app.use("/api/auth",authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app