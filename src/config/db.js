const { default: mongoose } = require("mongoose")
const {ENV} = require("../constants/env")
const connectDb = async()=>{
    try {
        const connection = await mongoose.connect(ENV.MONGO_URL)
        console.log("MongoDB connected!", connection.connection.host)
    } catch (error) {
        console.log("MongoDB error occured!", error);
    }
}
module.exports = connectDb