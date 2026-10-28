const mongoose = require("mongoose");
const crypto = require("crypto");
const tokenSchema = new mongoose.Schema(
    {
        token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomInt(10000000, 100000000).toString()
},
        user: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Expire tokens 1000 seconds after creation.
tokenSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 1800 }
);

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;