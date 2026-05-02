require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const morgan  = require("morgan");

// ================= DATABASE =================
const sequelize = require("./config/mysql");

// ================= MODELS (load ALL before associations) =================
const User        = require("./models/User");
const Doctor      = require("./models/Doctor");
const Appointment = require("./models/Appointment");
const Test        = require("./models/Test");

// ================= ASSOCIATIONS =================
// ✅ Must be defined here, after all models are loaded,
//    so that Sequelize JOIN queries work in controllers.
Appointment.belongsTo(User,   { foreignKey: "patientId", as: "patient" });
Appointment.belongsTo(Doctor, { foreignKey: "doctorId",  as: "doctor"  });
User.hasMany(Appointment,     { foreignKey: "patientId", as: "appointments" });
Doctor.hasMany(Appointment,   { foreignKey: "doctorId",  as: "appointments" });

// ================= ROUTES =================
const userRoutes         = require("./routes/userRoutes");
const doctorRoutes       = require("./routes/doctorRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const appointmentRoutes  = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicineRoutes     = require("./routes/medicineRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const testRoutes = require("./routes/testRoutes");
// ================= MIDDLEWARE =================
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ================= DB CONNECTION & SYNC =================
sequelize.authenticate()
  .then(() => {
    console.log("MySQL Connected Successfully");
    // alter:true adds new columns (like patientName) without dropping data
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("Tables synced successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// ================= ROUTE MOUNTING =================
app.use("/api/users",         userRoutes);
app.use("/api/doctors",       doctorRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/appointments",  appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines",     medicineRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/tests", testRoutes);

// Docs
app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "api-docs.html"));
});

// Health check
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