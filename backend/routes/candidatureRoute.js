const express = require("express");
const router = express.Router();
const candidatureController = require("../controllers/candidatureController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

// Route pour créer une candidature
router.post(
  "/candidatures",
  isAuthenticatedUser,
  authorizeRoles("candidate"),
  candidatureController.createCandidature
);

// Route pour récupérer toutes les candidatures
router.get(
  "/candidatures",
  isAuthenticatedUser,
   authorizeRoles("candidate"),
  candidatureController.getAllCandidatures
);

// Route pour récupérer une candidature par son ID
router.get(
  "/candidatures/:id",
  isAuthenticatedUser,
   authorizeRoles("candidate"),
  candidatureController.getCandidatureById
);

// Route pour mettre à jour une candidature
router.put(
  "/candidatures/:id",
  isAuthenticatedUser,
  authorizeRoles("candidate"),
  candidatureController.updateCandidature
);

// Route pour supprimer une candidature
router.delete(
  "/candidatures/:id",
  isAuthenticatedUser,
   authorizeRoles("candidate"),
  candidatureController.deleteCandidature
);

module.exports = router;
