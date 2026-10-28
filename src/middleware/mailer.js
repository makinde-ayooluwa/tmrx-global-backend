
const path = require("path");
const nodemailer = require("nodemailer");

require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

console.log("Mailer user loaded:", Boolean(process.env.GMAIL_USER));
console.log(
  "Mailer password loaded:",
  Boolean(process.env.GMAIL_APP_PASSWORD)
);

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = mailer;
