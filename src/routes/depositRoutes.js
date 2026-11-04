const express = require("express");
const router = express.Router();

const {
    createDeposit,
    getDepositHistory
} = require("../controllers/depositController");

const {
    authMiddleware
} = require("../middleware/authMiddleware");

// Submit a deposit
router.post("/create", authMiddleware, createDeposit);

// Get logged-in user's deposit history
router.get("/history", authMiddleware, getDepositHistory);

module.exports = router;