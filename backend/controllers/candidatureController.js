const Candidature = require("../models/candidatureModel");

// Fonction pour créer une candidature
exports.createCandidature = async (req, res) => {
  try {
    const candidature = new Candidature({
      nom: req.body.nom,
      prenom: req.body.prenom,
      email: req.body.email,
      cv: req.body.cv,
      lettreMotivation: req.body.lettreMotivation,
      carteIdentite: req.body.carteIdentite,
      jobOfferId: req.body.jobOfferId,
      telephone: req.body.telephone
    });
    const savedCandidature = await candidature.save();
    res.status(201).json(savedCandidature);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Fonction pour récupérer toutes les candidatures
exports.getAllCandidatures = async (req, res) => {
  try {
    const candidatures = await Candidature.find();
    res.json(candidatures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fonction pour récupérer une candidature par son ID
exports.getCandidatureById = async (req, res) => {
  try {
    const candidature = await Candidature.findById(req.params.id);
    if (!candidature) {
      return res.status(404).json({ message: "Candidature introuvable" });
    }
    res.json(candidature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fonction pour mettre à jour une candidature
exports.updateCandidature = async (req, res) => {
  try {
    const candidature = await Candidature.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!candidature) {
      return res.status(404).json({ message: "Candidature introuvable" });
    }
    res.json(candidature);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Fonction pour supprimer une candidature
exports.deleteCandidature = async (req, res) => {
  try {
    const candidature = await Candidature.findByIdAndDelete(req.params.id);
    if (!candidature) {
      return res.status(404).json({ message: "Candidature introuvable" });
    }
    res.json({ message: "Candidature supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
