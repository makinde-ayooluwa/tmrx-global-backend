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
async function getSupportedNetworks() {
  try {
    // Call getCoinInfo (you can pass { coin: 'USDT' } for a specific coin, or leave it empty to fetch all)
    const response = await client.getCoinInfo();

    if (response.retCode === 0) {
      const rows = response.result.rows;
      const supportedNetworksMap = {};

      // Map through each coin and pull its supported chains
      rows.forEach((item) => {
        const coinSymbol = item.coin;
        const chains = item.chains.map((c) => c.chain);
        supportedNetworksMap[coinSymbol] = chains;
      });

      console.log("Supported Networks Map:", supportedNetworksMap);
      return supportedNetworksMap;
    } else {
      console.error("Bybit API Error:", response.retMsg);
    }
  } catch (error) {
    console.error("Failed to fetch networks:", error);
  }
}

// Call the function
getSupportedNetworks();
module.exports = { getTickers, getWalletBalance };