const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // Import HTTP module
const notificationRoutes = require('./routes/notificationRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const loginRoutes = require('./routes/loginRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const recordsRoutes = require('./routes/medicalRoutes');
const rtcRouter = require('./routes/agoraRTC');
const {supabase} = require('./config/supabaseClient'); // Ensure correct import
const https = require("https");
const app = express();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth/doctor/', doctorRoutes);
app.use('/api/auth/patient/', patientRoutes);
app.use('/api/auth/', loginRoutes);
app.use('/api/appointments/', appointmentRoutes);
app.use('/api/records/', recordsRoutes);
app.use('/rtc', rtcRouter); // Mount the router
app.use("/api/notifications", notificationRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Initialize Firebase Admin with your service account key from the file
const admin = require('firebase-admin');
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

/**
 * POST /send-invitation
 * Expects JSON data: { recipientId, callerName, channelName }
 */


/**
 * POST /invitation-acknowledgment
 * Expects JSON data: { channelName, status }
 */
app.post('/invitation-acknowledgment', (req, res) => {
    const { channelName, status } = req.body;

    if (!channelName || !status) {
        console.error('Missing required fields in invitation acknowledgment:', req.body);
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Acknowledgment received for channel ${channelName}: ${status}`);

    res.status(200).json({ message: `Acknowledgment received for channel ${channelName}` });
});

/**
 * POST /call-response
 * Expects JSON data: { channelName, response }
 */
app.post('/call-response', (req, res) => {
    const { channelName, response } = req.body;

    if (!channelName || !response) {
        console.error('Missing required fields in call response:', req.body);
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Response received for channel ${channelName}: ${response}`);

    res.status(200).json({ message: `Response received: ${response}` });
});

// List of backend URLs to ping
const backendUrls = ["https://server-medconnect-kdeb.onrender.com"]; // Add more URLs as needed

// Function to ping each backend URL
function pingBackends() {
  backendUrls.forEach((url) => {
    https.get(url, (res) => {
      console.log(`Pinged ${url}: Status Code ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`Error pinging ${url}: ${err.message}`);
    });
  });
}

// Schedule pings every 10 minutes (600,000 milliseconds)
setInterval(pingBackends, 600000);

// Ping immediately when the service starts
pingBackends();

// Handling the middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});