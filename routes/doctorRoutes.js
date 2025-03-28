const express = require('express');
const router = express.Router();
const { registerDoctor, validateLicense, getDoctors } = require('../controllers/doctor/doctorAuthController');

router.post('/register', registerDoctor);
router.post('/validate-license', validateLicense);
router.get('/get-doctors', getDoctors);

module.exports = router;
