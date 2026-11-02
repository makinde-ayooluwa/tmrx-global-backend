const { verifyPayment } = require("../services/paystack");

const paymentVerification = async (req, res) => {
    try {
        const { reference } = req.body;
        const response = await verifyPayment(reference);
        console.log(response);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    paymentVerification
}