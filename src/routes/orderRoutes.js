
const express = require("express");
const router = express.Router();

const { createOrder, getOrderHistory } = require("../controllers/orderController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createOrder);
router.get("/history", authMiddleware, getOrderHistory);
module.exports = router;
