const Patient = require('../models/Patient');
const Session = require('../models/Session');
const PatientMedicine = require('../models/PatientMedicine');
const User = require('../models/User');
const generateId = require('../utils/generateId');

// Shared ownership/visibility check, mirrors the rules in getPatientById.
// Returns an error message string if access should be denied, or null if OK.
function checkPatientAccess(patient, user) {
  if (user.role === 'prt' && String(patient.addedBy) !== String(user._id)) {
    return 'You can only access patients you registered';
  }
  if (user.role === 'doctor' && String(patient.assignedDoctor) !== String(user.linkedDoctor)) {
    return 'You can only access patients assigned to you';
  }
  if (user.role === 'patient' && String(patient._id) !== String(user.linkedPatient)) {
    return 'You can only access your own profile';
  }
  return null;
}

// GET /api/patients  ("My Patients" - scoped per role, Admin sees all)
exports.getAllPatients = async (req, res) => {
  try {
    const { search, mine } = req.query;
    const filter = {};

    // Each role only ever sees the patients relevant to them:
    //  - PRT: patients they personally registered
    //  - Doctor: patients assigned to them
    //  - Patient: only their own record
    //  - Admin: everyone (unless ?mine=true, to scope to just their own)
    if (req.user.role === 'prt' || mine === 'true') {
      filter.addedBy = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.assignedDoctor = req.user.linkedDoctor;
    } else if (req.user.role === 'patient') {
      filter._id = req.user.linkedPatient;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { lungCondition: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .populate('assignedDoctor', 'doctorName specialty doctorId')
      .populate('addedBy', 'name loginEmail');

    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
};

// GET /api/patients/:id
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'doctorName specialty doctorId zone')
      .populate('addedBy', 'name loginEmail');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Scope visibility per role. Note: assignedDoctor is populated above, so
    // compare its ._id when checking the doctor-role case.
    const denyReason = checkPatientAccess(
      { _id: patient._id, addedBy: patient.addedBy?._id || patient.addedBy, assignedDoctor: patient.assignedDoctor?._id || patient.assignedDoctor },
      req.user
    );
    if (denyReason) return res.status(403).json({ message: denyReason });

    const sessions = await Session.find({ patient: patient._id }).sort({ sessionNumber: 1 });
    const medicines = await PatientMedicine.find({ patient: patient._id }).sort({ createdAt: -1 });

    res.json({ patient, sessions, medicines });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patient', error: err.message });
  }
};

// POST /api/patients  (Register a Patient — Step 2.1)
// Expects consentFormUrl already uploaded via /api/uploads
exports.createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phoneNumber,
      email,
      assignedDoctor,
      lungCondition,
      secondaryConditions,
      timeSlot,
      reasonNotJoiningOnline,
      languageForSession,
      isPatientNewOrOld,
      consentFormUrl,
      consentFormPublicId,
    } = req.body;

    if (!name || !age || !gender || !phoneNumber || !assignedDoctor || !lungCondition || !consentFormUrl) {
      return res.status(400).json({ message: 'Missing required patient fields (name, age, gender, phone, doctor, diagnosis, consent form)' });
    }

    const normalizedPhone = String(phoneNumber).trim();

    // Every patient's phone number must be distinct — it also doubles as their portal login.
    const existingPatient = await Patient.findOne({ phoneNumber: normalizedPhone });
    if (existingPatient) {
      return res.status(409).json({ message: 'A patient with this phone number is already registered' });
    }

    const patientId = await generateId(Patient, 'patientId', 'PAT', { withYear: true, padding: 4 });

    const patient = await Patient.create({
      patientId,
      name,
      age,
      gender,
      phoneNumber: normalizedPhone,
      email,
      assignedDoctor,
      lungCondition,
      secondaryConditions: Array.isArray(secondaryConditions)
        ? secondaryConditions
        : secondaryConditions
        ? String(secondaryConditions).split(',').map((s) => s.trim())
        : [],
      timeSlot,
      reasonNotJoiningOnline,
      languageForSession,
      isPatientNewOrOld: isPatientNewOrOld || 'New',
      consentFormUrl,
      consentFormPublicId,
      addedBy: req.user._id,
      addedByPrtEmail: req.user.loginEmail,
    });

    // Auto-create the patient's portal login: phone number is the username,
    // default password "123456" (patient can change it later from Me/Profile).
    let loginCreated = false;
    try {
      const existingLogin = await User.findOne({ loginEmail: normalizedPhone.toLowerCase() });
      if (!existingLogin) {
        await User.create({
          name: patient.name,
          loginEmail: normalizedPhone,
          userEmail: email || normalizedPhone,
          password: '123456',
          role: 'patient',
          linkedPatient: patient._id,
        });
        loginCreated = true;
      }
    } catch (loginErr) {
      // Don't fail patient registration if login creation hits an edge case —
      // an admin can still create it manually from the patient's page.
      console.error('Failed to auto-create patient login:', loginErr.message);
    }

    res.status(201).json({ ...patient.toObject(), loginCreated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A patient with this phone number is already registered' });
    }
    res.status(500).json({ message: 'Failed to register patient', error: err.message });
  }
};

// PUT /api/patients/:id
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Only the PRT who registered the patient (or an admin) may edit
    if (req.user.role !== 'admin' && String(patient.addedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit patients you registered' });
    }

    if (req.body.phoneNumber !== undefined) {
      const normalizedPhone = String(req.body.phoneNumber).trim();
      if (normalizedPhone !== patient.phoneNumber) {
        const existing = await Patient.findOne({ phoneNumber: normalizedPhone, _id: { $ne: patient._id } });
        if (existing) {
          return res.status(409).json({ message: 'A patient with this phone number is already registered' });
        }
      }
      req.body.phoneNumber = normalizedPhone;
    }

    const editable = [
      'name', 'age', 'gender', 'phoneNumber', 'email', 'assignedDoctor', 'lungCondition',
      'secondaryConditions', 'timeSlot', 'reasonNotJoiningOnline', 'languageForSession',
      'isPatientNewOrOld', 'consentFormUrl', 'consentFormPublicId',
    ];
    editable.forEach((f) => {
      if (req.body[f] !== undefined) patient[f] = req.body[f];
    });

    await patient.save();
    res.json(patient);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A patient with this phone number is already registered' });
    }
    res.status(500).json({ message: 'Failed to update patient', error: err.message });
  }
};

// DELETE /api/patients/:id
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (req.user.role !== 'admin' && String(patient.addedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete patients you registered' });
    }
    await Patient.findByIdAndDelete(req.params.id);
    await Session.deleteMany({ patient: req.params.id });
    await PatientMedicine.deleteMany({ patient: req.params.id });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete patient', error: err.message });
  }
};

// ---------------- Sessions (Pre/Post Vitals) ----------------

// POST /api/patients/:id/sessions  (Step 2.2: Pre-Session Vitals — creates session)
exports.createSession = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { sessionType, exerciseName, spo2Percent, heartRate, bpMmhg, remark, meetingLink } = req.body;
    if (!sessionType) {
      return res.status(400).json({ message: 'sessionType is required' });
    }
    // Consultations may skip pre-session vitals entirely; every other
    // session type still requires them.
    const vitalsProvided = spo2Percent !== undefined || heartRate !== undefined || bpMmhg;
    if (sessionType !== 'Consultation' && (spo2Percent === undefined || heartRate === undefined || !bpMmhg)) {
      return res.status(400).json({ message: 'spo2Percent, heartRate and bpMmhg are required' });
    }
    if (sessionType === 'Consultation' && vitalsProvided && (spo2Percent === undefined || heartRate === undefined || !bpMmhg)) {
      return res.status(400).json({ message: 'If recording vitals, spo2Percent, heartRate and bpMmhg are all required' });
    }

    const existingCount = await Session.countDocuments({ patient: patient._id });
    const sessionId = await generateId(Session, 'sessionId', 'SES', { withYear: false, padding: 4 });

    const session = await Session.create({
      sessionId,
      patient: patient._id,
      sessionNumber: existingCount + 1,
      sessionType,
      exerciseName,
      meetingLink,
      preVitals: { spo2Percent, heartRate, bpMmhg, remark },
      status: 'pre-only',
      recordedBy: req.user._id,
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record pre-session vitals', error: err.message });
  }
};

// PUT /api/patients/:id/sessions/:sessionId  (Step 2.3: Post-Session Vitals — completes session)
exports.updateSessionPostVitals = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, patient: req.params.id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { heartRate, bpMmhg, respirationRate, sixMwtMeters, eq5d3lScore, remark, meetingLink } = req.body;

    session.postVitals = {
      heartRate,
      bpMmhg,
      respirationRate,
      sixMwtMeters,
      eq5d3lScore,
      remark,
    };
    // Allow the PRT to add/update the join link at this stage too, if it
    // wasn't set (or needs changing) when the session was first created.
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    session.status = 'complete';
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record post-session vitals', error: err.message });
  }
};

// GET /api/patients/:id/sessions
exports.getPatientSessions = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('addedBy assignedDoctor');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const denyReason = checkPatientAccess(patient, req.user);
    if (denyReason) return res.status(403).json({ message: denyReason });

    const sessions = await Session.find({ patient: req.params.id }).sort({ sessionNumber: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
  }
};

// ---------------- Medicines attached to a patient ----------------

// POST /api/patients/:id/medicines  ("+ Add Medicine Data")
exports.addPatientMedicine = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { medicineName, dosage, frequency, notes } = req.body;
    if (!medicineName) return res.status(400).json({ message: 'medicineName is required' });

    const medicine = await PatientMedicine.create({
      patient: patient._id,
      medicineName,
      dosage,
      frequency,
      notes,
      addedBy: req.user._id,
    });

    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add medicine data', error: err.message });
  }
};

// GET /api/patients/:id/medicines
exports.getPatientMedicines = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('addedBy assignedDoctor');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const denyReason = checkPatientAccess(patient, req.user);
    if (denyReason) return res.status(403).json({ message: denyReason });

    const medicines = await PatientMedicine.find({ patient: req.params.id }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch medicine data', error: err.message });
  }
};

// ---------------- Patient login accounts ----------------

// POST /api/patients/:id/create-login  (Admin only — gives a patient portal access)
exports.createPatientLogin = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { loginEmail, password } = req.body;
    if (!loginEmail || !password) {
      return res.status(400).json({ message: 'loginEmail and password are required' });
    }

    const existing = await User.findOne({ loginEmail: loginEmail.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'A login with this email already exists' });

    const user = await User.create({
      name: patient.name,
      loginEmail: loginEmail.toLowerCase().trim(),
      userEmail: loginEmail.toLowerCase().trim(),
      password,
      role: 'patient',
      linkedPatient: patient._id,
    });

    const obj = user.toObject();
    delete obj.password;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create patient login', error: err.message });
  }
};