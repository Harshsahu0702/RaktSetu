// -------------------------
// Rakt-Setu Backend Server
// -------------------------
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // For static assets (CSS/JS/images)

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------------
// MongoDB Connection
// -------------------------
mongoose
  .connect("mongodb://127.0.0.1:27017/raktsetuDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------------
// Schemas & Models
// -------------------------

// Base user schema for common fields
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, minlength: 3 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['patient', 'donor', 'hospital', 'admin'], required: true }
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  ...userSchema.obj,
  bloodGroup: { type: String, required: true },
  city: { type: String, required: true },
  contactInfo: { type: String, required: true },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' }],
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  }
});

// Donor Schema
const donorSchema = new mongoose.Schema({
  ...userSchema.obj,
  bloodGroup: { type: String, required: true },
  city: { type: String, required: true },
  contactInfo: { type: String, required: true },
  availabilityStatus: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  donationHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }]
});

// Hospital Schema
const hospitalSchema = new mongoose.Schema({
  ...userSchema.obj,
  hospitalName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  contactInfo: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  locationUpdateAttempts: { type: Number, default: 3 },
  bloodStock: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 }
  },
  isVerified: { type: Boolean, default: false }
});

hospitalSchema.index({ location: '2dsphere' });

// Admin Schema
const adminSchema = new mongoose.Schema({
    ...userSchema.obj,
});

// Blood Request Schema
const bloodRequestSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  bloodGroup: { type: String, required: true },
  city: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'delivering', 'completed'], default: 'pending' },
  requestType: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  createdAt: { type: Date, default: Date.now },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// Donation Application Schema
const donationApplicationSchema = new mongoose.Schema({
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});


const Patient = mongoose.model("Patient", patientSchema);
const Donor = mongoose.model("Donor", donorSchema);
const Hospital = mongoose.model("Hospital", hospitalSchema);
const Admin = mongoose.model("Admin", adminSchema);
const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);
const Donation = mongoose.model("Donation", donationApplicationSchema);

// -------------------------
// Helper Functions
// -------------------------
const loginUser = async (Model, req, res, dashboardView) => {
  try {
    const { loginEmail, loginPassword } = req.body;

    if (!loginEmail || !loginPassword)
      return res.status(400).send("Email and password required.");

    const user = await Model.findOne({ email: loginEmail });
    if (!user) return res.status(400).send("User not found.");

    const isMatch = await bcrypt.compare(loginPassword, user.password);
    if (!isMatch) return res.status(400).send("Invalid credentials.");

    console.log(`✅ ${Model.modelName} logged in: ${user.email}`);

    // Pass the entire user object to the template
    res.render(dashboardView, { user: user });
  } catch (err) {
    console.error(`❌ ${Model.modelName} login error:`, err);
    res.status(500).send("Server error");
  }
};

// -------------------------
// API Routes
// -------------------------

// Patient Signup
app.post("/api/patient/signup", async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, bloodGroup, city, contactInfo } = req.body;

        if (!fullName || !email || !password || !bloodGroup || !city || !contactInfo)
            return res.status(400).send("All fields are required.");

        if (password !== confirmPassword)
            return res.status(400).send("Passwords do not match.");

        const existing = await Patient.findOne({ email });
        if (existing) return res.status(400).send("Patient already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newPatient = new Patient({
            fullName,
            email,
            password: hashedPassword,
            bloodGroup,
            city,
            contactInfo,
            role: 'patient'
        });

        await newPatient.save();
        console.log(`✅ New Patient registered: ${newPatient.email}`);
        res.render("patient", { username: newPatient.fullName });
    } catch (err) {
        console.error("❌ Patient signup error:", err);
        res.status(500).send("Server error");
    }
});

// Donor Signup
app.post("/api/donor/signup", async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, bloodGroup, city, contactInfo } = req.body;

        if (!fullName || !email || !password || !bloodGroup || !city || !contactInfo)
            return res.status(400).send("All fields are required.");

        if (password !== confirmPassword)
            return res.status(400).send("Passwords do not match.");

        const existing = await Donor.findOne({ email });
        if (existing) return res.status(400).send("Donor already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newDonor = new Donor({
            fullName,
            email,
            password: hashedPassword,
            bloodGroup,
            city,
            contactInfo,
            role: 'donor'
        });

        await newDonor.save();
        console.log(`✅ New Donor registered: ${newDonor.email}`);
        res.render("donor", { username: newDonor.fullName });
    } catch (err) {
        console.error("❌ Donor signup error:", err);
        res.status(500).send("Server error");
    }
});

// Hospital Signup
app.post("/api/hospital/signup", async (req, res) => {
    try {
        const { hospitalName, email, password, confirmPassword, address, city, pincode, contactInfo, fullName } = req.body;

        if (!hospitalName || !email || !password || !address || !city || !pincode || !contactInfo || !fullName)
            return res.status(400).send("All fields are required.");

        if (password !== confirmPassword)
            return res.status(400).send("Passwords do not match.");

        const existing = await Hospital.findOne({ email });
        if (existing) return res.status(400).send("Hospital already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newHospital = new Hospital({
            hospitalName,
            email,
            password: hashedPassword,
            address,
            city,
            pincode,
            contactInfo,
            fullName,
            role: 'hospital',
            locationUpdateAttempts: 3
        });

        await newHospital.save();
        console.log(`✅ New Hospital registered: ${newHospital.email}`);
        res.render("hospital", { user: newHospital });
    } catch (err) {
        console.error("❌ Hospital signup error:", err);
        res.status(500).send("Server error");
    }
});

// Admin Signup (for development/setup purposes)
app.post("/api/admin/signup", async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) return res.status(400).send("Passwords do not match.");
        
        const existing = await Admin.findOne({ email });
        if (existing) return res.status(400).send("Admin already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            fullName,
            email,
            password: hashedPassword,
            role: 'admin'
        });
        await newAdmin.save();
        res.status(201).send("Admin created successfully");
    } catch (err) {
        res.status(500).send("Server error");
    }
});


// Login Routes
app.post("/api/patient/login", (req, res) => loginUser(Patient, req, res, "patient"));
app.post("/api/donor/login", (req, res) => loginUser(Donor, req, res, "donor"));
app.post("/api/hospital/login", (req, res) => loginUser(Hospital, req, res, "hospital"));
// app.post("/api/admin/login", (req, res) => loginUser(Admin, req, res, "admin_dashboard")); // Admin dashboard view needed

// -------------------------
// Patient Functionality Routes
// -------------------------
app.post('/api/hospitals/search', async (req, res) => {
    try {
        const { longitude, latitude, bloodGroup } = req.body;

        if (!longitude || !latitude || !bloodGroup) {
            return res.status(400).send("Longitude, latitude, and blood group are required.");
        }

        const hospitals = await Hospital.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: 5000 // 5 kilometers
                }
            },
            [`bloodStock.${bloodGroup}`]: { $gt: 0 }
        });

        res.json(hospitals);
    } catch (err) {
        console.error("❌ Hospital search error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/requests/new', async (req, res) => {
    try {
        // Assuming patient ID is sent in the request body or from session
        const { patientId, bloodGroup, city, requestType, longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            return res.status(400).send("Location is required.");
        }

        const newRequest = new BloodRequest({
            patient: patientId,
            bloodGroup,
            city,
            requestType,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });
        await newRequest.save();
        
        // Link the request to the patient
        await Patient.findByIdAndUpdate(patientId, { $push: { requests: newRequest._id } });

        // Notify nearby donors and hospitals
        notifyDonorsAndHospitals(newRequest);

        res.status(201).json(newRequest);
    } catch (err) {
        console.error("❌ Blood request error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/requests/sos', async (req, res) => {
    try {
        // Assuming patient ID is sent in the request body or from session
        const { patientId, bloodGroup, city, longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            return res.status(400).send("Location is required.");
        }

        const newRequest = new BloodRequest({
            patient: patientId,
            bloodGroup,
            city,
            requestType: 'urgent', // Set request type to urgent
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });
        await newRequest.save();
        
        await Patient.findByIdAndUpdate(patientId, { $push: { requests: newRequest._id } });

        // Notify nearby donors and hospitals
        notifyDonorsAndHospitals(newRequest);
        
        console.log(`🆘 New SOS Request created: ${newRequest._id} for ${bloodGroup} in ${city}`);

        res.status(201).json({ message: "SOS request sent successfully!", request: newRequest });
    } catch (err)
 {
        console.error("❌ SOS request error:", err);
        res.status(500).send("Server error");
    }
});

app.get('/api/requests/patient/:patientId', async (req, res) => {
    try {
        const requests = await BloodRequest.find({ patient: req.params.patientId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error("❌ Fetching patient requests error:", err);
        res.status(500).send("Server error");
    }
});

// -------------------------
// Smart Matching & Notification Logic
// -------------------------
const notifyDonorsAndHospitals = async (bloodRequest) => {
    try {
        // Find available donors with the same blood group in the same city
        const matchingDonors = await Donor.find({
            bloodGroup: bloodRequest.bloodGroup,
            city: bloodRequest.city,
            availabilityStatus: 'available'
        });

        // Find hospitals with available stock in the same city
        const matchingHospitals = await Hospital.find({
            city: bloodRequest.city,
            [`bloodStock.${bloodRequest.bloodGroup}`]: { $gt: 0 }
        });

        // In a real application, you would send emails, SMS, or push notifications.
        // For this project, we'll just log to the console.
        console.log('--- Smart Match System ---');
        console.log(`Request ID: ${bloodRequest._id}`);
        console.log(`Notifying ${matchingDonors.length} donors and ${matchingHospitals.length} hospitals.`);
        matchingDonors.forEach(donor => console.log(`  - Donor to notify: ${donor.email}`));
        matchingHospitals.forEach(hospital => console.log(`  - Hospital to notify: ${hospital.email}`));
        console.log('--------------------------');

    } catch (error) {
        console.error('❌ Notification error:', error);
    }
};

// -------------------------
// Hospital Functionality Routes
// -------------------------
app.get('/api/requests/hospital/:hospitalId', async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.hospitalId);
        if (!hospital) {
            return res.status(404).send("Hospital not found");
        }
        // Find pending requests in the same city as the hospital
        const requests = await BloodRequest.find({ status: 'pending', city: hospital.city }).populate('patient', 'fullName bloodGroup');
        res.json(requests);
    } catch (err) {
        console.error("❌ Fetching requests error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/requests/update/:requestId', async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const { requestId } = req.params;
        const updatedRequest = await BloodRequest.findByIdAndUpdate(requestId, { status }, { new: true });
        res.json(updatedRequest);
    } catch (err) {
        console.error("❌ Request update error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/stock/update/:hospitalId', async (req, res) => {
    try {
        const { bloodGroup, units } = req.body; // units can be positive or negative
        const { hospitalId } = req.params;
        
        const update = { $inc: { [`bloodStock.${bloodGroup}`]: units } };
        const updatedHospital = await Hospital.findByIdAndUpdate(hospitalId, update, { new: true });

        res.json(updatedHospital.bloodStock);
    } catch (err) {
        console.error("❌ Stock update error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/hospital/location/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { coordinates } = req.body;

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            return res.status(404).send("Hospital not found.");
        }

        if (hospital.locationUpdateAttempts <= 0) {
            return res.status(403).json({ message: "No location update attempts remaining." });
        }

        hospital.location = {
            type: 'Point',
            coordinates: coordinates
        };
        hospital.locationUpdateAttempts -= 1;

        await hospital.save();

        res.status(200).json({ 
            message: "Location updated successfully.", 
            remainingAttempts: hospital.locationUpdateAttempts 
        });
    } catch (err) {
        console.error("❌ Location update error:", err);
        res.status(500).send("Server error");
    }
});

// -------------------------
// Account Deletion Routes
// -------------------------
app.delete('/api/patient/:id', async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        // Optional: Also delete associated blood requests
        await BloodRequest.deleteMany({ patient: req.params.id });
        res.status(200).send("Patient account deleted successfully.");
    } catch (err) {
        console.error("❌ Patient delete error:", err);
        res.status(500).send("Server error");
    }
});

app.delete('/api/donor/:id', async (req, res) => {
    try {
        await Donor.findByIdAndDelete(req.params.id);
        // Optional: Also delete associated donation history
        await Donation.deleteMany({ donor: req.params.id });
        res.status(200).send("Donor account deleted successfully.");
    } catch (err) {
        console.error("❌ Donor delete error:", err);
        res.status(500).send("Server error");
    }
});

app.delete('/api/hospital/:id', async (req, res) => {
    try {
        await Hospital.findByIdAndDelete(req.params.id);
        res.status(200).send("Hospital account deleted successfully.");
    } catch (err) {
        console.error("❌ Hospital delete error:", err);
        res.status(500).send("Server error");
    }
});


// -------------------------
// Page Rendering Routes
// -------------------------
app.get('/hospital/:id', async (req, res) => {
    try {
        const user = await Hospital.findById(req.params.id);
        if (!user) return res.status(404).send('Hospital not found');
        res.render('hospital', { user });
    } catch (error) {
        console.error("❌ Hospital dashboard error:", error);
        res.status(500).send('Server error');
    }
});

app.get('/hospital/:id/requests', async (req, res) => {
    try {
        const user = await Hospital.findById(req.params.id);
        if (!user) return res.status(404).send('Hospital not found');
        res.render('hospital-requests', { user });
    } catch (error) {
        console.error("❌ Hospital requests page error:", error);
        res.status(500).send('Server error');
    }
});

// -------------------------
// Default Routes
// -------------------------
app.get("/", (req, res) => {
  res.render("index"); // Render your main page (index.ejs)
});

app.get("/get-started", (req, res) => {
  res.render("get-started"); // Render your main page (get-started.ejs)
});

// -------------------------
// Server Start
// -------------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
