const sendCoin = async ({
    userId,
    coin,
    network,
    amount,
    destinationAddress,
    depositId
}) => {
    try {
        // TODO: Replace with an approved delivery provider integration.

        console.log("Simulated coin delivery:", {
            userId,
            coin,
            network,
            amount,
            destinationAddress,
            depositId
        });

        return {
            success: false,
            status: "not_configured",
            reference: null,
            message: "Coin delivery provider has not been configured."
        };

    } catch (error) {
        console.error("Coin delivery error:", error.message);
        throw error;
    }
};

module.exports = { sendCoin };