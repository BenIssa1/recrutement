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

    console.log(type_formation, montant)

    const studentInfo = await StudentInfos.create({
      nom: name,
      prenom,
      numero,
      numero_rue,
      ville,
      region,
      code_postal,
      cni: req.files.cni[0].originalname,
      bulletin: req.files.bulletin[0].originalname,
      user: user._id
    });

    if (studentInfo) {

      /* Get Formation */
      const formationExist = await Formation.findOne({user:  user._id, formation});

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
              user:  user._id,
              studentInfo: studentInfo._id
          });
      
          /* Verifie si la formation est bien cree */
          if (formationCreate) {
              /* Call paymentFunction */
              paymentFunction(montantAPaye, studentInfo, formation, res)
          } 
      }
    } else {
      return next(new ErrorHander("Error c'est produite lors de la creation des sauvegades des informations de l'utilisateur", 400));
    }

  } else {
    return next(new ErrorHander("Error c'est produite lors de la creation de l'utilisateur", 400));
  }

   
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
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
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
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
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById( user._id);

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
