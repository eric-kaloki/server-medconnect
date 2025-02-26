const express = require('express');
const router = express.Router();
const { registerDoctor, validateLicense } = require('../controllers/doctor/doctorAuthController');

router.post('/register', registerDoctor);
router.post('/validate-license', validateLicense);

module.exports = router;
