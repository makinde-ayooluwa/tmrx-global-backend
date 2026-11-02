const WebSocket = require("ws");

let wss;

const initializeFrontendSocket = (server) => {
    wss = new WebSocket.Server({ server });

    console.log("Frontend WebSocket server initialized");

    wss.on("connection", (socket) => {
        console.log("Frontend client connected");

        socket.on("close", () => {
            console.log("Frontend client disconnected");
        });

        socket.on("error", (error) => {
            console.error("Frontend socket error:", error.message);
        });
    });
};

// const broadcastMarketData = (data) => {
//     if (!wss) return;

//     const message = JSON.stringify({
//         type: "market-update",
//         data
//     });

//     wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(message);
//         }
//     });
// };
const broadcastMarketData = (data) => {
    console.log("BROADCASTING:", data);

    if (!wss) {
        console.log("WebSocket server not initialized");
        return;
    }

    const message = JSON.stringify({
        type: "market-update",
        data
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};
module.exports = {
    initializeFrontendSocket,
    broadcastMarketData
};