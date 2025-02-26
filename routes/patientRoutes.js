const express = require('express');
const router = express.Router();
const { registerPatient } = require('../controllers/patient/patientAuthController');

router.post('/register', registerPatient);

module.exports = router;
