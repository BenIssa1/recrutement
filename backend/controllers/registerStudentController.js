const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");

// Register a student
exports.registerStudent = catchAsyncErrors(async (req, res, next) => {
    console.log(req.files.cni[0].fieldname)
    res.status(200).json({
        success: true
    });
});