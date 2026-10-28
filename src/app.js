const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        console.log(
            `${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`
        );
    });

    next();
});
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.get("/", (req, res) => {
    res.status(200).json({
        status: true,
        message: "Server working perfectly"
    })
    // console.log(req.url)
})


module.exports = app;