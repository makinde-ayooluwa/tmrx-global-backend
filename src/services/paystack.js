const axios = require("axios");

const paystackUrl = "https://api.paystack.co";

const verifyPayment = async (reference) => {
    const response = await axios.get(
        `${paystackUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
            timeout: 15000,
        }
    );

    return response.data;
};

module.exports = {
    verifyPayment,
};