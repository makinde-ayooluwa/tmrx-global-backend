const express = require("express");
const router = express.Router();

const {
    testBybitConnection,
    getSupportedNetworks
} = require("../controllers/bybitController");

router.get("/test", testBybitConnection);
router.get("/networks", getSupportedNetworks);

module.exports = router;