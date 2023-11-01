/** @format */

const express = require("express");

const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUser,
  getAllConteur,
  getSingleUser,
  updateUserRole,
  deleteUser,
  getStudentDetails,
  updateProfileStudent
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('backend', 'public', 'images'));

  },
  filename: function (req, file, cb) {
    cb(null, req.body.email + '_' + file.fieldname + '_' + file.originalname)
  }
})

const upload = multer({
  storage: storage, fileFilter: function (req, file, cb) {
    /* filename */
    const fieldName = req.body.email + '_' + file.fieldname + '_' + file.originalname
    /* file chemin */
    const filePath = path.resolve('backend', 'public', 'images', fieldName)
    /* Verify file exist */
    let fileExist = fs.existsSync(filePath)

    if (fileExist) {
      req.body.erroFi = 'Error file exist'
      return cb(null, false, new Error('Error file exist'))
    }

    cb(null, true)
  }
})

// Get file upload
router.route("/image/:fileName").get((req, res) => {
  console.log(path.resolve('backend', 'public', 'images'))
  res.sendFile(path.resolve('backend', 'public', 'images', req.params.fileName));
})

// Register User
router.post("/register", upload.fields([
  { name: 'cni' },
  { name: 'bulletin' },
]), registerUser);
// LOgin User
router.route("/login").post(loginUser);
// Logout User
router.route("/logout").get(logout);
// Forgot Password
router.route("/password/forgot").post(forgotPassword);
// Reset Password
router.route("/password/reset/:token").put(resetPassword);
// User credentials
router.route("/me").get(isAuthenticatedUser, getUserDetails);
// Upadate / Change Password
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
// Update / User Profile
router.route("/me/update").put(isAuthenticatedUser, updateProfile);
// Get All Users
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser);
router
  .route("/admin/conteurs")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllConteur);
// Get Single User / Update Single User / Delete Single User
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

// Get details student info
router
  .route("/student/details")
  .get(isAuthenticatedUser, getStudentDetails)

// Upadate Student Info
router.route("/student/update").put(isAuthenticatedUser, updateProfileStudent);

module.exports = router;
