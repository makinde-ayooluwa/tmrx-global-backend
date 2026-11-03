const { getWalletBalance } = require("../services/bybit");

const testBybitConnection = async (req, res) => {
    try {
        const balance = await getWalletBalance();

        return res.status(200).json({
            status: true,
            message: "Bybit API connection successful",
            data: balance
        });

    } catch (error) {
        console.error("Bybit connection error:", error);

        return res.status(500).json({
            status: false,
            message: "Bybit API connection failed",
            error: error.message,
            code: error.code || null
        });
    }
};

module.exports = { testBybitConnection };