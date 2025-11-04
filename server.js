// ===== server.js =====
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// ===== EJS SETUP =====
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // 👈 add this to support form submissions (from your signup/login forms)

// ===== MONGODB CONNECTION =====
mongoose.connect('mongodb://127.0.0.1:27017/raktsetuDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ===== ROUTES IMPORT =====
const patientRoutes = require('./routes/patientAuth');
const donorRoutes = require('./routes/donorAuth');
const hospitalRoutes = require('./routes/hospitalAuth');

// ===== USE ROUTES =====
app.use('/api/patient', patientRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/hospital', hospitalRoutes);

// ===== PAGE ROUTES =====
app.get('/', (req, res) => {
  res.render('index'); // renders views/index.ejs
});

app.get('/get-started', (req, res) => {
  res.render('get-started'); // renders views/get-started.ejs
});

// ===== START SERVER =====
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
