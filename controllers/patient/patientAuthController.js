
const express = require('express');
const { supabase } = require('../../config/supabaseClient');
const bcrypt = require('bcrypt');

// Endpoint to register a patient
exports.registerPatient = async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([{ name, email, password: hashedPassword, phone, role: 'patient' }])
        .select(); // Request the inserted data
 
      if (patientError) {
        return res.status(500).json({ message: 'Error registering patient', error: patientError.message });
      }
  
      return res.status(201).json({ message: 'Patient registered successfully', patient });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };