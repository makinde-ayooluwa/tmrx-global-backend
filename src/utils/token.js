const Token = require("../models/tokenModel")

const generateToken = async(email)=>{
    try {
        const token = await Token.create({
            user: email
        })
        return token;
    } catch (error) {
        return error;
    }
}
module.exports = {
    generateToken
}