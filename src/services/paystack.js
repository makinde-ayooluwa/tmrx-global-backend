const { default: axios } = require("axios")
const paystackUrl = "https://api.paystack.co";
const verifyPayment = async(reference)=>{
    try {
        const response = await axios.post(`${paystackUrl}/transaction/verify`,{
            reference
        })
        const result = response.data;
        return result;
    } catch (error) {
        return error;
    }
}

module.exports = {
    verifyPayment
}