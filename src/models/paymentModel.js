const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true, // Amount in kobo
        },
        currency: {
            type: String,
            default: "NGN",
        },
        status: {
            type: String,
            enum: ["success"],
            default: "success",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("payments", paymentSchema);