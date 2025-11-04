const express = require('express');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from 'public' directory
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

// Route for Get Started page
app.get('/get-started', (req, res) => {
  res.render('get-started');
});

// Route for Patient Dashboard
app.get('/patient/dashboard', (req, res) => {
  // In a real app, you would verify the user is logged in here
  res.render('patient-dashboard');
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));