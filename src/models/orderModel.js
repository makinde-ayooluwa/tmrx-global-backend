
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },

    reference: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String,
        enum: ["buy", "sell"],
        required: true
    },

    coin: {
        type: String,
        required: true,
        uppercase: true
    },

    coinAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    marketPriceUsd: {
        type: Number,
        required: true
    },

    exchangeRate: {
        type: Number,
        required: true
    },

    rateNgn: {
        type: Number,
        required: true
    },

    orderAmount: {
        type: Number,
        required: true
    },

    processingFeeRate: {
        type: Number,
        default: 0.03
    },

    processingFee: {
        type: Number,
        required: true
    },

    finalAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: [
            "pending",
            "processing",
            "completed",
            "rejected",
            "cancelled"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
