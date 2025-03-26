// authController.js
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// 🔑 Generate JWT Reset Token
const generateResetToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// 📩 Send Reset Link via Email
const sendResetEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `http://localhost:4000/api/user/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: `"Password Reset" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
           <p>This link will expire in 15 minutes.</p>`,
  });
};

// 🔐 Register User
const register = async (req, res) => {
  try {
    const { username, name, password, role, email } = req.body;
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, name, password: hashedPassword, role, email });
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Error registering user", details: error.message });
  }
};

// 🔐 Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in", details: error.message });
  }
};

// 🔄 Update User
const updateUser = async (req, res) => {
  try {
    const { name, password, email } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
  
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
};

// 🔒 Update Password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating password", details: error.message });
  }
};

// 📧 Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User with this email does not exist" });

    const resetToken = generateResetToken(user.id);
    await sendResetEmail(email, resetToken);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error sending reset email", details: error.message });
  }
};

// 🔄 Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {

    console.log(error)
    res.status(500).json({ error: "Error resetting password", details: error.message });
  }
};

module.exports = { register, login, updateUser, updatePassword, forgotPassword, resetPassword };
