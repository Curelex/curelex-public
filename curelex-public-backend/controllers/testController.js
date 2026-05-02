const Test = require("../models/Test");
const { Op } = require("sequelize");

// GET /api/tests/doctor/:doctorId
const getDoctorTests = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const tests = await Test.findAll({
      where: {
        [Op.or]: [
          { doctorId: doctorId },
          { doctorId: null }
        ]
      },
      order: [["createdAt", "DESC"]]
    });
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tests/doctor/add
const addDoctorTest = async (req, res) => {
  try {
    const { name, category, doctorId } = req.body;
    if (!name || !doctorId) {
      return res.status(400).json({ success: false, message: "Name and doctorId are required" });
    }
    const test = await Test.create({ name, category: category || "Pathology", doctorId });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/tests/doctor/:id
const deleteDoctorTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findByPk(id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    await test.destroy();
    res.json({ success: true, message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDoctorTests, addDoctorTest, deleteDoctorTest };