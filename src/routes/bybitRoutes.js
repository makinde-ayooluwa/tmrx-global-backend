const express = require("express");
const router = express.Router();

const {
    testBybitConnection
} = require("../controllers/bybitController");

router.get("/test", testBybitConnection);

module.exports = router;