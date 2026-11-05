
const mongoose = require("mongoose");
const Order = require("../models/orderModel");

const createOrder = async (req, res) => {
    try {
        const {
            type,
            coin,
            coinAmount,
            network,
            marketPriceUsd,
            exchangeRate
        } = req.body;

        const userId = req.user._id;

        // Validate order type
        if (!["buy", "sell"].includes(type)) {
            return res.status(400).json({
                status: false,
                message: "Invalid order type."
            });
        }
const supportedNetworks = {
    USDT: ["TRC20", "ERC20", "BEP20"],
    BTC: ["BITCOIN"],
    ETH: ["ERC20"]
};

if (type === "sell") {
    const coinNetworks = supportedNetworks[coin?.toUpperCase()];

    if (!coinNetworks || !coinNetworks.includes(network?.toUpperCase())) {
        return res.status(400).json({
            status: false,
            message: "Unsupported network for this coin."
        });
    }
}
        // Validate coin
        if (
            typeof coin !== "string" ||
            !/^[A-Z0-9]{2,12}$/i.test(coin)
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid coin."
            });
        }

        // Validate numeric values
        const amount = Number(coinAmount);
        const usdPrice = Number(marketPriceUsd);
        const nairaRate = Number(exchangeRate);

        if (
            !Number.isFinite(amount) ||
            !Number.isFinite(usdPrice) ||
            !Number.isFinite(nairaRate) ||
            amount <= 0 ||
            usdPrice <= 0 ||
            nairaRate <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid order amount or market rate."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                status: false,
                message: "Invalid user session."
            });
        }

        // Demo quote calculation
        const rateNgn = usdPrice * nairaRate;
        const orderAmount = amount * rateNgn;

        // Processing fee: 3%
        const processingFeeRate = 0.03;
        const processingFee = orderAmount * processingFeeRate;

        const finalAmount = type === "buy"
            ? orderAmount + processingFee
            : orderAmount - processingFee;

        if (
            !Number.isFinite(finalAmount) ||
            finalAmount <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Unable to calculate order total."
            });
        }

        // Generate order reference
        const reference = `TMRX-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`;

        // Save demo order
        const order = await Order.create({
            user: userId,
            reference,
            type,
            coin: coin.toUpperCase(),
            network: type === "sell" ? network?.toUpperCase() : null,
            coinAmount: amount,
            marketPriceUsd: usdPrice,
            exchangeRate: nairaRate,
            rateNgn,
            orderAmount,
            processingFeeRate,
            processingFee,
            finalAmount,
            status: "pending"
        });

        return res.status(201).json({
            status: true,
            message: "Demo order created successfully.",
            data: {
                 _id: order._id,
    reference: order.reference,
                type: order.type,
                coin: order.coin,
                coinAmount: order.coinAmount.toString(),
                orderAmount: order.orderAmount,
                processingFee: order.processingFee,
                processingFeeRate: order.processingFeeRate,
                finalAmount: order.finalAmount,
                status: order.status,
settlementStatus: order.settlementStatus
            }
        });

    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to create order."
        });
    }
};

const getOrderHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId })
            .select(
    "reference type coin network coinAmount orderAmount processingFee processingFeeRate finalAmount status settlementStatus createdAt processingAttempts lastProcessingAttempt nextProcessingAt processingHistory"
)
            .sort({ createdAt: -1 })
            .lean();

        const formattedOrders = orders.map((order) => ({
    _id: order._id,
    reference: order.reference,
    type: order.type,
    coin: order.coin,
    coinAmount: order.coinAmount.toString(),
    orderAmount: order.orderAmount,
    processingFee: order.processingFee,
    processingFeeRate: order.processingFeeRate,
    finalAmount: order.finalAmount,
    status: order.status,
    settlementStatus: order.settlementStatus,
network: order.network, 
    processingAttempts: order.processingAttempts,
    lastProcessingAttempt: order.lastProcessingAttempt,
    nextProcessingAt: order.nextProcessingAt,
    processingHistory: order.processingHistory,
    date: order.createdAt,
    category: "Order"
}));

        return res.status(200).json({
            status: true,
            message: "Order history retrieved successfully.",
            data: formattedOrders
        });

    } catch (error) {
        console.error("Order history error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to retrieve order history."
        });
    }
};

module.exports = { createOrder, getOrderHistory };
