const { RestClientV5 } = require("bybit-api");

const client = new RestClientV5({
    testnet: false,
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
async function getSupportedNetworksArray() {
  try {
    const response = await client.getCoinInfo();

    if (response.retCode === 0) {
      const rows = response.result.rows;

      // Transform rows into a clean array of objects
      const networksArray = rows.map((item) => ({
        symbol: item.coin,
        name: item.name || item.coin,
        networks: item.chains.map((c) => c.chain),
      }));

      console.log("Supported Networks Array:", networksArray);
      return networksArray;
    } else {
      console.error("Bybit API Error:", response.retMsg);
      return [];
    }
  } catch (error) {
    console.error("Failed to fetch networks:", error);
    return [];
  }
}
module.exports = { getTickers, getWalletBalance, getSupportedNetworksArray };