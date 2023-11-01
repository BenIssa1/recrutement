/** @format */

const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const StudentInfos = require("../models/StudentInfosModel");
const sendToken = require("../utils/jwtTokens");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Formation = require("../models/FormationModel");
const Axios = require('axios');
const openurl = require('openurl');

// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  /* User data from body */
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
    avatar: {
      public_id: "this sample id",
      url: "profileurl",
    },
  });

  if (user) {
    /* Student Infos data from body */
    const { prenom, numero, numero_rue, ville, region, code_postal,
      formation,
      type_formation,
      montant,
      montantAPaye,
      montantPaye,
      nombreEcheance,
      nombreEcheancePaye
    } = req.body;

    const studentInfo = await StudentInfos.create({
      nom: name,
      prenom,
      numero,
      numero_rue,
      ville,
      region,
      code_postal,
      cni: req.files.cni[0].filename,
      bulletin: req.files.bulletin[0].filename,
      user: user._id
    });

    if (studentInfo) {

      /* Get Formation */
      const formationExist = await Formation.findOne({ user: user._id, formation });

      /* Verifie si l'etudiant est deja inscrite a la formation */
      if (formationExist && formationExist.montantPaye != 0) {
        return next(new ErrorHander("Tu es déjà inscrit à la formation.", 400));
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
          montantAPayeParEcheance: montantAPaye,
          user: user._id,
          studentInfo: studentInfo._id
        });

        /* Verifie si la formation est bien cree */
        if (formationCreate) {
          /* Call paymentFunction */
          paymentFunction(montantAPaye, studentInfo, formation, res)
        }
      }
    } else {
      return next(new ErrorHander("L'erreur s'est produite lors de la création des sauvegardes des informations de l'utilisateur.", 400));
    }

  } else {
    return next(new ErrorHander("L'erreur s'est produite lors de la création de l'utilisateur.", 400));
  }


});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Veuillez entrer votre e-mail et votre mot de passe.", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHander("Email ou mot de passe invalide.", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Email ou mot de passe invalide.", 401));
  }

  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("Utilisateur non trouvé", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  /* const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`; */

  const resetPasswordUrl = `http://localhost:5173/reset-password/${resetToken}`;

  const message = `Votre jeton de réinitialisation de mot de passe est :- \n\n ${resetPasswordUrl} \n\nSi vous n'avez pas demandé cet e-mail, veuillez l'ignorer.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Itschools`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email envoyé à ${user.email} avec succès`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Le jeton de réinitialisation du mot de passe n’est pas valide ou a expiré",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Le mot de passe n'est pas un mot de passe", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
  });

  /* sendToken(user, 200, res); */
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});

// Get all conteurs(admin)
exports.getAllConteur = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ role: "conteur" });

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    role: "conteur",
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});


// update Student Profile
exports.updateProfileStudent = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    nom: req.body.nom,
    prenom: req.body.prenom,
    numero: req.body.numero,
    numero_rue: req.body.numero_rue,
    ville: req.body.ville,
    region: req.body.region,
    code_postal: req.body.code_postal,
  };


  const studentInfo = await StudentInfos.find({ user: req.user.id });

  if (studentInfo) {
    await StudentInfos.findByIdAndUpdate(studentInfo[0]._id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
    });
  }

});

// Get Student Detail
exports.getStudentDetails = catchAsyncErrors(async (req, res, next) => {

  const studentInfoDetails = await StudentInfos.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    studentInfoDetails: studentInfoDetails[0],
  });

});

/* Paymet */
const paymentFunction = (montantAPaye, studentInfo, formation, res) => {
  /* Informations du cinetpay */
  let data = JSON.stringify({
    "apikey": "859867072650304c5f00440.22075151",
    "site_id": "821343",
    "transaction_id": Math.floor(Math.random() * 100000000).toString(), //
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
    "metadata": JSON.stringify({ formation, user: studentInfo.user._id }),
    "lang": "FR",
    "invoice_data": {
      "Reste à payer": "25 000fr",
      "Matricule": "24OPO25",
      "Annee-scolaire": "2020-2021"
    }
  });

  /* config data */
  let config = {
    method: 'post',
    url: 'https://api-checkout.cinetpay.com/v2/payment',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
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
