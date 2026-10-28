const dotenv = require("dotenv");
const app = require("./app");
const { ENV } = require("./constants/env");
const connectDb = require("./config/db");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const startServer = async () => {
    await connectDb()
    // console.log(process.env.SERVER_PORT)
    app.listen(ENV.SERVER_PORT ?? 8000, () => {
        console.log(`Server listening on port ${ENV.SERVER_PORT}`);
    })
    
}
startServer()