const mongoose = require("mongoose");

const FormationSchema = new mongoose.Schema(
  {
    formation: {
        type: String,
        enum: [
            "Superviseur_QHSE", 
            "Responsable_QHSE", 
            "BNS_&_SI", 
            "Logiciel_Robot", 
            "Production_Pétrolière", 
            "Reservoir_Pétrolier"
        ],
        required: true,
    },
    type_formation: {
        type: String,
        enum: ["En_Ligne", "En_Présentiel", ],
        required: true,
    },
    montant: {
        type: Number,
        required: true,
    },
    montantPaye: {
        type: Number,
        required: false,
        default: 0
    },
    montantAPayeParEcheance: {
        type: Number,
        required: true,
        default: 0
    },
    nombreEcheance: {
        type: Number,
        required: true,
    },
    nombreEcheancePaye: {
        type: Number,
        required: false,
        default: 0
    },
    operator_id: {
        type: String,
        required: false,
        default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },  
    studentInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentInfos",
      required: true
    },  
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Formation", FormationSchema);
