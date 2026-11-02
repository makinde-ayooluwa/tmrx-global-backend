const express = require("express");

const router = express.Router();

router.get("/usd-ngn", async (req, res) => {
    try {
        const response = await fetch(
            "https://open.er-api.com/v6/latest/USD"
        );

        if (!response.ok) {
            throw new Error("Exchange rate request failed");
        }

        const data = await response.json();

        if (data.result !== "success" || !data.rates?.NGN) {
            throw new Error("NGN exchange rate unavailable");
        }

        res.status(200).json({
            success: true,
            base: "USD",
            target: "NGN",
            rate: data.rates.NGN,
            lastUpdated: data.time_last_update_utc
        });

    } catch (error) {
        console.error("Currency API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch exchange rate"
        });
    }
});

module.exports = router;