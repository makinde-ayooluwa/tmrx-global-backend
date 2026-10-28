
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    fullname: String,

    email: {
        type: String,
        unique: true
    },

    phone: {
        type: String,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    email_verified: {
        type: Boolean,
        default: false
    }
});

// Hash the password before saving a new or modified password.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("users", userSchema);

module.exports = User;
