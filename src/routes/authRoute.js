const express = require("express");
const {
  register,
  login,
  updateUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  storecardData,
  getcardData,
  deleteCardData,
} = require("../controllers/authController");
const { isAuth, isAdmin } = require("../middleware/authMiddleware"); // Ensure auth middleware is used
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/storecardData", storecardData);
router.get("/getcardData", getcardData);
router.delete("/deleteCardData/:title", deleteCardData);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update", isAuth, isAdmin, updateUser);
router.put("/update-password", isAuth, updatePassword); //
module.exports = router;
