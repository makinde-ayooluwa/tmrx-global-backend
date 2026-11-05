const { getWalletBalance, getSupportedNetworksArray } = require("../services/bybit");

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
const getSupportedNetworks = async (req, res) => {
  try {
    const networksData = await getSupportedNetworksArray();
    
    return res.status(200).json({
      success: true,
      count: networksData.length,
      data: networksData
    });
  } catch (error) {
    console.error("Bybit Network Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching crypto networks",
      error: error.message
    });
  }
};
module.exports = { testBybitConnection, getSupportedNetworks };