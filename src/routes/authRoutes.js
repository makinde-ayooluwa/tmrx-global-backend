const { Router } = require("express");
const { register, login, verifyEmail } = require("../controllers/authController");

const router = Router();

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/verify-email").post(verifyEmail)

module.exports = router