const dotenv = require("dotenv");
const app = require("./app");
const { ENV } = require("./constants/env");
const connectDb = require("./config/db");
const path = require("path");

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const {
    initializeFrontendSocket
} = require("./services/frontendSocket");

require("./services/bybitSocket");

const startServer = async () => {
    await connectDb();

    const server = app.listen(ENV.SERVER_PORT ?? 8000,"0.0.0.0", () => {
        console.log(`Server listening on port ${ENV.SERVER_PORT ?? 8000}`);
    });

    initializeFrontendSocket(server);
};

startServer();