/** @format */

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middleware/error");

app.use(express.json());
app.use(cookieParser());

// Route Imports d
const user = require("./routes/userRoute");
const candidate = require("./routes/candidatureRoute");
const jobs = require("./routes/jobOfferRoute");

app.use("/api/v1", user);
app.use("/api/v1", candidate);
app.use("/api/v1", jobs);

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
