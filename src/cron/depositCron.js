
const { CronJob } = require("cron");
const Deposit = require("../models/depositModel");
const { verifyDeposit } = require("../services/depositVerification");

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

        const recovered = await Deposit.updateMany(
            {
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
                }
            }
        );

        if (recovered.modifiedCount > 0) {
            console.log(
                `Recovered ${recovered.modifiedCount} interrupted deposit(s).`
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
                    new: true
                }
            );

            if (!deposit) {
                console.log("No more deposits are due.");
                break;
            }

            console.log(`Claimed deposit: ${deposit._id}`);

            try {
                const verification = await verifyDeposit({
                    coin: deposit.coin,
                    network: deposit.network,
                    txId: deposit.txId,
                    amount: deposit.amount.toString(),
                    depositAddress: deposit.depositAddress
                });

                const message = verification?.message ||
                    "Verification provider is unavailable.";

                // Keep this workflow in simulation.
                // Never approve or deliver coins automatically.
                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "pending",
                            nextVerificationAt: new Date(
                                Date.now() + RETRY_INTERVAL
                            ),
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

                console.log(
                    `Deposit ${deposit._id}: ${message}`
                );

            } catch (error) {
                console.error(
                    `Deposit ${deposit._id} error:`,
                    error.message
                );

                await Deposit.updateOne(
                    {
                        _id: deposit._id,
                        status: "verifying"
                    },
                    {
                        $set: {
                            status: "pending",
                            nextVerificationAt: new Date(
                                Date.now() + RETRY_INTERVAL
                            ),
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
            }
        }

    } catch (error) {
        console.error("Deposit cron error:", error.message);
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
