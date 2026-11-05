
const { CronJob } = require("cron");
const Deposit = require("../models/depositModel");
const Order = require("../models/orderModel");
const { verifyDeposit } = require("../services/depositVerification");
const { verifyCoinAndCreditWallet } = require("../services/walletOrderService")
let isProcessingDeposits = false;

const RETRY_INTERVAL = 5 * 60 * 1000;
const LOCK_TIMEOUT = 2 * 60 * 1000;

const processPendingDeposits = async () => {
    if (isProcessingDeposits) {
        console.log("Previous deposit cron is still running.");
        return;
    }

    isProcessingDeposits = true;

    try {
        console.log("Checking pending deposits...");

        const staleTime = new Date(
            Date.now() - LOCK_TIMEOUT
        );

        // Recover deposits whose verification was interrupted.
        // Recover deposits whose verification was interrupted.
        const staleDeposits = await Deposit.find({
            status: "verifying",
            claimedAt: { $lte: staleTime }
        });

        for (const deposit of staleDeposits) {
            const recoveryResult = await Deposit.updateOne(
                {
                    _id: deposit._id,
                    status: "verifying",
                    claimedAt: { $lte: staleTime }
                },
                {
                    $set: {
                        status: "pending",
                        claimedAt: null,
                        nextVerificationAt: new Date(),
                        verificationMessage:
                            "Previous verification was interrupted. Retrying."
                    },
                    $push: {
                        verificationHistory: {
                            status: "recovered",
                            message:
                                "Interrupted verification recovered. Deposit returned to pending.",
                            checkedAt: new Date()
                        }
                    }
                }
            );

            // Reset the order only if the deposit was successfully recovered.
            if (recoveryResult.modifiedCount > 0) {
                await Order.updateOne(
                    {
                        _id: deposit.order,
                        type: "sell",
                        status: "processing"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextProcessingAt: new Date()
                        }
                    }
                );
            }
        }

        if (staleDeposits.length > 0) {
            console.log(
                `Recovered ${staleDeposits.length} interrupted deposit(s) and their sell orders.`
            );
        }

        while (true) {
            const now = new Date();

            // Atomically claim one due deposit.
            const deposit = await Deposit.findOneAndUpdate(
                {
                    status: "pending",
                    nextVerificationAt: { $lte: now }
                },
                {
                    $set: {
                        status: "verifying",
                        lastVerificationAttempt: now,
                        claimedAt: now
                    }
                },
                {
                    sort: { createdAt: 1 },
                    returnDocument: "after"
                }
            );

            if (!deposit) {
                console.log("No more deposits are due.");
                break;
            }
            await Deposit.updateOne(
                {
                    _id: deposit._id,
                    status: "verifying"
                },
                {
                    $push: {
                        verificationHistory: {
                            status: "verifying",
                            message: "Deposit verification started.",
                            checkedAt: new Date()
                        }
                    }
                }
            );
            console.log(`Claimed deposit: ${deposit._id}`);

            // Find the associated sell order.
            const order = await Order.findOne({
                _id: deposit.order,
                type: "sell"
            });

            if (!order) {
                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "rejected",
                            claimedAt: null,
                            verificationMessage:
                                "Associated sell order not found."
                        }
                    }
                );

                console.log(
                    `Deposit ${deposit._id}: associated sell order not found.`
                );

                continue;
            }

            // Mark the sell order as processing.
            const claimedOrder = await Order.updateOne(
                {
                    _id: order._id,
                    type: "sell",
                    status: "pending"
                },
                {
                    $set: {
                        status: "processing",
                        claimedAt: new Date()
                    }
                }
            );

            if (claimedOrder.modifiedCount === 0) {
                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextVerificationAt: new Date(
                                Date.now() + RETRY_INTERVAL
                            ),
                            verificationMessage:
                                "Sell order is not available for processing."
                        }
                    }
                );

                console.log(
                    `Deposit ${deposit._id}: sell order was not pending.`
                );

                continue;
            }
            await Order.updateOne(
                {
                    _id: order._id,
                    type: "sell",
                    status: "processing"
                },
                {
                    $push: {
                        processingHistory: {
                            status: "processing",
                            message: "Sell order processing started. Deposit verification is pending.",
                            checkedAt: new Date()
                        }
                    }
                }
            );
            try {
                const verification = await verifyDeposit({
                    coin: deposit.coin,
                    network: deposit.network,
                    txId: deposit.txId,
                    amount: deposit.amount.toString(),
                    depositAddress: deposit.depositAddress
                });

                const walletResult = await verifyCoinAndCreditWallet(
    deposit._id
);

const message = walletResult.message;
                const nextVerificationAt = new Date(
                    Date.now() + RETRY_INTERVAL
                );

                // Keep this workflow in simulation.
                // Never approve deposits or deliver coins automatically.
                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextVerificationAt,
                            verificationMessage: message
                        },
                        $inc: {
                            verificationAttempts: 1
                        },
                        $push: {
                            verificationHistory: {
                                status: "pending",
                                message,
                                checkedAt: new Date()
                            }
                        }
                    }
                );

                // Return the sell order to pending for another attempt.
                await Order.updateOne(
                    {
                        _id: order._id,
                        type: "sell",
                        status: "processing"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextProcessingAt: nextVerificationAt
                        }
                    }
                );

                console.log(
                    `Deposit ${deposit._id}: ${message}`
                );

            } catch (error) {
                console.error(
                    `Deposit ${deposit._id} error:`,
                    error.message
                );

                const nextVerificationAt = new Date(
                    Date.now() + RETRY_INTERVAL
                );

                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextVerificationAt,
                            verificationMessage: error.message
                        },
                        $inc: {
                            verificationAttempts: 1
                        },
                        $push: {
                            verificationHistory: {
                                status: "error",
                                message: error.message,
                                checkedAt: new Date()
                            }
                        }
                    }
                );

                // Also reset the associated sell order after an error.
                await Order.updateOne(
                    {
                        _id: order._id,
                        type: "sell",
                        status: "processing"
                    },
                    {
                        $set: {
                            status: "pending",
                            claimedAt: null,
                            nextProcessingAt: nextVerificationAt
                        }
                    }
                );
            }
        }

    } catch (error) {
        console.error(
            "Deposit cron error:",
            error.message
        );
    } finally {
        isProcessingDeposits = false;
    }
};

const depositCron = new CronJob(
    "* * * * *",
    processPendingDeposits,
    null,
    false,
    "Africa/Lagos"
);

module.exports = depositCron;
