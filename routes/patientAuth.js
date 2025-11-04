const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(400).json({ message: "Patient not found" });

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Patient login successful", patient });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
