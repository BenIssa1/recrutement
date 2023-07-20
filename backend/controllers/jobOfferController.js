const JobOffer = require("../models/jobOfferModel");

// Fonction pour créer une nouvelle offre d'emploi
exports.createJobOffer = async (req, res) => {
  try {
    const jobOffer = new JobOffer(req.body);
    await jobOffer.save();
    res.status(201).json(jobOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fonction pour récupérer toutes les offres d'emploi
exports.getAllJobOffers = async (req, res) => {
  try {
    const jobOffers = await JobOffer.find();
    res.json(jobOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour récupérer une offre d'emploi spécifique
exports.getJobOfferById = async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    if (!jobOffer) {
      return res.status(404).json({ message: "Offre d'emploi introuvable" });
    }
    res.json(jobOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour mettre à jour une offre d'emploi existante
exports.updateJobOffer = async (req, res) => {
  try {
    const jobOffer = await JobOffer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!jobOffer) {
      return res.status(404).json({ message: "Offre d'emploi introuvable" });
    }
    res.json(jobOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fonction pour supprimer une offre d'emploi existante
exports.deleteJobOffer = async (req, res) => {
  try {
    const jobOffer = await JobOffer.findByIdAndDelete(req.params.id);
    if (!jobOffer) {
      return res.status(404).json({ message: "Offre d'emploi introuvable" });
    }
    res.json({ message: "Offre d'emploi supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
