const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const mongoose = require("mongoose")

const app = express()
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    process.env.FRONTEND_URL?.replace(/\/$/, ""),
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

app.get("/api/health", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ok" : "unavailable",
        database: databaseReady ? "connected" : "disconnected",
    })
})

/*require all the routes hear */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/*using all the routes here */
app.use("/api/auth",authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    let status = err.status || err.statusCode || 500
    let message = status >= 500 ? "Internal server error." : err.message

    if (err.code === "LIMIT_FILE_SIZE") {
        status = 413
        message = "Resume file must be 3 MB or smaller."
    } else if (err.code === 11000) {
        status = 409
        message = "An account already exists with those details."
    } else if (err.name === "ValidationError" || err.name === "CastError") {
        status = 400
        message = "The submitted data is invalid."
    } else if (err.message === "Not allowed by CORS") {
        status = 403
        message = "This origin is not allowed."
    }

    if (status >= 500) {
        console.error("Request failed:", err)
    }

    return res.status(status).json({ message })
})


module.exports = app