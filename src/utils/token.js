const Token = require("../models/tokenModel");

const generateToken = async (
    email,
    purpose = "email-verification"
) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        // Replace any existing token for the same purpose.
        await Token.deleteMany({
            user: normalizedEmail,
            purpose
        });

        return await Token.create({
            user: normalizedEmail,
            purpose
        });
    } catch (error) {
        console.error("Generate token error:", error);
        return null;
    }
};

module.exports = {
    generateToken
};