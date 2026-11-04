
const { CronJob } = require("cron");
const Order = require("../models/orderModel");

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
                status: "processing",
                claimedAt: { $lte: staleTime }
            },
            {
                $set: {
                    status: "pending",
                    claimedAt: null,
                    nextProcessingAt: new Date()
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

            // Atomically claim one due order.
            const order = await Order.findOneAndUpdate(
                {
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
                    new: true
                }
            );

            if (!order) {
                console.log("No more orders are due.");
                break;
            }

            console.log(`Claimed order: ${order.reference}`);

            try {
                const message =
                    "Order is awaiting independent processing confirmation.";

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
        console.error("Order cron error:", error.message);
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
