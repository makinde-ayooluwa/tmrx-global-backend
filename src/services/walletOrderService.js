const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Deposit = require("../models/depositModel");
const verifyCoinAndCreditWallet = async (depositId) => {
    try {
        const deposit = await Deposit.findById(depositId);

        if (!deposit) {
            return {
                success: false,
                message: "Deposit not found."
            };
        }

        const order = await Order.findById(deposit.order);

        if (!order || order.type !== "sell") {
            return {
                success: false,
                message: "Valid sell order not found."
            };
        }

        if (order.user !== deposit.user) {
            return {
                success: false,
                message: "Deposit and order user do not match."
            };
        }
        if (deposit.deliveryStatus === "completed") {
            return {
                success: false,
                message: "This deposit has already been processed."
            };
        }

        if (order.status !== "pending" && order.status !== "processing") {
            return {
                success: false,
                message: "Sell order is not available for processing."
            };
        }

        if (deposit.coin !== order.coin || deposit.network !== order.network) {
            return {
                success: false,
                message: "Deposit coin or network does not match the order."
            };
        }
        if (deposit.status !== "verified") {
            return {
                success: false,
                message: "Deposit has not been verified."
            };
        }

        return {
            success: true,
            simulated: true,
            verified: false,
            credited: false,
            settled: false,
            message: "Validation checks passed. No blockchain verification or wallet credit was performed."
        };

    } catch (error) {
        console.error("Simulated wallet credit error:", error.message);
        throw error;
    }
};
const deductWalletAndSendCoin = async (orderId) => {
    try {
        const order = await Order.findById(orderId);

        if (!order || order.type !== "buy") {
            return {
                success: false,
                message: "Valid buy order not found."
            };
        }

        const user = await User.findById(order.user);

        if (!user) {
            return {
                success: false,
                message: "User account not found."
            };
        }

        if (
    order.status !== "pending" &&
    order.status !== "processing"
) {
    return {
        success: false,
        message: "Order is not available for processing."
    };
}
        if (
            !order.coin ||
            !order.network ||
            !order.coinAmount ||
            Number(order.coinAmount.toString()) <= 0
        ) {
            return {
                success: false,
                message: "Buy order contains invalid coin details."
            };
        }
        if (user.wallet < order.finalAmount) {
            return {
                success: false,
                message: "Insufficient wallet balance."
            };
        }

        return {
            success: true,
            simulated: true,
            walletChecked: true,
            walletDeducted: false,
            coinSent: false,
            settled: false,
            message: "Buy order passed the simulated wallet checks. No funds were deducted and no cryptocurrency was sent."
        };

    } catch (error) {
        console.error("Simulated coin delivery error:", error.message);
        throw error;
    }
};
module.exports = {
    verifyCoinAndCreditWallet,
    deductWalletAndSendCoin
};