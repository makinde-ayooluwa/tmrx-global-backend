const { default: mongoose } = require("mongoose");

const depositSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },

    coin: {
        type: String,
        required: true
    },

    network: {
        type: String,
        required: true
    },

    txId: {
        type: String,
        required: true
    },

    depositAddress: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: [
            "pending",
            "confirming",
            "verified",
            "rejected"
        ],
        default: "pending"
    },

    confirmations: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});