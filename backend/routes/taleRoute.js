/** @format */

const express = require("express");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  createTale,
  getAdminTales,
  getTaleDetails,
  updateTale,
  deleteTale,
} = require("../controllers/taleController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Register User
router.post(
  "/admin/tale/new",
  upload.single("file"),
  isAuthenticatedUser,
  createTale
);

// Get All Users
router
  .route("/admin/tales")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminTales);

// Get Single User / Update Single User / Delete Single User
router
  .route("/admin/tale/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getTaleDetails)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateTale)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteTale);

module.exports = router;
