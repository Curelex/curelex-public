require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// MySQL (Sequelize)
const sequelize = require("./config/mysql");

// Routes
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


// Middleware
const errorHandler = require("./middleware/errorHandler");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ================= DB CONNECTION =================
sequelize.authenticate()
  .then(() => {
    console.log("MySQL Connected Successfully");

    // Sync tables
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("Tables synced successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// ================= ROUTES =================
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/dashboard", dashboardRoutes);
// API Docs Route (optional)
app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "api-docs.html"));
});

// Test route
app.get("/", (req, res) => {
  res.send("Curelex Backend Server Running (MySQL)");
});

// Global Error Handler
app.use(errorHandler);

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});