# 🩸 RaktSetu - Bridging Life & Hope

> **"Bridging the gap between compassionate donors and life-saving needs."**

![RaktSetu Banner](https://img.shields.io/badge/Rakt-Setu-red?style=for-the-badge) 
*(Add your project banner/screenshot here)*

## 🚀 Overview
**RaktSetu** is a centralized, smart blood donation management platform designed to solve the critical issue of blood scarcity and logistical delays in emergencies. By connecting **Patients**, **Donors**, and **Hospitals** on a single unified interface, RaktSetu ensures that no life is lost due to the unavailability of blood when it is needed most.

## 💡 The Problem
- **Scarcity & Mismanagement:** Lack of real-time data on blood availability leads to panic and delays.
- **Communication Gap:** Patients often struggle to find donors or hospitals with specific blood groups nearby.
- **Logistical Hurdles:** Inefficient coordination between multiple hospitals and blood banks.

## 🛠️ The Solution: RaktSetu
RaktSetu provides a real-time, location-aware bridge between supply (Donors/Hospitals) and demand (Patients).
- **Smart Matching System:** Automatically notifies compatible donors and hospitals within the city when a request is raised.
- **Real-Time Availability:** Hospitals can manage and display their live blood stock.
- **Urgent SOS Requests:** Dedicated high-priority alerts for critical emergencies.

## ✨ Key Features

### 🏥 For Hospitals
- **Dashboard:** Manage blood inventory (`A+`, `B+`, `O-`, etc.) in real-time.
- **Request Management:** View and approve/reject blood requests from patients.
- **Stock Updates:** Easily update stock levels as donations or usages occur.

### 🩸 For Donors
- **Registration & Profile:** Sign up with blood group, location, and availability status.
- **Smart Alerts:** Receive notifications when a patient nearby needs your specific blood group.
- **Donation Tracking:** Track donation history and eligibility dates (90-day cooling period).

### 🚑 For Patients
- **Find Blood:** Search for hospitals by **State**, **District**, and **Blood Group**.
- **Raise Requests:** precise requests including units needed and urgency level.
- **SOS Button:** One-click urgent request that triggers high-priority notifications.

## 🏗️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Frontend:** EJS (Embedded JavaScript Templating), CSS3, Vanilla JS
- **Authentication:** Custom Session-based Auth (Encrypted with `bcryptjs`)
- **Key Libraries:** `express-session`, `node-fetch`, `dotenv`, `cors`

## ⚙️ Installation & Run Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YourUsername/RaktSetu.git
   cd RaktSetu
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secret_key
   ```

4. **Run the Server**
   ```bash
   npm start
   ```
   *The server will start on `http://localhost:3000`*

## 🛣️ Roadmap
- [ ] **Mobile App:** React Native application for easier donor access.
- [ ] **Geolocation Maps:** Integration with Google Maps API for live tracking.
- [ ] **AI Forecasting:** Predicative analysis to prevent stockouts before they happen.
- [ ] **Reward System:** Gamification to encourage regular donations.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
*Made with ❤️ for saving lives.*
