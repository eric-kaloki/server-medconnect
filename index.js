const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const loginRoutes = require('./routes/loginRoutes');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth/doctor/', doctorRoutes);
app.use('/api/auth/patient/', patientRoutes);
app.use('/api/auth/', loginRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});