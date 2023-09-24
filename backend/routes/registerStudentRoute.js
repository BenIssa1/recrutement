
const express = require("express");

const {
  registerStudent,
} = require("../controllers/registerStudentController");

const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({  
    destination: function (req, file, cb) {
      cb(null, path.resolve('backend', 'public', 'images'));
      /* cb(null, path.join(__dirname, '/public/images/')); */
      
    },
    filename: function (req, file, cb) {
        console.log('oui')
      cb(null, Date.now() + file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })

// Register Student
router.post("/register-student", upload.fields([
  {name: 'cni'},
  {name: 'dernier'},
]), registerStudent);

module.exports = router