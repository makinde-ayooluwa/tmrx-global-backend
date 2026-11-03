const { RestClientV5 } = require("bybit-api");

const client = new RestClientV5({
    testnet: true,
    secret: process.env.BYBIT_SECRET_KEY,
    key: process.env.BYBIT_API_KEY
});

const getTickers = async (category = "spot") => {
    try {
        console.log('=========================================================================================================');
        console.log();
        console.log('=========================================================================================================');
        const response = await client.getTickers({
            category
        });

        return response.result.list;
    } catch (error) {
        console.error("Bybit ticker error:", error.message);
        throw error;
    }
};
const getWalletBalance = async () => {
    try {
        const response = await client.getWalletBalance({
            accountType: "UNIFIED"
        });

        return response.result.list;

    } catch (error) {
        console.error("Bybit wallet error:", error.message);
        throw error;
    }
};
module.exports = { getTickers, getWalletBalance };