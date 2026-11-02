const { Router } = require("express");
const { paymentVerification } = require("../controllers/paymentController");

const router = Router();
router.route("/verify").post(paymentVerification)
module.exports = router;