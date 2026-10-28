const mailer = require("../middleware/mailer")

const sendMail = async (to, message) => {
    return await mailer.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject: "TMRX Global - Email Verification",
        html: message
    });
};

module.exports = sendMail;
