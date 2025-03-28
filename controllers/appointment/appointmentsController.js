const { supabase } = require('../../config/supabaseClient');
const jwt = require('jsonwebtoken');
//Controller to book appointment 
exports.bookAppointment = async (req, res) => {
    const { date, day, time, doctor_id } = req.body;

    // Validate required fields
    if (!date || !day || !time || !doctor_id) {
        console.error("Missing required fields:", { date, day, time, doctor_id }); // Debug log
        throw new Error("Missing required fields");
    }

    const patientId = req.userId; // Get the patient ID from the middleware
    if (!patientId) {
        console.error("Not authenticated: Missing patient ID"); // Debug log
        throw new Error("Not authenticated");
    }

    // Check for existing appointments
    const { data: existingAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('date', date)
        .eq('time', time);

    if (fetchError) {
        console.error('Error fetching existing appointments:', fetchError);
        throw new Error('Error checking existing appointments');
    }

    if (existingAppointments.length > 0) {
        throw new Error('Time slot already booked');
    }

    // Insert appointment with patient_id from middleware
    const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
            date,
            day,
            time,
            doctor_id,
            patient_id: patientId, // Use the patient ID from the middleware
            status: 'upcoming',
        }])
        .select();

    if (error) {
        console.error('Error booking appointment:', error);
        throw new Error('Error booking appointment');
    }

    return res.status(201).json({
        message: 'Appointment booked successfully',
        appointment
    });
};

exports.getAppointments = async (req, res) => {
    const patientId = req.userId;

    if (!patientId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('*') // Select only necessary columns
        .eq('patient_id', patientId);

    if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
        return res.status(500).json({ message: 'Error fetching appointments', error: appointmentError.message });
    }

    if (!appointments || appointments.length === 0) {
        return res.status(200).json({ appointments: [] }); // Return empty array if no appointments
    }

    const doctorIds = appointments.map(appointment => appointment.doctor_id);

    const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, name, category')
        .in('id', doctorIds);

    if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
        return res.status(500).json({ message: 'Error fetching doctors', error: doctorsError.message });
    }

    const doctorMap = {};
    if (doctors) {
        doctors.forEach(doctor => {
            doctorMap[doctor.id] = { name: doctor.name, category: doctor.category };
        });
    }

    const appointmentsWithDoctorNames = appointments.map(appointment => {
        const doctorInfo = doctorMap[appointment.doctor_id] || { name: 'Unknown', category: 'Unknown' }; // Default if doctor not found
        return {
            ...appointment,
            doctorName: doctorInfo.name,
            doctorCategory: doctorInfo.category
        };
    });

    return res.status(200).json({ appointments: appointmentsWithDoctorNames });
};

exports.getDoctorAppointments = async (req, res) => {
    const doctorId = req.userId;

    if (!doctorId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }
    const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('*') // Consider selecting only necessary columns
        .eq('doctor_id', doctorId);

    if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
        return res.status(500).json({ message: 'Error fetching appointments', error: appointmentError.message });
    }

    if (!appointments || appointments.length === 0) {
        return res.status(200).json({ appointments:[]}); // Return empty array if no appointments
    }

    const patientIds = appointments.map(appointment => appointment.patient_id);

    const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, name')
        .in('id', patientIds);

    if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        return res.status(500).json({ message: 'Error fetching patients', error: patientsError.message });
    }

    const patientMap = {};
    if (patients) {
        patients.forEach(patient => {
            patientMap[patient.id] = patient.name;
        });
    }

    const appointmentsWithPatientNames = appointments.map(appointment => {
        return {
            ...appointment,
            patientName: patientMap[appointment.patient_id] || 'Unknown'
        };
    });

    return res.status(200).json({ appointments: appointmentsWithPatientNames });
};

exports.getBlockedAndBookedSlots = async (req, res) => {
  try {
    console.log('Fetching slots...');
    const { date, doctor_id } = req.query; // Get the date and doctor_id from the query parameters

    if (!doctor_id || !date) {
      console.error('Missing doctor_id or date in request');
      return res.status(400).json({ message: 'Invalid request data. doctor_id and date are required.' });
    }

    let blockedSlots = [];
    let bookedSlots = [];

    // Fetch blocked slots for the specified doctor and date
    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_slots')
      .select('time')
      .eq('doctor_id', doctor_id)
      .eq('date', date);

    if (blockedError) {
      console.error('Error fetching blocked slots:', blockedError);
      return res.status(500).json({ message: 'Error fetching blocked slots', error: blockedError.message });
    }

    blockedSlots = blockedData || [];

    // Fetch booked slots for the specified doctor and date
    const { data: bookedData, error: bookedError } = await supabase
      .from('appointments')
      .select('time')
      .eq('doctor_id', doctor_id)
      .eq('date', date);

    if (bookedError) {
      console.error('Error fetching booked slots:', bookedError);
      return res.status(500).json({ message: 'Error fetching booked slots', error: bookedError.message });
    }

    bookedSlots = bookedData || [];

    console.log('Blocked Slots:', blockedSlots);
    console.log('Booked Slots:', bookedSlots);

    res.status(200).json({
      blockedSlots: blockedSlots.map(slot => slot.time),
      bookedSlots: bookedSlots.map(slot => slot.time),
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Error fetching slots', error: error.message });
  }
};

exports.getDoctorBlockedSlots = async (req, res) => {
  try {
    const doctorId = req.userId; // Get doctor ID from the middleware
    if (!doctorId) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // Fetch blocked slots for the doctor
    const { data: blockedSlots, error } = await supabase
      .from('blocked_slots')
      .select('date, day, time')
      .eq('doctor_id', doctorId);

    if (error) {
      console.error('Error fetching blocked slots:', error);
      return res.status(500).json({ message: 'Error fetching blocked slots', error: error.message });
    }

    // Log the blocked slots for debugging
    console.log('Blocked Slots:', blockedSlots);

    res.status(200).json({ blockedSlots });
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    res.status(500).json({ message: 'Error fetching blocked slots', error: error.message });
  }
};

exports.blockTimeSlots = async (req, res) => {
  try {
    const doctorId = req.userId; // Get doctor ID from the middleware
    const { blockedSlots } = req.body; // Expecting an array of objects with date, day, and time

    if (!doctorId || !blockedSlots || !Array.isArray(blockedSlots)) {
      return res.status(400).json({ message: 'Invalid request data.' });
    }

    // Clear existing blocked slots for the doctor for the provided dates
    const dates = blockedSlots.map(slot => slot.date);
    const { error: deleteError } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('doctor_id', doctorId)
      .in('date', dates);

    if (deleteError) {
      console.error('Error clearing blocked slots:', deleteError);
      return res.status(500).json({ message: 'Error clearing blocked slots', error: deleteError.message });
    }

    // Insert new blocked slots
    const blockedData = blockedSlots.map(slot => ({
      doctor_id: doctorId,
      date: slot.date,
      day: slot.day,
      time: slot.time,
    }));

    const { error: insertError } = await supabase
      .from('blocked_slots')
      .insert(blockedData);

    if (insertError) {
      console.error('Error blocking time slots:', insertError);
      return res.status(500).json({ message: 'Error blocking time slots', error: insertError.message });
    }

    res.status(200).json({ message: 'Time slots blocked successfully.' });
  } catch (error) {
    console.error('Error blocking time slots:', error);
    res.status(500).json({ message: 'Error blocking time slots', error: error.message });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId, newDate, newTime, initiator } = req.body;

    console.log('Reschedule Request:', { appointmentId, newDate, newTime, initiator });

    if (!appointmentId || !newDate || !newTime || !initiator) {
      return res.status(400).json({ message: 'Invalid request data. All fields are required, including initiator.' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Validate time format (HH:mm AM/PM)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    if (!timeRegex.test(newTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm AM/PM.' });
    }

    // Check if the new time slot is already booked
    const { data: existingAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', newDate)
      .eq('time', newTime);
      console.log('existingAppointments:', existingAppointments);

    if (fetchError) {
      console.error('Error checking existing appointments:', fetchError);
      return res.status(500).json({ message: 'Error checking existing appointments' });
    }

    if (existingAppointments.length > 0) {
      return res.status(400).json({ message: 'Time slot already booked.' });
    }

    // Update the appointment with the new date and time
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ date: newDate, time: newTime, status: 'pending confirmation' })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return res.status(500).json({ message: 'Error updating appointment' });
    }

    console.log('Reschedule request processed successfully.');
    res.status(200).json({ message: 'Reschedule request sent successfully.' });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Error rescheduling appointment', error: error.message });
  }
};

exports.confirmReschedule = async (req, res) => {
  try {
    const { appointmentId } = req.body;
console.log('appointmentId:', appointmentId);
    if (!appointmentId) {
      return res.status(400).json({ message: 'Invalid request data. Appointment ID is required.' });
    }

    // Update the appointment status to 'confirmed'
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'upcoming' })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error confirming reschedule:', updateError);
      return res.status(500).json({ message: 'Error confirming reschedule', error: updateError.message });
    }
    console.log('Reschedule confirmed successfully.');

    res.status(200).json({ message: 'Reschedule confirmed successfully.' });
  } catch (error) {
    console.error('Error confirming reschedule:', error);
    res.status(500).json({ message: 'Error confirming reschedule', error: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Invalid request data. Appointment ID is required.' });
    }

    // Delete the appointment from the database
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Error canceling appointment:', deleteError);
      return res.status(500).json({ message: 'Error canceling appointment', error: deleteError.message });
    }

    res.status(200).json({ message: 'Appointment canceled successfully.' });
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ message: 'Error canceling appointment', error: error.message });
  }
};
exports.getPendingAppointments = async (req, res) => {
  try {
    const userId = req.userId; // Get the signed-in user ID from middleware

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // Fetch appointments with status 'pending' where the user is involved
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'pending')
      .or(`doctor_id.eq.${userId},patient_id.eq.${userId}`); // Check if user is a doctor or patient

    if (error) {
      console.error('Error fetching pending appointments:', error);
      return res.status(500).json({ message: 'Error fetching pending appointments', error: error.message });
    }

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ appointments: [] }); // Return empty array if no appointments
    }

    const patientIds = appointments.map(appointment => appointment.patient_id);

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .in('id', patientIds);

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return res.status(500).json({ message: 'Error fetching patients', error: patientsError.message });
    }

    const patientMap = {};
    if (patients) {
      patients.forEach(patient => {
        patientMap[patient.id] = patient.name;
      });
    }

    const appointmentsWithPatientNames = appointments.map(appointment => {
      return {
        ...appointment,
        patientName: patientMap[appointment.patient_id] || 'Unknown'
      };
    });

    res.status(200).json({ appointments: appointmentsWithPatientNames });
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    res.status(500).json({ message: 'Error fetching pending appointments', error: error.message });
  }
};

