const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");

router.post("/hospitallogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hospital = await Hospital.findOne({ email });
    if (!hospital) return res.status(400).json({ message: "Hospital not found" });

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Hospital login successful", hospital });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
