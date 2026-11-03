const { verifyPayment } = require("../services/paystack");
const User = require("../models/userModel");
const Payment = require("../models/paymentModel");

const paymentVerification = async (req, res) => {
    try {
        console.log("Payment controller reached");
        const { reference } = req.body;
        const userId = req.user._id;

        if (!reference) {
            return res.status(400).json({
                status: false,
                message: "Payment reference is required."
            });
        }

        // Verify payment with Paystack
        const response = await verifyPayment(reference);

        if (
            !response.status ||
            response.data.status !== "success"
        ) {
            return res.status(400).json({
                status: false,
                message: "Payment was not successful."
            });
        }

        const transaction = response.data;

        // Validate payment details
        if (
            transaction.currency !== "NGN" ||
            transaction.customer.email?.toLowerCase() !==
            (await User.findById(userId)).email.toLowerCase()
        ) {
            return res.status(400).json({
                status: false,
                message: "Payment details do not match your account."
            });
        }

        // Check whether payment was already processed
        const existingPayment = await Payment.findOne({ reference });

        if (existingPayment) {
            if (existingPayment.user.toString() !== userId.toString()) {
                return res.status(409).json({
                    status: false,
                    message: "This payment has already been processed."
                });
            }

            const user = await User.findById(userId);

            return res.status(200).json({
                status: true,
                message: "Payment was already processed.",
                alreadyProcessed: true,
                data: { user }
            });
        }

        const amount = transaction.amount / 100;

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid payment amount."
            });
        }

        // Record payment before crediting wallet
        await Payment.create({
            user: userId,
            reference,
            amount: transaction.amount,
            currency: transaction.currency,
            status: "success"
        });

        // Credit wallet
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { wallet: amount } },
            { returnDocument: "after" }
        );

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User account not found."
            });
        }

        return res.status(200).json({
            status: true,
            message: "Wallet funded successfully.",
            data: {
                user,
                amount
            }
        });

    } catch (error) {
        console.error("Payment verification error:", error);

        return res.status(500).json({
            status: false,
            message: "Payment verification failed."
        });
    }
};
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const payments = await Payment.find({ user: userId })
            .select("reference amount currency status createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const transactions = payments.map((payment) => ({
            _id: payment._id,
            reference: payment.reference,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            date: payment.createdAt,
            type: "Deposit"
        }));

        return res.status(200).json({
            status: true,
            message: "Transaction history retrieved successfully.",
            data: transactions
        });

    } catch (error) {
        console.error("Transaction history error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to retrieve transaction history."
        });
    }
};
module.exports = { paymentVerification, getPaymentHistory };