
const mongoose = require("mongoose");

const verificationHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "verified", "rejected", "error"],
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

const depositSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
order: {
    type: String,
    required: true
},
    coin: {
        type: String,
        required: true,
        uppercase: true
    },

    network: {
        type: String,
        required: true
    },

    txId: {
        type: String,
        required: true,
        trim: true
    },

    depositAddress: {
        type: String,
        default: ""
    },

    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "verifying", "verified", "rejected"],
        default: "pending"
    },

    verificationMessage: {
        type: String,
        default: "Awaiting verification"
    },

    verificationAttempts: {
        type: Number,
        default: 0
    },

    lastVerificationAttempt: {
        type: Date,
        default: null
    },
claimedAt: {
    type: Date,
    default: null
},
    nextVerificationAt: {
        type: Date,
        default: Date.now
    },

    verificationHistory: {
        type: [verificationHistorySchema],
        default: []
    },

    verifiedAt: {
        type: Date,
        default: null
    },

    deliveryStatus: {
        type: String,
        enum: [
            "not_started",
            "processing",
            "completed",
            "failed"
        ],
        default: "not_started"
    },

    deliveryAddress: {
        type: String,
        default: ""
    },

    deliveryReference: {
        type: String,
        default: ""
    },

    deliveryMessage: {
        type: String,
        default: "Delivery has not started"
    },

    deliveredAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

depositSchema.index(
    { network: 1, txId: 1 },
    { unique: true }
);

depositSchema.index({
    status: 1,
    nextVerificationAt: 1
});

const Deposit = mongoose.model("deposits", depositSchema);

module.exports = Deposit;
