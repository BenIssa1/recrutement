/** @format */

const cors = require("cors");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middleware/error");

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
/* app.use(express.static(__dirname));verification/formation/payment */

app.use(cors({
    origin: '*'
}))

// Route Imports 
const user = require("./routes/userRoute");
const registerStudent = require("./routes/registerStudentRoute");
const formation = require("./routes/formationRoute");

app.use("/api/v1", user);
app.use("/api/v1", registerStudent);
app.use("/api/v1", formation);

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
