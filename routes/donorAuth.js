const express = require("express");
const router = express.Router();
const Donor = require("../models/Donor");
const bcrypt = require("bcryptjs");

router.post("/donorsignup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const donor = await Donor.findOne({ email });
    if (!donor) return res.status(400).json({ message: "Donor not found" });

    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Donor login successful", donor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
