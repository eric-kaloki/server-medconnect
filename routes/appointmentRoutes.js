const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, getDoctorAppointments, getBlockedAndBookedSlots, blockTimeSlots, getDoctorBlockedSlots, rescheduleAppointment, confirmReschedule, cancelAppointment, getPendingAppointments } = require('../controllers/appointment/appointmentsController');
const authMiddleware = require('../middleware/auth'); // Import the auth middleware

router.post('/book', authMiddleware, bookAppointment); // Protect this route
router.get('/patient-appointments', authMiddleware, getAppointments); // Protect this route
router.get('/doctor-appointments', authMiddleware, getDoctorAppointments);
router.get('/slots', authMiddleware, getBlockedAndBookedSlots); // New endpoint for fetching slots
router.post('/block-slots', authMiddleware, blockTimeSlots); // New endpoint for blocking time slots
router.get('/doctor-blocked-slots', authMiddleware, getDoctorBlockedSlots); // New endpoint for fetching blocked slots for doctors
router.put('/reschedule', authMiddleware, rescheduleAppointment); // Endpoint for rescheduling appointments
router.put('/confirm-reschedule', authMiddleware, confirmReschedule); // Endpoint for confirming reschedule
router.put('/cancel-appointment', authMiddleware, cancelAppointment); // Endpoint for canceling appointments
router.get('/pending-appointments', authMiddleware, getPendingAppointments); // New endpoint for pending appointments

module.exports = router;