const { Router } = require("express");
const { register } = require("../controllers/authController");

const router = Router();

router.route("/register").post(register)

module.exports = router