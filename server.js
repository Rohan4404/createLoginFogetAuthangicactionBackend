const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoute = require("./src/routes/authRoute");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.use("/api/user", authRoute);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.APP_PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
