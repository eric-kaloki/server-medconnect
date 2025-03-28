const express = require("express");
const authMiddleware = require("../middleware/auth"); // Corrected import path
const {
  createDiagnosis,
  createPrescription,
  createTestResults,
  createTreatmentPlan,
  getDiagnoses,
  getPrescriptions,
  getTestResults,
  getTreatmentPlans,
  getMedicalRecordsByPatientAndDoctor
} = require("../controllers/records/medicalRecordsController"); // Import the new controller

const router = express.Router();

// Routes for creating new medical records, with authentication
router.post("/new-diagnosis", authMiddleware, createDiagnosis);
router.post("/new-prescription", authMiddleware, createPrescription);
router.post("/test-results", authMiddleware, createTestResults);
router.post("/treatment-plans", authMiddleware, createTreatmentPlan);

// Routes for fetching medical records
router.get("/diagnoses", authMiddleware, getDiagnoses);
router.get("/prescriptions", authMiddleware, getPrescriptions);
router.get("/test-results", authMiddleware, getTestResults);
router.get("/treatment-plans", authMiddleware, getTreatmentPlans);

// Route for fetching medical records by patient and doctor
router.get("/records-by-patient-and-doctor", authMiddleware, getMedicalRecordsByPatientAndDoctor);

module.exports = router;
