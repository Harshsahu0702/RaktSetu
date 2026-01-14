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
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'raktsetu_secure_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
})); // Session Middleware
app.use(express.static(path.join(__dirname, "public"))); // For static assets (CSS/JS/images)

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------------
// MongoDB Connection
// -------------------------
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------------
// Schemas & Models
// -------------------------
const demoRequestSchema = new mongoose.Schema({
    // Patient information
    patientId: String,
    patientName: String,

    // Source information (for patient requests, this will be the patient's name)
    sourceHospitalId: String,
    sourceHospitalName: String,  // Will store patient's name for patient requests
    state: { type: String, required: true },  // State of the requester
    // Target hospital (the one receiving the request)
    targetHospitalId: String,
    targetHospitalName: String,
    // Legacy fields (kept for backward compatibility)
    hospitalId: { type: String, default: null },
    hospitalName: { type: String, default: null },
    // Other fields
    donorId: String,
    donorName: String,
    bloodGroup: String,
    units: Number,
    datetime: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' },
    requestType: { type: String, enum: ['patient', 'hospital', 'donor'], default: 'patient' },
    contactPerson: String,
    contactNumber: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    notes: String
});

const DemoRequest = mongoose.model("DemoRequest", demoRequestSchema);

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
            type: [Number],
            default: undefined
        }
    }
});

// Donor Schema
const donorSchema = new mongoose.Schema({
    ...userSchema.obj,
    bloodGroup: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
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
            default: undefined
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
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'delivering', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
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

        // Set Session
        req.session.userId = user._id;
        req.session.role = user.role;

        req.session.save(() => {
            // Redirect based on role
            if (user.role === 'donor') return res.redirect(`/donor-dashboard/${user._id}/dashboard`);
            if (user.role === 'hospital') return res.redirect(`/hospital/${user._id}`);
            if (user.role === 'patient') return res.redirect(`/patient/${user._id}`);

            // Fallback for Admin or others
            res.render(dashboardView, { user: user });
        });
    } catch (err) {
        console.error(`❌ ${Model.modelName} login error:`, err);
        res.status(500).send("Server error");
    }
};

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// -------------------------
// API Routes
// -------------------------

// Get blood requests matching donor's blood group and state from demorequests collection
app.get('/api/demo-request', async (req, res) => {
    try {
        const { bloodGroup, state, donorId } = req.query;

        // Log the incoming request for debugging
        console.log('Fetching demo requests with:', { bloodGroup, state, donorId });

        if (!bloodGroup || !state || !donorId) {
            return res.status(400).json({
                success: false,
                message: 'Blood group, state, and donorId are required'
            });
        }

        // Build the query to find matching requests
        const query = {
            status: { $in: ['pending', 'approved'] },
            $or: [
                // 1. Direct Requests: Specifically assigned to this donor
                { donorId: donorId },

                // 2. Broadcast Requests: 'patient' type, matching blood group logic, NO specific donor assigned yet
                {
                    requestType: 'patient',
                    state: state,
                    donorId: { $exists: false }, // Only unassigned requests
                    $or: [
                        { bloodGroup: bloodGroup.toUpperCase() },
                        { bloodGroup: 'O-' },
                        {
                            bloodGroup: 'O+',
                            $or: [
                                { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                                { bloodGroup: 'AB+' }
                            ]
                        }
                    ]
                }
            ]
        };

        // Log the query for debugging
        console.log('MongoDB Query:', JSON.stringify(query, null, 2));

        // Find matching requests in the demorequests collection
        const requests = await mongoose.connection.db.collection('demorequests')
            .find(query)
            .sort({ datetime: -1 }) // Most recent first
            .limit(20) // Limit to 20 most recent requests
            .toArray();

        console.log(`Found ${requests.length} matching requests`);
        res.json(requests);

    } catch (error) {
        console.error('Error fetching demo requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blood requests',
            error: error.message
        });
    }
});
app.get('/patient/:id', async (req, res) => {
    try {
        const user = await Patient.findById(req.params.id);
        if (!user) return res.status(404).send("Patient not found");
        res.render("patient", { user });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.get("/requests", async (req, res) => {
    try {
        const patientId = req.query.patientId;
        if (!patientId) return res.status(400).send("Patient ID missing.");

        // Load the patient from the database
        const user = await Patient.findById(patientId);
        if (!user) {
            console.error(`Patient with id ${patientId} not found`);
            return res.status(404).send('Patient not found');
        }

        const requests = await DemoRequest.find({ patientId })
            .sort({ datetime: -1 });

        res.render("requests", { user, requests });

    } catch (error) {
        console.error("❌ Error loading requests page:", error);
        res.status(500).send("Server error");
    }
});


// Update Donor Donation Dates
app.put('/api/donor/:id/update-donation', async (req, res) => {
    try {
        const { lastDonation } = req.body;
        if (!lastDonation) return res.status(400).json({ success: false, message: 'Date required' });

        const donor = await Donor.findById(req.params.id);
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

        const lastDate = new Date(lastDonation);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 90); // 90 days cooling period

        donor.lastDonation = lastDate;
        donor.nextDonationEligible = nextDate;

        await donor.save();

        res.json({
            success: true,
            message: 'Dates updated',
            nextEligible: nextDate,
            lastDonation: lastDate
        });

    } catch (error) {
        console.error("❌ Error updating donor dates:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Import routes
const requestsRoutes = require('./routes/requests');

// Use routes
app.use('/', requestsRoutes);

// Patient Signup
app.post("/api/patient/signup", async (req, res) => {
    try {
        console.log("📝 Signup Request Body:", req.body); // LOGGING ADDED
        const { fullName, email, password, confirmPassword, bloodGroup, city, contactInfo, state } = req.body;

        if (!fullName || !email || !password || !bloodGroup || !city || !contactInfo || !state) { // CHECKING ALL FIELDS
            console.log("❌ Missing fields:", { fullName, email, password, bloodGroup, city, contactInfo, state });
            return res.status(400).send("All fields are required.");
        }

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
            state,
            contactInfo,
            role: 'patient'
        });

        await newPatient.save();
        console.log(`✅ New Patient registered: ${newPatient.email}`);

        req.session.userId = newPatient._id;
        req.session.role = 'patient';
        req.session.save(() => res.redirect(`/patient/${newPatient._id}`));
    } catch (err) {
        console.error("❌ Patient signup error:", err);
        res.status(500).send("Server error");
    }
});

// Donor Signup
app.post("/api/donor/signup", async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, bloodGroup, city, contactInfo, state } = req.body;

        if (!fullName || !email || !password || !bloodGroup || !city || !contactInfo || !state)
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
            state,
            contactInfo,
            role: 'donor'
        });

        await newDonor.save();
        console.log(`✅ New Donor registered: ${newDonor.email}`);

        req.session.userId = newDonor._id;
        req.session.role = 'donor';
        req.session.save(() => res.redirect(`/donor-dashboard/${newDonor._id}/dashboard`));
    } catch (err) {
        console.error("❌ Donor signup error:", err);
        res.status(500).send("Server error");
    }
});

// Hospital Signup
app.post("/api/hospital/signup", async (req, res) => {
    try {
        const { hospitalName, email, password, confirmPassword, address, city, pincode, contactInfo, fullName, state } = req.body;

        if (!hospitalName || !email || !password || !address || !city || !pincode || !contactInfo || !fullName || !state)
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
            state,
            pincode,
            contactInfo,
            fullName,
            role: 'hospital',
            locationUpdateAttempts: 3
        });

        await newHospital.save();
        console.log(`✅ New Hospital registered: ${newHospital.email}`);

        req.session.userId = newHospital._id;
        req.session.role = 'hospital';
        req.session.save(() => res.redirect(`/hospital/${newHospital._id}`));
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
        await newDonor.save();
        console.log(`✅ New Donor registered: ${newDonor.email}`);
        res.render("donor", { user: newDonor });
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
app.post("/api/donor/login", async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;
        if (!loginEmail || !loginPassword) return res.status(400).send("Email and password required.");

        const user = await Donor.findOne({ email: loginEmail });
        if (!user) return res.status(400).send("User not found.");

        const isMatch = await bcrypt.compare(loginPassword, user.password);
        if (!isMatch) return res.status(400).send("Invalid credentials.");

        // Redirect to new dashboard
        req.session.userId = user._id;
        req.session.role = 'donor';
        req.session.save(() => res.redirect(`/donor-dashboard/${user._id}/dashboard`));

    } catch (err) {
        console.error("❌ Donor login error:", err);
        res.status(500).send("Server error");
    }
});
app.post("/api/hospital/login", (req, res) => loginUser(Hospital, req, res, "hospital"));
// app.post("/api/admin/login", (req, res) => loginUser(Admin, req, res, "admin_dashboard")); // Admin dashboard view needed

// -------------------------
// Patient Functionality Routes
// -------------------------
app.post('/api/hospitals/search', async (req, res) => {
    try {
        const { state, district, bloodGroup } = req.body;

        if (!state || !district || !bloodGroup) {
            return res.status(400).send("State, district, and blood group are required.");
        }

        const hospitals = await Hospital.find({
            state: state,
            city: district,
            [`bloodStock.${bloodGroup}`]: { $gt: 0 }
        });

        res.json(hospitals);
    } catch (err) {
        console.error("❌ Hospital search error:", err);
        res.status(500).send("Server error");
    }
});

// Patient sends a request to a specific hospital
app.post('/api/request/hospital', async (req, res) => {
    try {
        const { patientId, hospitalId, bloodGroup, units } = req.body;

        if (!patientId || !hospitalId || !bloodGroup || !units) {
            return res.status(400).send("Missing required fields for blood request.");
        }

        const newRequest = new BloodRequest({
            patient: patientId,
            hospital: hospitalId,
            bloodGroup,
            units,
            status: 'pending'
        });

        await newRequest.save();

        // Link the request to the patient
        await Patient.findByIdAndUpdate(patientId, { $push: { requests: newRequest._id } });

        console.log(`✅ New blood request created: ${newRequest._id} from patient ${patientId} to hospital ${hospitalId}`);
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("❌ Hospital blood request error:", err);
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
    } catch (err) {
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
// Hospital Blood Stock Routes
// -------------------------
app.get('/api/hospitals/:hospitalId/blood-stock', async (req, res) => {
    try {
        const { hospitalId } = req.params;

        // Find the hospital
        const hospital = await Hospital.findById(hospitalId).select('bloodStock');

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        // Ensure bloodStock exists and has all required fields
        const defaultStock = {
            'A+': { units: 0 },
            'A-': { units: 0 },
            'B+': { units: 0 },
            'B-': { units: 0 },
            'AB+': { units: 0 },
            'AB-': { units: 0 },
            'O+': { units: 0 },
            'O-': { units: 0 }
        };

        // Merge with default values to ensure all blood groups exist
        const bloodStock = { ...defaultStock, ...(hospital.bloodStock || {}) };

        // Ensure each blood group has the correct structure
        Object.keys(bloodStock).forEach(group => {
            if (typeof bloodStock[group] === 'number') {
                bloodStock[group] = { units: bloodStock[group] };
            } else if (!bloodStock[group] || typeof bloodStock[group] !== 'object') {
                bloodStock[group] = { units: 0 };
            }
        });

        res.json(bloodStock);
    } catch (err) {
        console.error('❌ Error fetching blood stock:', err);
        res.status(500).json({
            error: 'Failed to fetch blood stock',
            details: err.message
        });
    }
});

// -------------------------
// Hospital Functionality Routes
// -------------------------
app.get('/api/requests/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const requests = await BloodRequest.find({ hospital: hospitalId })
            .populate('patient', 'fullName bloodGroup')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error("❌ Fetching hospital requests error:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/requests/update/:requestId', async (req, res) => {
    try {
        const { status } = req.body; // 'approved', 'rejected', or 'delivering'
        const { requestId } = req.params;

        const request = await BloodRequest.findById(requestId);
        if (!request) {
            return res.status(404).send("Request not found.");
        }

        // If the request is approved, decrease the hospital's blood stock
        if (status === 'approved' && request.status === 'pending') {
            const hospital = await Hospital.findById(request.hospital);
            if (hospital.bloodStock[request.bloodGroup] >= request.units) {
                hospital.bloodStock[request.bloodGroup] -= request.units;
                await hospital.save();
            } else {
                return res.status(400).send("Not enough blood stock to approve this request.");
            }
        }

        request.status = status;
        await request.save();

        console.log(`✅ Request ${requestId} status updated to ${status}`);
        res.json(request);
    } catch (err) {
        console.error("❌ Request update error:", err);
        res.status(500).send("Server error");
    }
});

// Update a specific blood group's stock
app.post('/api/stock/update/:hospitalId', async (req, res) => {
    try {
        const { bloodGroup, units } = req.body; // units can be positive or negative
        const { hospitalId } = req.params;

        // Validate blood group
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(bloodGroup)) {
            return res.status(400).json({ error: 'Invalid blood group' });
        }

        // Find the hospital first
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        // Initialize bloodStock if it doesn't exist
        if (!hospital.bloodStock) {
            hospital.bloodStock = {};
        }

        // Initialize the specific blood group if it doesn't exist
        if (typeof hospital.bloodStock[bloodGroup] !== 'object') {
            hospital.bloodStock[bloodGroup] = { units: 0 };
        }

        // Calculate new units, ensuring it doesn't go below 0
        const currentUnits = hospital.bloodStock[bloodGroup].units || 0;
        const newUnits = currentUnits + units;

        if (newUnits < 0) {
            return res.status(400).json({
                error: 'Insufficient stock available',
                currentStock: currentUnits,
                requestedChange: units
            });
        }

        // Update the specific blood group
        hospital.bloodStock[bloodGroup].units = newUnits;

        // Mark the bloodStock field as modified to ensure it gets saved
        hospital.markModified('bloodStock');

        // Save the updated hospital with the modified bloodStock
        const updatedHospital = await hospital.save();

        if (!updatedHospital) {
            throw new Error('Failed to save hospital data');
        }

        // Return the updated blood stock
        res.json(updatedHospital.bloodStock);
    } catch (err) {
        console.error("❌ Stock update error:", err);
        res.status(500).json({
            error: 'Failed to update blood stock',
            details: err.message
        });
    }
});

// Update all blood stock data at once
app.put('/api/hospitals/:hospitalId/blood-stock', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const updatedStock = req.body;

        console.log('📤 Received blood stock update request:', { hospitalId, updatedStock });

        // Validate the request body structure
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

        // Check if all required blood groups are present and have valid units
        const isValidUpdate = Object.entries(updatedStock).every(([group, data]) => {
            // Check if the group is valid and data is an object with units
            return validBloodGroups.includes(group) &&
                data !== null &&
                typeof data === 'object' &&
                'units' in data &&
                !isNaN(parseInt(data.units)) &&
                parseInt(data.units) >= 0;
        });

        if (!isValidUpdate) {
            console.error('❌ Invalid blood stock data:', updatedStock);
            return res.status(400).json({
                error: 'Invalid blood stock data. Must include all blood groups with non-negative units.'
            });
        }

        // Find the hospital
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            console.error('❌ Hospital not found:', hospitalId);
            return res.status(404).json({ error: 'Hospital not found' });
        }

        // Initialize bloodStock if it doesn't exist
        if (!hospital.bloodStock) {
            hospital.bloodStock = {};
        }

        // Prepare the update object with just the numbers (not objects)
        const updateObj = {};
        validBloodGroups.forEach(group => {
            if (updatedStock[group] && typeof updatedStock[group] === 'object') {
                updateObj[`bloodStock.${group}`] = parseInt(updatedStock[group].units) || 0;
            } else {
                updateObj[`bloodStock.${group}`] = 0; // Default to 0 if not provided
            }
        });

        // Update the hospital document directly with the new values
        const updatedHospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $set: updateObj },
            { new: true, runValidators: true }
        );

        if (!updatedHospital) {
            throw new Error('Failed to update hospital blood stock');
        }

        console.log('✅ Blood stock updated successfully for hospital:', hospitalId);

        res.json({
            message: 'Blood stock updated successfully',
            data: updatedHospital.bloodStock
        });

    } catch (err) {
        console.error('❌ Error updating blood stock:', err);
        res.status(500).json({
            error: 'Failed to update blood stock',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
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
// DONOR DASHBOARD ROUTES (MPA)
// -------------------------
app.get('/donor-dashboard/:id/dashboard', async (req, res) => {
    try {
        const user = await Donor.findById(req.params.id);
        if (!user) return res.status(404).send('Donor not found');

        const matchQuery = {
            status: 'pending',
            $or: [
                { bloodGroup: user.bloodGroup, state: user.state },
                { bloodGroup: 'O-', state: user.state },
                {
                    bloodGroup: 'O+', state: user.state, $or: [
                        { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                        { bloodGroup: 'AB+' }
                    ]
                }
            ]
        };
        const pendingCount = await mongoose.connection.db.collection('demorequests').countDocuments(matchQuery);

        // Calculate Stats
        const totalDonations = await DemoRequest.countDocuments({
            donorId: req.params.id,
            status: { $in: ['accepted', 'completed'] }
        });

        const lastRequest = await DemoRequest.findOne({
            donorId: req.params.id,
            status: { $in: ['accepted', 'completed'] }
        }).sort({ datetime: -1 });

        const lastDonationDate = user.lastDonation || (lastRequest ? lastRequest.datetime : null);

        // Calculate Next Eligible Date (90 days gap)
        let nextEligibleDate = null;
        if (lastDonationDate) {
            const lastDate = new Date(lastDonationDate);
            nextEligibleDate = new Date(lastDate);
            nextEligibleDate.setDate(lastDate.getDate() + 90);
        }

        // Pass _user as user for compatibility if the view uses _user
        res.render('donor/dashboard', {
            user,
            _user: user,
            pendingCount,
            totalDonations,
            lastDonationDate,
            nextEligibleDate
        });
    } catch (error) {
        console.error("❌ Donor dashboard error:", error);
        res.status(500).send('Server error');
    }
});

app.get('/donor-dashboard/:id/requests', async (req, res) => {
    try {
        const user = await Donor.findById(req.params.id);
        if (!user) return res.status(404).send('Donor not found');

        const matchQuery = {
            status: 'pending',
            $or: [
                { bloodGroup: user.bloodGroup, state: user.state },
                { bloodGroup: 'O-', state: user.state },
                {
                    bloodGroup: 'O+', state: user.state, $or: [
                        { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                        { bloodGroup: 'AB+' }
                    ]
                }
            ]
        };
        const pendingCount = await mongoose.connection.db.collection('demorequests').countDocuments(matchQuery);

        // Calculate Eligibility for View
        const lastRequest = await DemoRequest.findOne({
            donorId: req.params.id,
            status: { $in: ['accepted', 'completed'] }
        }).sort({ datetime: -1 });

        const lastDonationDate = user.lastDonation || (lastRequest ? lastRequest.datetime : null);
        let nextEligibleDate = null;
        if (lastDonationDate) {
            const lastDate = new Date(lastDonationDate);
            nextEligibleDate = new Date(lastDate);
            nextEligibleDate.setDate(lastDate.getDate() + 90);
        }

        res.render('donor/requests', { user, pendingCount, nextEligibleDate });
    } catch (error) {
        console.error("❌ Donor requests page error:", error);
        res.status(500).send('Server error');
    }
});

app.get('/donor-dashboard/:id/history', async (req, res) => {
    try {
        const user = await Donor.findById(req.params.id);
        if (!user) return res.status(404).send('Donor not found');

        const matchQuery = {
            status: 'pending',
            $or: [
                { bloodGroup: user.bloodGroup, state: user.state },
                { bloodGroup: 'O-', state: user.state },
                {
                    bloodGroup: 'O+', state: user.state, $or: [
                        { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                        { bloodGroup: 'AB+' }
                    ]
                }
            ]
        };
        const pendingCount = await mongoose.connection.db.collection('demorequests').countDocuments(matchQuery);

        res.render('donor/history', { user, pendingCount });
    } catch (error) {
        console.error("❌ Donor history page error:", error);
        res.status(500).send('Server error');
    }
});

app.get('/donor-dashboard/:id/campaigns', async (req, res) => {
    try {
        const user = await Donor.findById(req.params.id);
        if (!user) return res.status(404).send('Donor not found');

        const matchQuery = {
            status: 'pending',
            $or: [
                { bloodGroup: user.bloodGroup, state: user.state },
                { bloodGroup: 'O-', state: user.state },
                {
                    bloodGroup: 'O+', state: user.state, $or: [
                        { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                        { bloodGroup: 'AB+' }
                    ]
                }
            ]
        };
        const pendingCount = await mongoose.connection.db.collection('demorequests').countDocuments(matchQuery);

        res.render('donor/campaigns', { user, pendingCount });
    } catch (error) {
        console.error("❌ Donor campaigns page error:", error);
        res.status(500).send('Server error');
    }
});

app.get('/donor-dashboard/:id/wellness', async (req, res) => {
    try {
        const user = await Donor.findById(req.params.id);
        if (!user) return res.status(404).send('Donor not found');

        const matchQuery = {
            status: 'pending',
            $or: [
                { bloodGroup: user.bloodGroup, state: user.state },
                { bloodGroup: 'O-', state: user.state },
                {
                    bloodGroup: 'O+', state: user.state, $or: [
                        { bloodGroup: { $regex: /\+$/, $options: 'i' } },
                        { bloodGroup: 'AB+' }
                    ]
                }
            ]
        };
        const pendingCount = await mongoose.connection.db.collection('demorequests').countDocuments(matchQuery);

        res.render('donor/wellness', { user, pendingCount });
    } catch (error) {
        console.error("❌ Donor wellness page error:", error);
        res.status(500).send('Server error');
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

// Patient Dashboard
app.get("/patient", async (req, res) => {
    try {
        const patientId = req.query.patientId;
        if (!patientId) {
            return res.status(400).send('Patient ID is required');
        }

        // Get the patient from the database
        const user = await Patient.findById(patientId);
        if (!user) {
            console.error(`Patient with id ${patientId} not found`);
            return res.status(404).send('Patient not found');
        }

        res.render("patient", {
            user: user,
            title: 'Patient Dashboard - RaktSetu'
        });
    } catch (error) {
        console.error('Error rendering patient dashboard:', error);
        res.status(500).send('Server error');
    }
});

// Home Page
app.get("/", (req, res) => {
    res.render("index"); // Render your main page (index.ejs)
});

app.get("/get-started", (req, res) => {
    res.render("get-started"); // Render your main page (get-started.ejs)
});

// ... (rest of the code remains the same)
// -------------------------
// Server Start
// -------------------------
app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
);

// Add this route before the server start
app.get('/api/districts/:state', (req, res) => {
    try {
        const stateDistricts = require('./public/js/districts.js');
        const districts = stateDistricts.getDistricts(req.params.state);
        res.json(districts);
    } catch (err) {
        console.error("❌ Error fetching districts:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/demo-request', async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            sourceHospitalName, // Patient's name as source
            targetHospitalName,
            hospitalName, // For backward compatibility
            bloodGroup,
            units,
            requiredBy,
            notes,
            urgency,
            requestType = 'patient',
            status = 'pending',
            contactPerson,
            contactNumber
        } = req.body;

        // Use targetHospitalName if provided, otherwise fall back to hospitalName for backward compatibility
        const hospital = targetHospitalName || hospitalName;

        if (!patientId || !hospital || !bloodGroup || !units) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create new request with the updated schema
        const newRequest = new DemoRequest({
            // Patient information
            patientId,
            patientName: patientName || `Patient-${patientId.substring(0, 6)}`,

            // Source information (patient's name for patient requests)
            sourceHospitalName: sourceHospitalName || patientName || `Patient-${patientId.substring(0, 6)}}`,
            state: req.body.state || 'Unknown', // Add state field

            // Hospital information
            targetHospitalName: hospital,
            hospitalName: hospital, // For backward compatibility

            // Blood request details
            bloodGroup: bloodGroup.toUpperCase(),
            units: parseInt(units, 10),
            requiredBy: requiredBy ? new Date(requiredBy) : null,
            notes: notes || '',
            urgency: urgency || 'medium',

            // Request metadata
            requestType,
            status,
            contactPerson: contactPerson || patientName || `Patient-${patientId.substring(0, 6)}`,
            contactNumber: contactNumber || 'Not provided',
            datetime: new Date()
        });

        await newRequest.save();

        res.status(201).json({
            success: true,
            message: 'Blood request submitted successfully',
            request: newRequest
        });
    } catch (error) {
        console.error('Error submitting blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit blood request',
            error: error.message
        });
    }
});

// Get demo requests for a patient
app.get('/api/demo-request/patient/:patientId', async (req, res) => {
    try {
        const reqs = await DemoRequest.find({ patientId: req.params.patientId })
            .sort({ datetime: -1 });
        res.json(reqs);
    } catch (error) {
        console.error("Demo request fetch error:", error);
        res.status(500).send("Server error");
    }
});

// Get all demo requests (for admin or specific filtering on client side)
app.get('/api/demo-requests', async (req, res) => {
    try {
        const { targetHospitalName } = req.query;
        const query = {};

        // If targetHospitalName is provided, filter by it (case-insensitive)
        if (targetHospitalName) {
            query.targetHospitalName = {
                $regex: new RegExp('^' + targetHospitalName + '$', 'i')
            };
        }

        const requests = await DemoRequest.find(query)
            .select('sourceHospitalId sourceHospitalName targetHospitalId targetHospitalName bloodGroup units datetime status requestType contactPerson contactNumber priority notes')
            .sort({ datetime: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching demo requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo requests',
            error: error.message
        });
    }
});

// Get demo requests for a specific hospital (by ID)
app.get('/api/demo-request/hospital/:hospitalId', async (req, res) => {
    try {
        const requests = await DemoRequest.find({
            hospitalId: req.params.hospitalId,
            requestType: 'hospital'  // Only get hospital-type requests
        }).sort({ datetime: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching hospital requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospital requests',
            error: error.message
        });
    }
});

// Update DemoRequest status (Accept/Decline)
app.put('/api/demo-request/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'declined', 'pending', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = await DemoRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        request.status = status;

        // If accepting, assign the donor
        if (status === 'accepted' && req.body.donorId) {
            // 1. Check Eligibility Server-Side
            const donor = await Donor.findById(req.body.donorId);
            if (!donor) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            const lastAcceptedRequest = await DemoRequest.findOne({
                donorId: donor._id,
                status: { $in: ['accepted', 'completed'] }
            }).sort({ datetime: -1 });

            const lastDonationDate = donor.lastDonation || (lastAcceptedRequest ? lastAcceptedRequest.datetime : null);

            if (lastDonationDate) {
                const nextEligibleDate = new Date(lastDonationDate);
                nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);

                if (new Date() < nextEligibleDate) {
                    return res.status(403).json({
                        success: false,
                        message: `You are not eligible to donate yet. Next eligible date: ${nextEligibleDate.toLocaleDateString('en-IN')}`
                    });
                }
            }

            request.donorId = req.body.donorId;
            // Also update donor name if provided, or fetch it (optional)
            if (req.body.donorName) {
                request.donorName = req.body.donorName;
            }
        }

        await request.save();

        console.log(`✅ DemoRequest ${id} status updated to: ${status} by donor ${req.body.donorId || 'unknown'}`);
        res.json({ success: true, message: `Request ${status} successfully`, request });
    } catch (error) {
        console.error('Error updating demo request status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Patient -> Donor request (creates a demo request targeting a donor)
// API endpoint for hospitals to request blood
app.post('/api/request/hospital-blood', async (req, res) => {
    try {
        const {
            sourceHospitalId,
            sourceHospitalName,
            targetHospitalId,
            targetHospitalName,
            bloodGroup,
            units,
            contactPerson,
            contactNumber,
            priority,
            notes
        } = req.body;

        if (!sourceHospitalId || !sourceHospitalName || !targetHospitalId || !targetHospitalName ||
            !bloodGroup || !units || !contactPerson || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const newRequest = new DemoRequest({
            // Source hospital (the one making the request)
            sourceHospitalId,
            sourceHospitalName,
            // Target hospital (the one receiving the request)
            targetHospitalId,
            targetHospitalName,
            // Legacy fields (for backward compatibility)
            hospitalId: sourceHospitalId,
            hospitalName: sourceHospitalName,
            // Other fields
            bloodGroup: bloodGroup.toUpperCase(),
            units: parseInt(units, 10),
            contactPerson,
            contactNumber,
            priority: priority || 'medium',
            notes: notes || '',
            requestType: 'hospital',
            status: 'pending'
        });

        await newRequest.save();

        // Here you could add notification logic for admins/other hospitals

        res.status(201).json({
            success: true,
            message: 'Blood request submitted successfully',
            request: newRequest
        });

    } catch (error) {
        console.error('Error creating hospital blood request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing blood request',
            error: error.message
        });
    }
});

// Handle donor requests from patients
app.post('/api/request/donor', async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            sourceHospitalName, // Patient's name
            state,              // Patient's state
            donorId,
            donorName,
            targetHospitalName, // Donor's name
            bloodGroup,
            units,
            requestType = 'donor',
            status = 'pending',
            contactPerson,
            contactNumber,
            notes = ''
        } = req.body;

        if (!patientId || !donorId || !bloodGroup) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Create new request with all fields
        const newRequest = new DemoRequest({
            // Patient information
            patientId,
            patientName: patientName || `Patient-${patientId.substring(0, 6)}`,

            // Source information (patient making the request)
            sourceHospitalName: sourceHospitalName || patientName || `Patient-${patientId.substring(0, 6)}`,
            state: state || 'Unknown',

            // Target information (donor)
            donorId,
            donorName,
            targetHospitalName: targetHospitalName || donorName,

            // Request details
            bloodGroup: bloodGroup.toUpperCase(),
            units: parseInt(units) || 1,
            requestType,
            status,
            contactPerson: contactPerson || patientName || `Patient-${patientId.substring(0, 6)}`,
            contactNumber: contactNumber || 'Not provided',
            notes,
            datetime: new Date()
        });

        await newRequest.save();

        console.log(`📨 Patient ${patientId} requested donor ${donorId} for ${bloodGroup}`);

        res.status(201).json({ success: true, request: newRequest });

    } catch (err) {
        console.error('❌ Error creating donor request:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get requests accepted by a specific donor
app.get('/api/demo-request/donor/:donorId/accepted', async (req, res) => {
    try {
        const requests = await DemoRequest.find({
            donorId: req.params.donorId,
            status: { $in: ['accepted', 'completed', 'delivering'] }
        }).sort({ datetime: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching accepted requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accepted requests',
            error: error.message
        });
    }
});

// Return donors for a given state (all donors, with available ones first)
app.get('/api/donors/state/:state', async (req, res) => {
    try {
        const state = req.params.state;
        if (!state) return res.status(400).send('State is required');

        console.log(`🔍 Fetching donors for state: ${state}`);

        const donors = await Donor.find({ state: state })
            .select('fullName bloodGroup city state contactInfo lastDonation availabilityStatus')
            .sort({
                availabilityStatus: -1, // Available donors first
                lastDonation: -1        // Then sort by most recent donation date
            })
            .lean();

        console.log(`✅ Found ${donors.length} donors in ${state}`);

        // Log the first few donors for debugging
        if (donors.length > 0) {
            console.log('Sample donors:', donors.slice(0, 3).map(d => ({
                name: d.fullName,
                status: d.availabilityStatus,
                lastDonation: d.lastDonation
            })));
        }

        res.json(donors);
    } catch (err) {
        console.error('❌ Error fetching donors by state:', err);
        res.status(500).json({ error: 'Failed to fetch donors', details: err.message });
    }
});