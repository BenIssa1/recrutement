const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Formation = require("../models/FormationModel");
const StudentInfos = require("../models/StudentInfosModel");
const ApiFeatures = require("../utils/apifeatures");
const Axios = require('axios');
const openurl = require('openurl');

// Register a student
exports.registerStudentFormation = catchAsyncErrors(async (req, res, next) => {
    /* body data */
    const { 
        formation, 
        type_formation, 
        montant, 
        montantAPaye, 
        montantPaye, 
        nombreEcheance, 
        nombreEcheancePaye 
    } = req.body;

    /* Get Student Info */
    const studentInfo = await StudentInfos.findOne({user: req.user.id}).populate('user');
    /* Get Formation */
    const formationExist = await Formation.findOne({user: req.user.id, formation});

    /* Verifie si l'etudiant est deja inscrite a la formation */
    if (formationExist && formationExist.montantPaye != 0) {
        return next(new ErrorHander("Tu es deja inscris a la formation", 400));
    } 
    /* Verifie si l'etudiant est deja inscrite a la formation mais n'a pas encore paye */
    else if (formationExist && formationExist.montantPaye == 0) {
        /* Call paymentFunction */
        paymentFunction(montantAPaye, studentInfo, formation, res)
    } 
    /* Verifie si l'etudiant n'est deja inscrite a la formation */
    else {
        /* Create formation */
        const formationCreate = await Formation.create({
            formation,
            type_formation,
            montant,
            montantPaye,
            nombreEcheance,
            nombreEcheancePaye,
            user: studentInfo.user._id,
            studentInfo: studentInfo._id
        });
    
        /* Verifie si la formation est bien cree */
         if (formationCreate) {
            /* Call paymentFunction */
            paymentFunction(montantAPaye, studentInfo, formation, res)
        } 
    }

    
});

// Register a student
exports.renevalStudentFormation = catchAsyncErrors(async (req, res, next) => {
    const { 
        formation, 
        montant,  
    } = req.body;

    const studentInfo = await StudentInfos.findOne({user: req.user.id}).populate('user');

    paymentFunction(montant, studentInfo, formation, res)
});

// Verification Paiement
exports.verificationFormationPayment = catchAsyncErrors(async (req, res, next) => {
    /* data body */
    let data = JSON.stringify({
      "apikey": "859867072650304c5f00440.22075151",
      "site_id": "821343",
      "transaction_id": req.body.transaction_id
    });
    
    /* config data */
    let config = {
      method: 'post',
      url: 'https://api-checkout.cinetpay.com/v2/payment/check',
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };

    Axios(config)
    .then(async function (response) {

      if (response.data.code == "00") {
        /* Parse MetaData */
        console.log(response.data.data.metadata)
        let metadataData = JSON.parse(response.data.data.metadata);
        /* Get formation */
        const formation = await Formation.findOne({formation: metadataData.formation, user: metadataData.user});
        
        /* Verifie si la formation existe */
        if (!formation) {
            let message = "Formation et l'utilisateur n'existe pas !";
            res.redirect(
            `/api/v1/verified?error=true&message=${message}`
            );
        } else {
            /* Get formation */
            const operatorId = await Formation.findOne({operator_id: response.data.data.operator_id});
        
            /* Verifie si l'operatorId existe */
            if (operatorId) {
                let message = "Paiement deja verifie !";
                res.redirect(
                `/api/v1/verified?error=false&message=${message}`
                );

            } else {
                /* Update formation */
                formation.montantPaye =  formation.montantPaye + parseInt(response.data.data.amount)
                formation.nombreEcheancePaye =  formation.nombreEcheancePaye + 1
                formation.operator_id =  response.data.data.operator_id 
                await formation.save()

                let message = "Paiement a reussi !";
                res.redirect(
                `/api/v1/verified?error=false&message=${message}`
                );
            }

        }

        
      } else {
        let message = "Erreur de verification !";
        res.redirect(
        `/api/v1/verified?error=true&message=${message}`
        );
      }

    })
    .catch(function (error) {
      console.log(error);
      res.status(200).json({  
        success: false,
        message: 'Error transaction'
    });
    }); 
});

// Get Formation Admin
exports.getFormations = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 8;

    const apiFeature = new ApiFeatures(
        Formation.find().populate("user"),
        req.query
    )
        .search()
        .filter()
        .pagination(resultPerPage);

    const formations = await apiFeature.query;

    res.status(200).json({
        success: true,
        formations
    });
});

// Get all formations(student)
exports.getStudentFormation = catchAsyncErrors(async (req, res, next) => {
    const formations = await Formation.find({ user: req.user.id }).populate('studentInfo');
  
    res.status(200).json({
      success: true,
      formations,
    });
  });

/* Paymet */
const paymentFunction = (montantAPaye, studentInfo, formation, res) => {
    /* Informations du cinetpay */
    let data = JSON.stringify({
        "apikey": "859867072650304c5f00440.22075151",
        "site_id": "821343",
        "transaction_id":  Math.floor(Math.random() * 100000000).toString(), //
        "amount": montantAPaye, 
        "currency": "XOF",
        "alternative_currency": "",
        "description": "Inscription a une formation",
        "customer_id": studentInfo.user._id,
        "customer_name": studentInfo.user.name,
        "customer_surname": studentInfo.prenom,
        "customer_email": studentInfo.user.email,
        "customer_phone_number": studentInfo.numero,
        "customer_address": studentInfo.ville,
        "customer_city": studentInfo.ville,
        "customer_country": "CM",
        "customer_state": "CM",
        "customer_zip_code": "065100",
        "notify_url": "http://localhost:5000/api/v1/verification/formation/payment",
        "return_url": "http://localhost:5000/api/v1/verification/formation/payment",
        "channels": "ALL",
        "metadata": JSON.stringify({formation, user: studentInfo.user._id}),
        "lang": "FR",
        "invoice_data": {
          "Reste à payer":"25 000fr",
          "Matricule":"24OPO25",
          "Annee-scolaire":"2020-2021"
        }
    });

    /* config data */
    let config = {
        method: 'post',
        url: 'https://api-checkout.cinetpay.com/v2/payment',
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data 
      };
  
    /* call api cinetpay payment */
    Axios(config)
    .then(async function (response) {
        console.log((response.data));

        /* Response data */
        res.status(200).json({
            success: true,
            message: 'Message' 
        }); 

        /* Ouvre la page de paiement */
        openurl.open(response.data.data.payment_url)
    })
    .catch(function (error) {
        console.log(error);
    });
}