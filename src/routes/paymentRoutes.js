const { Router } = require("express");
const { paymentVerification, getPaymentHistory } = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();
router.post("/verify", authMiddleware,paymentVerification)
router.get("/history", authMiddleware, getPaymentHistory);
module.exports = router;