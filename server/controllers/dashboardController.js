const Patient = require('../models/Patient');
const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Visit = require('../models/Visit');
const PatientMedicine = require('../models/PatientMedicine');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const scopeFilter = isAdmin ? {} : { addedBy: req.user._id };

    const totalPatients = await Patient.countDocuments(scopeFilter);
    const patientIds = await Patient.find(scopeFilter).distinct('_id');
    const totalSessions = await Session.countDocuments({ patient: { $in: patientIds } });
    const totalDoctors = await Doctor.countDocuments();
    const totalPrts = await User.countDocuments({ role: 'prt' });

    res.json({ totalPatients, totalSessions, totalDoctors, totalPrts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to build dashboard summary', error: err.message });
  }
};

// GET /api/dashboard/all-visit-data  ("All Visit Data" table: PRT Name | Date | Dr Name)
exports.getAllVisitData = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { addedBy: req.user._id };

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('assignedDoctor', 'doctorName')
      .populate('addedBy', 'name');

    const patientVisits = patients.map((p) => ({
      type: 'Registered Patient',
      prtName: p.addedBy?.name || '-',
      drName: p.assignedDoctor?.doctorName || 'Virtual Session',
      date: p.createdAt,
      patientId: p._id,
    }));

    const visitFilter = isAdmin ? {} : { prt: req.user._id };
    const visits = await Visit.find(visitFilter)
      .sort({ visitDate: -1 })
      .limit(200)
      .populate('doctorVisited', 'doctorName')
      .populate('prt', 'name');

    const manualVisits = visits.map((v) => ({
      type: v.reason,
      prtName: v.prt?.name || '-',
      drName: v.doctorVisited?.doctorName || 'Virtual Session',
      date: v.visitDate,
      visitId: v._id,
    }));

    const combined = [...patientVisits, ...manualVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch visit data', error: err.message });
  }
};

// POST /api/dashboard/visits  ("Update Visit" / "Add Sales Team Visit" modal)
exports.createVisit = async (req, res) => {
  try {
    const { type, doctorVisited, reason, notes, visitDate } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const visit = await Visit.create({
      prt: req.user._id,
      type: type === 'sales-team-visit' ? 'sales-team-visit' : 'visit',
      doctorVisited: doctorVisited || undefined,
      reason,
      notes,
      visitDate: visitDate || Date.now(),
    });

    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to log visit', error: err.message });
  }
};

// GET /api/dashboard/all-sessions  (Admin: "View All Session Data")
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(300)
      .populate({ path: 'patient', select: 'name patientId addedBy', populate: { path: 'addedBy', select: 'name' } })
      .populate('recordedBy', 'name');

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch session data', error: err.message });
  }
};

// GET /api/dashboard/all-medicines  (Admin: "View All Prescription Data")
exports.getAllPatientMedicines = async (req, res) => {
  try {
    const medicines = await PatientMedicine.find()
      .sort({ createdAt: -1 })
      .limit(300)
      .populate('patient', 'name patientId')
      .populate('addedBy', 'name');

    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescription data', error: err.message });
  }
};
