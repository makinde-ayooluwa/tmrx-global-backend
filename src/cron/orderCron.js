
const { CronJob } = require("cron");
const Order = require("../models/orderModel");

const {
    deductWalletAndSendCoin
} = require("../services/walletOrderService");

let isProcessingOrders = false;

const RETRY_INTERVAL = 5 * 60 * 1000;
const LOCK_TIMEOUT = 2 * 60 * 1000;

const processPendingOrders = async () => {
    if (isProcessingOrders) {
        console.log("Previous order cron is still running.");
        return;
    }

    isProcessingOrders = true;

    try {
        console.log("Checking pending orders...");

        // Recover orders interrupted during processing.
        const staleTime = new Date(
            Date.now() - LOCK_TIMEOUT
        );

        const recovered = await Order.updateMany(
            {
                type: "buy",
                status: "processing",
                claimedAt: { $lte: staleTime }
            },
            {
                $set: {
                    status: "pending",
                    claimedAt: null,
                    nextProcessingAt: new Date()
                },
                $push: {
                    processingHistory: {
                        status: "pending",
                        message:
                            "Interrupted order processing recovered. Order returned to pending for another attempt.",
                        checkedAt: new Date()
                    }
                }
            }
        );

        if (recovered.modifiedCount > 0) {
            console.log(
                `Recovered ${recovered.modifiedCount} interrupted order(s).`
            );
        }

        while (true) {
            const now = new Date();

            // Atomically claim one due buy order.
            const order = await Order.findOneAndUpdate(
                {
                    type: "buy",
                    status: "pending",
                    nextProcessingAt: { $lte: now }
                },
                {
                    $set: {
                        status: "processing",
                        claimedAt: now,
                        lastProcessingAttempt: now
                    }
                },
                {
                    sort: { createdAt: 1 },
                    returnDocument: "after"
                }
            );

            if (!order) {
                console.log("No more orders are due.");
                break;
            }

            console.log(`Claimed order: ${order.reference}`);

            await Order.updateOne(
                {
                    _id: order._id,
                    status: "processing"
                },
                {
                    $push: {
                        processingHistory: {
                            status: "processing",
                            message: "Order processing started.",
                            checkedAt: new Date()
                        }
                    }
                }
            );

            try {
                // Run simulated wallet validation.
                const walletResult =
                    await deductWalletAndSendCoin(order._id);

                const message =
                    walletResult.message ||
                    "Buy order validation completed.";

                // Keep the order pending for another attempt.
                await Order.updateOne(
                    {
                        _id: order._id,
                        status: "processing"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextProcessingAt: new Date(
                                Date.now() + RETRY_INTERVAL
                            )
                        },
                        $inc: {
                            processingAttempts: 1
                        },
                        $push: {
                            processingHistory: {
                                status: "pending",
                                message,
                                checkedAt: new Date()
                            }
                        }
                    }
                );

                console.log(
                    `Order ${order.reference}: ${message}`
                );

            } catch (error) {
                console.error(
                    `Order ${order.reference} error:`,
                    error.message
                );

                await Order.updateOne(
                    {
                        _id: order._id,
                        status: "processing"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextProcessingAt: new Date(
                                Date.now() + RETRY_INTERVAL
                            )
                        },
                        $inc: {
                            processingAttempts: 1
                        },
                        $push: {
                            processingHistory: {
                                status: "error",
                                message: error.message,
                                checkedAt: new Date()
                            }
                        }
                    }
                );
            }
        }

    } catch (error) {
        console.error(
            "Order cron error:",
            error.message
        );
    } finally {
        isProcessingOrders = false;
    }
};

const orderCron = new CronJob(
    "* * * * *",
    processPendingOrders,
    null,
    false,
    "Africa/Lagos"
);

module.exports = orderCron;
