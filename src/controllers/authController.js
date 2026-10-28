const User = require("../models/userModel")
const register = async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;
        const exists = await User.findOne({email});
        if(exists){
            return res.status(500).json({
                status: false,
                message: "Account already exists, login instead."
            })
        }
        const user = await User.create({
            fullname,
            email,
            phone,
            password
        });
        if (!user) {
            return res.status(500).json({
                status: false,
                message: "Error occured while creating an account for you"
            })
        }
        return res.status(200).json({
            status: true,
            message: "Account created successfully",
            _id: user._id
        })
    } catch (error) {

    }
}
module.exports = {
    register
}