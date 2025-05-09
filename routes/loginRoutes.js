const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabaseClient');
const bcrypt = require('bcrypt');
const router = express.Router();

// Secret key for signing the JWT
const JWT_SECRET = process.env.JWT_SECRET; // Store this in an environment variable

router.post('/login', async (req, res) => {
  const { email, password, fcmToken } = req.body;

  try {
    // Check in doctors table
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();

    // Check in patients table
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('email', email)
      .single();

    // Determine which user is found and validate the password
    let user;
    if (doctor) {
      user = doctor;
    } else if (patient) {
      user = patient;
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Save the FCM token for the user
    await supabase
      .from(user.role === 'doctor' ? 'doctors' : 'patients')
      .update({ fcm_token: fcmToken })
      .eq('email', email);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Payload
      JWT_SECRET,
      { expiresIn: '30d' } // Token expiration set for 30 days
    );

    // Successful login
    return res.status(200).json({
      success: true,
      data: {
        token, // Include the token in the response
        role: user.role, // Include the user's role
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        fcmToken: fcmToken, // Return the FCM token
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;