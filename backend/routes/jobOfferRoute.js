const express = require("express");
const router = express.Router();
const jobOfferController = require("../controllers/jobOfferController");
// const authMiddleware = require("../middlewares/authMiddleware");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

// Route pour créer une nouvelle offre d'emploi (accessible uniquement aux recruteurs authentifiés)
router.post("/jobs", isAuthenticatedUser, authorizeRoles("recruteur"), jobOfferController.createJobOffer);

// Route pour récupérer toutes les offres d'emploi
router.get("/jobs", jobOfferController.getAllJobOffers);

// Route pour récupérer une offre d'emploi spécifique
router.get("/jobs/:id", jobOfferController.getJobOfferById);

// Route pour mettre à jour une offre d'emploi existante (accessible uniquement aux recruteurs authentifiés)
router.put("/jobs/:id", isAuthenticatedUser, authorizeRoles("recruteur"), jobOfferController.updateJobOffer);

// Route pour supprimer une offre d'emploi existante (accessible uniquement aux recruteurs authentifiés)
router.delete("/jobs/:id", isAuthenticatedUser, authorizeRoles("recruteur"), jobOfferController.deleteJobOffer);
// router.delete("/:id", authMiddleware, jobOfferController.deleteJobOffer);


module.exports = router;
