const { Router } = require("express");
const { register, login, verifyEmail, resendVerificationCode, forgotPassword, verifyResetCode, resetPassword } = require("../controllers/authController");

const router = Router();

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/verify-email").post(verifyEmail)
router.route("/resend-verification-code").post(resendVerificationCode)
router.route("/forgot-password").post(forgotPassword)
router.route("/verify-reset-code").post(verifyResetCode)
router.route("/reset-password").post(resetPassword)

module.exports = router