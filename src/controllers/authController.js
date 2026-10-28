const User = require("../models/userModel");
const { generateToken } = require("../utils/token");
const sendMail  = require("../utils/mailer");
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
                <p>This code expires in 30minutes.</p>
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

module.exports = {
    register,
    login,
    verifyEmail
}