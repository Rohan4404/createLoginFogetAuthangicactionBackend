// authController.js
const User = require("../models/userModel");

const UserCardData = require("../models/userCardData");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// 🔑 Generate JWT Reset Token
const generateResetToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
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

  const resetLink = `http://localhost:5174/reset-password/${resetToken}`;

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
    const { username, name, password, email } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user (without role)
    const newUser = await User.create({
      username,
      name,
      password: hashedPassword,
      email,
    });

    // Respond with success message and user data (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ error: "Error registering user", details: error.message });
  }
};

// 🔐 Login User
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ where: { email } });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ error: "Invalid password" });

//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role,
//         email: user.email,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.status(200).json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(500).json({ error: "Error logging in", details: error.message });
//   }
// };
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response with token and user id
    res.status(200).json({
      message: "Login successful",
      token,
      id: user.id, // Return the user ID in the response
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
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
    res
      .status(500)
      .json({ error: "Error updating user", details: error.message });
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
    if (!isMatch)
      return res.status(401).json({ error: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating password", details: error.message });
  }
};

// 📧 Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(404)
        .json({ error: "User with this email does not exist" });

    const resetToken = generateResetToken(user.id);
    await sendResetEmail(email, resetToken);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Error sending reset email", details: error.message });
  }
};

// 🔄 Reset Password

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user)
      return res.status(404).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Error resetting password", details: error.message });
  }
};

// store data of card value
const storecardData = async (req, res) => {
  try {
    const { userId, title, endPoint, lat, lon } = req.body;

    // Check for missing fields
    if (!userId || !title || !endPoint || !lat || !lon) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert data using Sequelize, including userId
    const newCard = await UserCardData.create({
      userId, // Store the userId along with other card details
      title,
      endPoint,
      lat,
      lon,
    });

    // Return success message without 'id' in the response
    res.status(201).json({
      message: "Data inserted successfully",
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// get card data api

const getcardData = async (req, res) => {
  try {
    // Fetch all user card data from the database
    const allCards = await UserCardData.findAll();

    // Check if data exists
    if (allCards.length === 0) {
      return res.status(404).json({ error: "No card data found" });
    }

    // Return the fetched data
    res.status(200).json({
      message: "Data retrieved successfully",
      data: allCards,
    });
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ error: "Database error" });
  }
};

//delete card data api

const deleteCardData = async (req, res) => {
  try {
    const { title } = req.params;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Find the card by title and delete it
    const deletedCard = await UserCardData.destroy({ where: { title } });

    if (!deletedCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.status(200).json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// update card data api

const updateCardData = async (req, res) => {
  try {
    const { title } = req.params; // Extract title from URL parameters
    const { endPoint, lat, lon } = req.body; // Extract new data from request body

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Find the card by title
    const card = await UserCardData.findOne({ where: { title } });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Update the card with new values
    await card.update({
      endPoint: endPoint || card.endPoint,
      lat: lat || card.lat,
      lon: lon || card.lon,
    });

    res.status(200).json({ message: "Card updated successfully" });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Database error" });
  }
};

module.exports = {
  register,
  login,
  updateUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  storecardData,
  getcardData,
  deleteCardData,
  updateCardData,
};
