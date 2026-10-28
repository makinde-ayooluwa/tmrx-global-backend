const { Router } = require("express");
const { getUser } = require("../controllers/userController");

const router = Router();
router.route("/getUser").post(getUser)
module.exports = router;