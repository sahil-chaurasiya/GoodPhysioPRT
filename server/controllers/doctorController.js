const Doctor = require('../models/Doctor');
const User = require('../models/User');
const generateId = require('../utils/generateId');

// GET /api/doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const { search, zone } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (search) {
      filter.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
      ];
    }
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 }).populate('assignedPRTs', 'name loginEmail');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: err.message });
  }
};

// GET /api/doctors/:id
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('assignedPRTs', 'name loginEmail');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctor', error: err.message });
  }
};

// POST /api/doctors  (Admin: "Add New Doctor")
exports.createDoctor = async (req, res) => {
  try {
    const { doctorName, phoneNumber, email, clinicLocation, specialty, zone } = req.body;
    if (!doctorName || !phoneNumber || !clinicLocation || !specialty || !zone) {
      return res.status(400).json({ message: 'Missing required doctor fields' });
    }

    const doctorId = await generateId(Doctor, 'doctorId', 'DOC', { withYear: true, padding: 4 });

    const doctor = await Doctor.create({
      doctorId,
      doctorName,
      phoneNumber,
      email,
      clinicLocation,
      specialty,
      zone,
    });

    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create doctor', error: err.message });
  }
};

// PUT /api/doctors/:id
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const editableFields = ['doctorName', 'phoneNumber', 'email', 'clinicLocation', 'specialty', 'zone'];
    editableFields.forEach((f) => {
      if (req.body[f] !== undefined) doctor[f] = req.body[f];
    });

    await doctor.save();
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doctor', error: err.message });
  }
};

// DELETE /api/doctors/:id
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doctor', error: err.message });
  }
};

// POST /api/doctors/map  (Admin: "Map Doctor To PRT")
exports.mapDoctorToPrt = async (req, res) => {
  try {
    const { doctorId, prtId } = req.body;
    if (!doctorId || !prtId) return res.status(400).json({ message: 'doctorId and prtId are required' });

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (!doctor.assignedPRTs.map(String).includes(String(prtId))) {
      doctor.assignedPRTs.push(prtId);
      await doctor.save();
    }

    const populated = await doctor.populate('assignedPRTs', 'name loginEmail');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to map doctor to PRT', error: err.message });
  }
};

// DELETE /api/doctors/:id/map/:prtId
exports.unmapDoctorFromPrt = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    doctor.assignedPRTs = doctor.assignedPRTs.filter((p) => String(p) !== String(req.params.prtId));
    await doctor.save();
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to unmap doctor', error: err.message });
  }
};

// POST /api/doctors/:id/create-login  (Admin only — gives a doctor portal access)
exports.createDoctorLogin = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const { loginEmail, password } = req.body;
    if (!loginEmail || !password) {
      return res.status(400).json({ message: 'loginEmail and password are required' });
    }

    const existing = await User.findOne({ loginEmail: loginEmail.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'A login with this email already exists' });

    const user = await User.create({
      name: doctor.doctorName,
      loginEmail: loginEmail.toLowerCase().trim(),
      userEmail: loginEmail.toLowerCase().trim(),
      password,
      role: 'doctor',
      linkedDoctor: doctor._id,
    });

    const obj = user.toObject();
    delete obj.password;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create doctor login', error: err.message });
  }
};