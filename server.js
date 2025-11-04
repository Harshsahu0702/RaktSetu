// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/raktsetuDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Import Routes
const patientRoutes = require('./routes/patientAuth');
const donorRoutes = require('./routes/donorAuth');
const hospitalRoutes = require('./routes/hospitalAuth');

// ✅ Use Routes
app.use('/api/patient', patientRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/hospital', hospitalRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to RaktSetu API 💉');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
