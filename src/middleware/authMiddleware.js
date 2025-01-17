const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Middleware to check if the user is authenticated
const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    console.log(`Token: ${token}`);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { username: decoded.username } });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user info to the request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid Token" });
  }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
};

module.exports = {
  isAuth,
  isAdmin,
};
