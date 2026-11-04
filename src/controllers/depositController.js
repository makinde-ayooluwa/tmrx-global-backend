const mongoose = require("mongoose");
const Deposit = require("../models/depositModel");
const Order = require("../models/orderModel");

const createDeposit = async (req, res) => {
    try {
        const { orderId, txId } = req.body;
        const userId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(orderId) ||
            typeof txId !== "string" ||
            !txId.trim()
        ) {
            return res.status(400).json({
                status: false,
                message: "A valid order ID and transaction ID are required."
            });
        }

        // Find the user's sell order
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            type: "sell"
        });

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Sell order not found."
            });
        }

        if (order.status !== "pending") {
            return res.status(400).json({
                status: false,
                message: "This order is not available for deposit submission."
            });
        }

        // Prevent multiple deposits for the same order
        const existingOrderDeposit = await Deposit.findOne({
            order: order._id
        });

        if (existingOrderDeposit) {
            return res.status(409).json({
                status: false,
                message: "A deposit has already been submitted for this order."
            });
        }

        // Prevent reuse of a transaction ID
        const existingTxId = await Deposit.findOne({
            txId: txId.trim()
        });

        if (existingTxId) {
            return res.status(409).json({
                status: false,
                message: "This transaction ID has already been submitted."
            });
        }

        // Create the deposit using order information
        const deposit = await Deposit.create({
            user: userId,
            order: order._id,
            coin: order.coin,
            network: "PENDING_CONFIGURATION",
            txId: txId.trim(),
            amount: order.coinAmount,
            depositAddress: "",
            status: "pending",
            verificationMessage: "Awaiting deposit verification."
        });

        return res.status(201).json({
            status: true,
            message: "Transaction ID submitted successfully. Awaiting verification.",
            data: {
                _id: deposit._id,
                order: deposit.order,
                txId: deposit.txId,
                coin: deposit.coin,
                amount: deposit.amount.toString(),
                status: deposit.status
            }
        });

    } catch (error) {
        console.error("Create deposit error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to submit transaction ID."
        });
    }
};
const getDepositHistory = async (req, res) => {
    try {
        const deposits = await Deposit.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Deposit history retrieved successfully.",
            data: deposits.map((deposit) => ({
                ...deposit.toObject(),
                amount: deposit.amount.toString()
            }))
        });

    } catch (error) {
        console.error("Get deposit history error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to retrieve deposit history."
        });
    }
};


module.exports = {
    createDeposit,
    getDepositHistory
};