
const { WebsocketClient, RestClientV5 } = require("bybit-api");
const { broadcastMarketData } = require("./frontendSocket");

const restClient = new RestClientV5({
    testnet: true
});

const ws = new WebsocketClient({
    testnet: true
});

ws.on("open", ({ wsKey }) => {
    console.log("Bybit WebSocket connected:", wsKey);
});

ws.on("update", (data) => {
    broadcastMarketData(data);
});

ws.on("exception", (error) => {
    console.error("Bybit WebSocket error:", error);
});

ws.on("reconnected", () => {
    console.log("Bybit WebSocket reconnected");
});

const subscribeToAllMarkets = async () => {
    try {
        const response = await restClient.getInstrumentsInfo({
            category: "spot",
            limit: 1000
        });

        const instruments = response.result.list;

        const symbols = instruments
            .filter((coin) =>
                coin.quoteCoin === "USDT" &&
                coin.status === "Trading"
            )
            .map((coin) => `tickers.${coin.symbol}`);

        console.log(`Subscribing to ${symbols.length} USDT markets`);

        // Subscribe in batches to avoid oversized subscription requests.
        const batchSize = 10;

        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            ws.subscribeV5(batch, "spot");
        }

    } catch (error) {
        console.error("Unable to load Bybit markets:", error);
    }
};

subscribeToAllMarkets();

module.exports = ws;
