const { RestClientV5 } = require("bybit-api");

const client = new RestClientV5({
    testnet: true
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

module.exports = { getTickers };