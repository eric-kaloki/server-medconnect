const express = require('express');
const { supabase } = require('../../config/supabaseClient');
const router = express.Router();
const bcrypt = require('bcrypt');


// Utility function to validate a license ID
const isLicenseValid = async (licenseId) => {
  const { data: license, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('licenseid', licenseId)
    .single();

  if (error) {
    throw new Error('Error validating license');
  }

  return !!license; // Returns true if the license exists, false otherwise
};

// Endpoint to validate a doctor's license
exports.validateLicense = async (req, res) => {
  const { licenseId } = req.body;
  try {
    const validLicense = await isLicenseValid(licenseId); // Call the utility function

    if (validLicense) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(200).json({ valid: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/// Endpoint to register a doctor

// Endpoint to register a doctor
exports.registerDoctor = async (req, res) => {
  const { name, email, password, licenseId, phone } = req.body;

  try {
    const validLicense = await isLicenseValid(licenseId);
    if (!validLicense) {
      console.error('Invalid license ID');
      return res.status(400).json({ message: 'Invalid license ID' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .insert([{ name, email, password: hashedPassword, license_id: licenseId, phone, role: 'doctor' }])
      .select(); // Request the inserted data
   
    if (doctorError) {
      console.error('Error registering doctor:', doctorError);
      return res.status(500).json({ message: 'Error registering doctor', error: doctorError.message });
    }

    return res.status(201).json({ message: 'Doctor registered successfully', doctor });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};