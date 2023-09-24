const mongoose = require("mongoose");

const StudentInfosSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    numero: {
      type: String,
      required: true,
    },
    numero_rue: {
      type: String,
      required: false,
    },
    ville: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: false,
    },
    code_postal: {
      type: String,
      required: false,
    },
    cni: {
      type: String,
      required: false,
    },
    bulletin: {
      type: String,
      required: false,
    }, 
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentInfos", StudentInfosSchema);
