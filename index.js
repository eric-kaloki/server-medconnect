const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io'); // Import socket.io
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
const { initializeWebRTCServer } = require('./routes/webRTC'); // Import WebRTC server logic
const app = express();

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (adjust for production)
    },
});

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

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });

    // Handle custom events (e.g., join a room)
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Handle leaving a room
    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
    });
});

/**
 * POST /send-invitation
 * Expects JSON data: { recipientId, callerName, channelName }
 */
app.post('/send-invitation', async (req, res) => {
    const { recipientId, callerName, channelName } = req.body;

    if (!recipientId || !callerName || !channelName) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const recipient = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', recipientId)
            .single();

        if (!recipient.data || !recipient.data.fcm_token) {
            return res.status(404).json({ message: 'Recipient not found or FCM token missing' });
        }

        const message = {
            notification: {
                title: 'Incoming Call',
                body: `Incoming call from ${callerName}`,
            },
            data: {
                type: 'call-invitation',
                callerName,
                channelName,
            },
            token: recipient.data.fcm_token,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent FCM message:', response);
        res.status(200).json({ message: 'Invitation sent successfully', response });
    } catch (error) {
        console.error('Error sending FCM message:', error);
        res.status(500).json({ message: 'Error sending invitation', error: error.message });
    }
});

/**
 * POST /invitation-acknowledgment
 * Expects JSON data: { channelName, status }
 */
app.post('/invitation-acknowledgment', (req, res) => {
    const { channelName, status } = req.body;

    if (!channelName || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Acknowledgment received for channel ${channelName}: ${status}`);

    // Notify the initiator about the acknowledgment
    io.to(channelName).emit('invitation-status', { status });

    res.status(200).json({ message: `Acknowledgment received for channel ${channelName}` });
});

/**
 * POST /call-response
 * Expects JSON data: { channelName, response }
 */
app.post('/call-response', (req, res) => {
    const { channelName, response } = req.body;

    if (!channelName || !response) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Response received for channel ${channelName}: ${response}`);

    // Notify the initiator about the response
    io.to(channelName).emit('call-response', { response });

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

// Initialize WebRTC signaling server
initializeWebRTCServer(server);

// Handling the middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});