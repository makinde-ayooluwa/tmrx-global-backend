const User = require("../models/userModel");

exports.getUser = async(req, res)=>{
    const {id} = req.body;
    try {
        const user = await User.findById(id);
        return res.status(200).json({
            status: true,
            message: "Profile data fetched successfully",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to fetch profile data"
        })
    }
}