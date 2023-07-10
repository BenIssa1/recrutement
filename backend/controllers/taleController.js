/** @format */

const AWS = require("aws-sdk");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Tale = require("../models/taleModel");
require("dotenv").config({ path: "backend/config/config.env" });

let { ACCESSKEYID, SECRETACCESSKEY, BUCKET } = process.env;

const s3Client = new AWS.S3({
  accessKeyId: ACCESSKEYID,
  secretAccessKey: SECRETACCESSKEY,
});

const uploadParams = {
  Bucket: BUCKET,
  Key: "", // pass key
  Body: null, // pass file body
  acl: "public-read ",
};

// Create a Tale
exports.createTale = catchAsyncErrors(async (req, res, next) => {
  const params = uploadParams;

  uploadParams.Key = req.file.originalname;
  uploadParams.Body = req.file.buffer;

  s3Client.upload(params, async (err, data) => {
    if (err) {
      return next(new ErrorHander(err));
    }

    req.body.user = req.user.id;
    req.body.videoUrl = data.Location;
    req.body.questions = JSON.parse(req.body.questions);
    const tale = await Tale.create(req.body);

    res.status(201).json({
      success: true,
      tale,
    });
  });
});

// Get All Tale Admin(tale)
exports.getAdminTales = catchAsyncErrors(async (req, res, next) => {
  const tales = await Tale.find();

  res.status(200).json({
    success: true,
    tales,
  });
});

// Get Tale Details
exports.getTaleDetails = catchAsyncErrors(async (req, res, next) => {
  const tale = await Tale.findById(req.params.id);

  if (!tale) {
    return next(new ErrorHander("Tale not found", 404));
  }

  res.status(200).json({
    success: true,
    tale,
  });
});

// Update Product -- Admin(tale)

exports.updateTale = catchAsyncErrors(async (req, res, next) => {
  let tale = await Tale.findById(req.params.id);

  if (!tale) {
    return next(new ErrorHander("Tale not found", 404));
  }

  tale = await Tale.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    tale,
  });
});

// Delete Tale

exports.deleteTale = catchAsyncErrors(async (req, res, next) => {
  const tale = await Tale.findById(req.params.id);

  if (!tale) {
    return next(new ErrorHander("Tale not found", 404));
  }

  await tale.remove();

  res.status(200).json({
    success: true,
    message: "Tale Delete Successfully",
  });
});
