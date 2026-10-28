const User = require("../models/userModel");
const { generateToken } = require("../utils/token");
const sendMail = require("../utils/mailer");
const Token = require("../models/tokenModel");
const register = async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        if (
            !fullname?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            !password
        ) {
            return res.status(400).json({
                status: false,
                message: "Please provide fullname, email, phone, and password."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.trim();

        // Check whether the email or phone is already registered.
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phone: normalizedPhone }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                status: false,
                message: "An account with this email or phone number already exists. Please log in or verify your account."
            });
        }

        // Create the account. The pre-save hook hashes the password.
        const user = await User.create({
            fullname: fullname.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            password
        });

        // Create and send the verification code.
        try {
            const token = await generateToken(user.email);

            const message = `
                <h2>Email Verification</h2>
                <p>Hi ${user.fullname},</p>
                <p>Use the verification code below to verify your email address:</p>
                <h1 style="letter-spacing: 8px;">${token.token}</h1>
                <p>This code expires in 5 minutes.</p>
                <p>If you did not create this account, you can ignore this email.</p>
            `;

            await sendMail(user.email, message);

            return res.status(201).json({
                status: true,
                message: "Account created successfully. Check your email for the verification code.",
                _id: user._id
            });
        } catch (emailError) {
            console.error("Verification email error:", emailError);

            // The account exists, so don't report that registration failed.
            return res.status(201).json({
                status: true,
                emailSent: false,
                message: "Your account was created, but we couldn't send the verification email. Please request a new verification code.",
                _id: user._id
            });
        }

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                status: false,
                message: "An account with this email or phone number already exists."
            });
        }

        return res.status(500).json({
            status: false,
            message: "Unable to create your account. Please try again."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const exists = await User.findOne({ email });
        if (!exists) {
            return res.status(500).json({
                status: false,
                message: "Login failed"
            })
        }
        const isMatch = await exists.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: false,
                message: "Invalid email or password"
            });
        }
        return res.status(200).json({
            status: true,
            message: "Login successful",
            _id: exists._id
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        })

    }
}
const verifyEmail = async (req, res) => {
    try {
        const { code, email } = req.body;

        // 1. Validate the request body
        if (!code || !email) {
            return res.status(400).json({
                status: false,
                message: "Email and verification code are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = String(code).trim();

        // 2. Find the user
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "Account not found.",
            });
        }

        // 3. Check whether the email is already verified
        if (user.email_verified) {
            return res.status(400).json({
                status: false,
                message: "This email has already been verified.",
            });
        }

        // 4. Find the verification code
        const token = await Token.findOne({ token: normalizedCode, user: normalizedEmail });

        if (!token) {
            return res.status(400).json({
                status: false,
                message: "Invalid or expired verification code.",
            });
        }

        // 5. Check that the code belongs to this email
        if (token.user !== normalizedEmail) {
            return res.status(400).json({
                status: false,
                message: "Invalid or expired verification code.",
            });
        }

        // 6. Check expiry explicitly (1000 seconds)
        // const expiresInMs = 1000 * 1000;
        // const age = Date.now() - token.createdAt.getTime();

        // if (age >= expiresInMs) {
        //   await Token.deleteOne({ _id: token._id });

        //   return res.status(400).json({
        //     status: false,
        //     message: "Verification code has expired. Please request a new one.",
        //   });
        // }

        // 7. Verify the email
        user.email_verified = true;
        await user.save();

        // 8. Delete the used code
        await Token.deleteOne({ _id: token._id });

        return res.status(200).json({
            status: true,
            message: "Email verified successfully.",
        });
    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to verify your email. Please try again.",
        });
    }
};
const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Email is required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        let token = await Token.findOne({
            email: normalizedEmail
        });

        // Generate a token if one does not exist
        if (!token) {
            token = await generateToken(normalizedEmail);

            if (!token) {
                return res.status(500).json({
                    status: false,
                    message: "Unable to generate verification code."
                });
            }
        }

        const message = `
            <h2>Email Verification</h2>
            <p>Use the verification code below to verify your email address:</p>
            <h1 style="letter-spacing: 8px;">${token.token}</h1>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not request this code, you can ignore this email.</p>
        `;

        // Wait for the email operation if sendMail returns a Promise
        await sendMail(normalizedEmail, message);

        return res.status(200).json({
            status: true,
            message: "Verification code sent successfully."
        });

    } catch (error) {
        console.error("Resend verification code error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to send verification code."
        });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Email is required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        // Use a generic response to avoid revealing registered emails
        if (!user) {
            return res.status(200).json({
                status: true,
                message: "If an account exists with that email, a reset code will be sent."
            });
        }

        const token = await generateToken(normalizedEmail,"password-reset");

        if (!token) {
            return res.status(500).json({
                status: false,
                message: "Unable to generate reset code."
            });
        }

        const message = `
            <h2>Password Reset</h2>
            <p>We received a request to reset your password.</p>
            <p>Use the code below to continue:</p>
            <h1 style="letter-spacing: 8px;">${token.token}</h1>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not request a password reset, you can ignore this email.</p>
        `;

        await sendMail(normalizedEmail, message);

        return res.status(200).json({
            status: true,
            message: "If an account exists with that email, a reset code will be sent."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to process password reset request."
        });
    }
};
const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                status: false,
                message: "Email and verification code are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const token = await Token.findOne({
            user: normalizedEmail,
            token: String(code),
            purpose: "password-reset"
        });

        if (!token) {
            return res.status(400).json({
                status: false,
                message: "Invalid or expired reset code."
            });
        }

        // Check expiry explicitly; TTL deletion is asynchronous.
        const tokenAge = Date.now() - new Date(token.createdAt).getTime();
        const expirationTime = 30 * 60 * 1000;

        if (tokenAge > expirationTime) {
            await Token.deleteOne({ _id: token._id });

            return res.status(400).json({
                status: false,
                message: "Reset code has expired. Please request another."
            });
        }

        return res.status(200).json({
            status: true,
            message: "Reset code verified successfully.",
            resetToken: token.token
        });

    } catch (error) {
        console.error("Verify reset code error:", error);

        return res.status(500).json({
            status: false,
            message: "Unable to verify reset code."
        });
    }
};
const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: 'Email and new password are required'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                status: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }

        user.password = password;
        await user.save();

        return res.status(200).json({
            status: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: false,
            message: 'Failed to reset password'
        });
    }
};
module.exports = {
    register,
    login,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    verifyResetCode,
    resetPassword
}