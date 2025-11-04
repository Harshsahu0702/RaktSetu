// -------------------------
// Rakt-Setu Backend Server
// -------------------------

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

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
});

const Patient = mongoose.model("Patient", userSchema);
const Donor = mongoose.model("Donor", userSchema);
const Hospital = mongoose.model("Hospital", userSchema);

// -------------------------
// Helper Functions
// -------------------------
const createUser = async (Model, req, res, dashboardView) => {
  try {
    const { signupName, signupEmail, signupPassword, confirmPassword } = req.body;

    if (!signupName || !signupEmail || !signupPassword)
      return res.status(400).send("All fields are required.");

    if (signupPassword !== confirmPassword)
      return res.status(400).send("Passwords do not match.");

    const existing = await Model.findOne({ email: signupEmail });
    if (existing) return res.status(400).send("User already exists.");

    const hashedPassword = await bcrypt.hash(signupPassword, 10);
    const newUser = new Model({
      fullName: signupName,
      email: signupEmail,
      password: hashedPassword,
    });

    await newUser.save();
    console.log(`✅ New ${Model.modelName} registered: ${newUser.email}`);

    // 👇 Render dashboard dynamically
    res.render(dashboardView, { name: newUser.fullName });
  } catch (err) {
    console.error(`❌ ${Model.modelName} signup error:`, err);
    res.status(500).send("Server error");
  }
};

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

    // 👇 Render dashboard dynamically
    res.render(dashboardView, { name: user.fullName });
  } catch (err) {
    console.error(`❌ ${Model.modelName} login error:`, err);
    res.status(500).send("Server error");
  }
};

// -------------------------
// Patient Routes
// -------------------------
app.post("/api/patient/signup", (req, res) =>
  createUser(Patient, req, res, "patient")
);

app.post("/api/patient/login", (req, res) =>
  loginUser(Patient, req, res, "patient")
);

// -------------------------
// Donor Routes
// -------------------------
app.post("/api/donor/signup", (req, res) =>
  createUser(Donor, req, res, "donor")
);

app.post("/api/donor/login", (req, res) =>
  loginUser(Donor, req, res, "donor")
);

// -------------------------
// Hospital Routes
// -------------------------
app.post("/api/hospital/signup", (req, res) =>
  createUser(Hospital, req, res, "hospital")
);

app.post("/api/hospital/login", (req, res) =>
  loginUser(Hospital, req, res, "hospital")
);

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
