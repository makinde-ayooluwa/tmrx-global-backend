const sessions = new Map();

const createSession = (userId) => {
    const crypto = require("crypto");

    const token = crypto.randomBytes(32).toString("hex");

    sessions.set(token, userId.toString());

    return token;
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", authHeader ? "Received" : "Missing");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: false,
            message: "Authorization token missing."
        });
    }

    const token = authHeader.split(" ")[1];

    console.log("Token exists in sessions:", sessions.has(token));

    const userId = sessions.get(token);

    if (!userId) {
        return res.status(401).json({
            status: false,
            message: "Invalid or expired session."
        });
    }

    req.user = { _id: userId };

    console.log("Authentication successful");

    next();
};

module.exports = {
    createSession,
    authMiddleware
};