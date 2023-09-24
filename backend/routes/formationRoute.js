
const express = require("express");

const {
  registerStudentFormation,
  renevalStudentFormation,
  verificationFormationPayment,
  getFormations,
  getStudentFormation
} = require("../controllers/formationController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// path for static verified page
const path = require("path");

// Register Student
router.post("/register/student/formation", isAuthenticatedUser, registerStudentFormation);
// Reneva Student Formation
router.post("/reneval/student/formation", isAuthenticatedUser, renevalStudentFormation);
// Verification Formation Payment
router.post("/verification/formation/payment", verificationFormationPayment);
// Verification Formation Payment
router.get("/formation/list", isAuthenticatedUser, getFormations);
// Student Formation list
router.get("/student/formation/list", isAuthenticatedUser, getStudentFormation);

// verify email
router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/verifiedPayment.html"));
});

module.exports = router