const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  getDoctorAppointments,
  getBlockedAndBookedSlots,
  blockTimeSlots,
  getDoctorBlockedSlots,
  rescheduleAppointment,
  confirmReschedule,
  cancelAppointment,
  getPendingAppointments,
} = require("../controllers/appointment/appointmentsController");
const authMiddleware = require("../middleware/auth"); // Import the auth middleware
const { supabase } = require("../config/supabaseClient"); // Ensure correct import

router.post("/book", authMiddleware, bookAppointment); // Protect this route
router.get("/patient-appointments", authMiddleware, getAppointments); // Protect this route
router.get("/doctor-appointments", authMiddleware, getDoctorAppointments);
router.get("/slots", authMiddleware, getBlockedAndBookedSlots); // New endpoint for fetching slots
router.post("/block-slots", authMiddleware, blockTimeSlots); // New endpoint for blocking time slots
router.get("/doctor-blocked-slots", authMiddleware, getDoctorBlockedSlots); // New endpoint for fetching blocked slots for doctors
router.put("/reschedule", authMiddleware, rescheduleAppointment); // Endpoint for rescheduling appointments
router.put("/confirm-reschedule", authMiddleware, confirmReschedule); // Endpoint for confirming reschedule
router.put("/cancel-appointment", authMiddleware, cancelAppointment); // Endpoint for canceling appointments
router.get("/pending-appointments", authMiddleware, getPendingAppointments); // New endpoint for pending appointments

// Initialize Firebase Admin with your service account key from the file
const admin = require("firebase-admin");
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Store active notifications to prevent duplicates
const activeNotifications = new Set();

router.post("/send-invitation", async (req, res) => {
  console.log("Received request to send invitation:", req.body);
  const { recipientId, callerName, channelName } = req.body;

  if (!recipientId || !callerName || !channelName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check if a notification for this channel is already in progress
  if (activeNotifications.has(channelName)) {
    return res
      .status(429)
      .json({ message: "Notification already in progress for this channel" });
  }

  try {
    // Add channelName to active notifications
    activeNotifications.add(channelName);

    // Retrieve the recipient's FCM token from Supabase
    let { data: recipient, error } = await supabase
      .from("doctors")
      .select("fcm_token")
      .eq("id", recipientId)
      .single();

    if (!recipient || error) {
      ({ data: recipient, error } = await supabase
        .from("patients")
        .select("fcm_token")
        .eq("id", recipientId)
        .single());
    }

    if (error || !recipient || !recipient.fcm_token) {
      activeNotifications.delete(channelName); // Remove from active notifications
      return res
        .status(404)
        .json({ message: "Recipient not found or FCM token missing" });
    }

    // Send FCM notification
    const message = {
      notification: {
        title: "Incoming Call",
        body: `Incoming call from ${callerName}`,
      },
      data: {
        type: "call-invitation",
        callerName,
        channelName,
      },
      token: recipient.fcm_token,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM message:", response);

    res.status(200).json({ message: "Invitation sent successfully", response });
  } catch (error) {
    console.error("Error sending FCM message:", error);
    res
      .status(500)
      .json({ message: "Error sending invitation", error: error.message });
  } finally {
    // Remove channelName from active notifications
    activeNotifications.delete(channelName);
  }
});

module.exports = router;
