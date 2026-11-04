
const mongoose = require("mongoose");

const processingHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "rejected", "error"],
        default: "pending"
    },
    message: {
        type: String,
        default: ""
    },
    checkedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

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
    },

    processingAttempts: {
        type: Number,
        default: 0
    },

    lastProcessingAttempt: {
        type: Date,
        default: null
    },
    claimedAt: {
    type: Date,
    default: null
},
    nextProcessingAt: {
        type: Date,
        default: Date.now
    },

    processingHistory: {
        type: [processingHistorySchema],
        default: []
    }

}, {
    timestamps: true
});

orderSchema.index({
    status: 1,
    nextProcessingAt: 1
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
