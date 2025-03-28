const { supabase } = require("../../config/supabaseClient");

// Helper function to handle Supabase errors
const handleSupabaseError = (res, error) => {
  console.error("Supabase error:", error);
  return res
    .status(500)
    .json({ error: "Internal server error", details: error });
};

// Diagnosis Endpoint
exports.createDiagnosis = async (req, res) => {
  try {
    const {
      patient_name,
      doctor_name,
      appointment_date,
      diagnosis_details,
      severity,
      notes,
    } = req.body;
    const { data, error } = await supabase
      .from("diagnoses")
      .insert([
      {
        patient_name,
        doctor_name,
        appointment_date: appointment_date.split('T')[0], // Extract only the year, month, and day
        diagnosis_details,
        severity,
        notes,
      },
      ])
      .select(); // Return the inserted data

    if (error) return handleSupabaseError(res, error);
    res.status(201).json(data ? data[0] : {}); //ensure we return an object
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Fetch Diagnoses
exports.getDiagnoses = async (req, res) => {
  try {
    const { patient_name } = req.query;
    const { data, error } = await supabase
      .from("diagnoses")
      .select("*")
      .eq("patient_name", patient_name);

    if (error) {
      console.error("Error fetching diagnoses:", error); // Log error
      return handleSupabaseError(res, error);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Unexpected error in getDiagnoses:", error); // Log unexpected errors
    return handleSupabaseError(res, error);
  }
};

// Prescription Endpoint
exports.createPrescription = async (req, res) => {
  try {
    const {
      patient_name,
      doctor_name, // Add doctor_name field
      appointment_id,
      drug_name,
      dosage,
      frequency,
      duration,
      special_instructions,
    } = req.body;
    const { data, error } = await supabase
      .from("prescriptions")
      .insert([
        {
          patient_name,
          doctor_name, // Include doctor_name in the insert
          appointment_id,
          drug_name,
          dosage,
          frequency,
          duration,
          special_instructions,
        },
      ])
      .select();

    if (error) return handleSupabaseError(res, error);
    res.status(201).json(data ? data[0] : {});
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Fetch Prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const { patient_name } = req.query;
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_name", patient_name);

    if (error) return handleSupabaseError(res, error);
    res.status(200).json(data);
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Test Results Endpoint
exports.createTestResults = async (req, res) => {
  try {
    const {
      patient_name,
      doctor_name, // Include doctor_name
      appointment_id,
      test_type,
      lab_details,
      findings,
      doctor_remarks,
      file_url,
    } = req.body;

    const { data, error } = await supabase
      .from("test_results")
      .insert([
        {
          patient_name,
          doctor_name, // Include doctor_name in the insert
          appointment_id,
          test_type,
          lab_details,
          findings,
          doctor_remarks,
          file_url,
        },
      ])
      .select();

    if (error) return handleSupabaseError(res, error);
    res.status(201).json(data ? data[0] : {});
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Fetch Test Results
exports.getTestResults = async (req, res) => {
  try {
    const { patient_name } = req.query;
    const { data, error } = await supabase
      .from("test_results")
      .select("*")
      .eq("patient_name", patient_name);

    if (error) return handleSupabaseError(res, error);
    res.status(200).json(data);
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Treatment Plan Endpoint
exports.createTreatmentPlan = async (req, res) => {
  try {
    const {
      patient_name,
      doctor_name, // Include doctor_name
      appointment_id,
      recommended_procedures,
      lifestyle_changes,
      follow_up_schedule,
      progress_tracking,
    } = req.body;

    const { data, error } = await supabase
      .from("treatment_plans")
      .insert([
        {
          patient_name,
          doctor_name, // Include doctor_name in the insert
          appointment_id,
          recommended_procedures,
          lifestyle_changes,
          follow_up_schedule,
          progress_tracking,
        },
      ])
      .select();

    if (error) return handleSupabaseError(res, error);
    res.status(201).json(data ? data[0] : {});
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Fetch Treatment Plans
exports.getTreatmentPlans = async (req, res) => {
  try {
    const { patient_name } = req.query;
    const { data, error } = await supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_name", patient_name);

    if (error) return handleSupabaseError(res, error);
    res.status(200).json(data);
  } catch (error) {
    return handleSupabaseError(res, error);
  }
};

// Fetch Medical Records by Patient and Doctor
exports.getMedicalRecordsByPatientAndDoctor = async (req, res) => {
  try {
    const { patient_name, doctor_name } = req.query;
    if (!patient_name || !doctor_name) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    const diagnoses = await supabase
      .from("diagnoses")
      .select("*")
      .eq("patient_name", patient_name)
      .eq("doctor_name", doctor_name);

    const prescriptions = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_name", patient_name)
      .eq("doctor_name", doctor_name);

    const testResults = await supabase
      .from("test_results")
      .select("*")
      .eq("patient_name", patient_name)
      .eq("doctor_name", doctor_name);

    const treatmentPlans = await supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_name", patient_name)
      .eq("doctor_name", doctor_name);

    if (diagnoses.error || prescriptions.error || testResults.error || treatmentPlans.error) {
      return res.status(500).json({ message: "Error fetching medical records" });
    }

  

    // Send the response
    res.status(200).json({
      diagnoses: diagnoses.data,
      prescriptions: prescriptions.data,
      testResults: testResults.data,
      treatmentPlans: treatmentPlans.data,
    });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
