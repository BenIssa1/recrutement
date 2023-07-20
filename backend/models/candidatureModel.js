const mongoose = require("mongoose");

const candidatureSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
      },
      prenom: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      cv: {
        type: String,
        required: true
      },
      lettreMotivation: {
        type: String,
        required: true
      },
      carteIdentite: {
        type: String,
        required: true
      },
      jobOfferId: {
        type: mongoose.Schema.Types.ObjectId,
       /*  ref: "JobOffer", */
        ref: "User",
        required: true
      },
      status: {
        type: String,
        enum: ["en attente", "acceptée", "rejetée"],
        default: "en attente"
      },
      telephone: {
        type: String,
        required: true
      }
}, { timestamps: true });

module.exports = mongoose.model("Candidature", candidatureSchema);