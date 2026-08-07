const User = require('../models/User');
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const generateId = require('../utils/generateId');

// GET /api/users  (Admin: "View All PRT Data" / "All PRTs")
exports.getAllUsers = async (req, res) => {
  try {
    const { search, zone, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (zone) filter.zone = zone;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { loginEmail: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// POST /api/users  (Admin: "Add User" / "Create Login")
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      loginEmail,
      userEmail,
      password,
      role,
      contactNumber,
      zone,
      state,
      hq,
      reportingManagerEmail,
      agency,
      rbm,
      team,
    } = req.body;

    if (!name || !loginEmail || !userEmail || !password) {
      return res.status(400).json({ message: 'Name, login email, user email and password are required' });
    }
    if (loginEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return res.status(400).json({ message: 'Login Email and User Email must match exactly' });
    }

    const existing = await User.findOne({ loginEmail: loginEmail.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'A user with this login email already exists' });

    const prtId = await generateId(User, 'prtId', 'PRT', { withYear: false, padding: 4 });

    const user = await User.create({
      prtId,
      name,
      loginEmail: loginEmail.toLowerCase().trim(),
      userEmail: userEmail.toLowerCase().trim(),
      password,
      role: role || 'prt',
      contactNumber,
      zone,
      state,
      hq,
      reportingManagerEmail,
      agency,
      rbm,
      team,
    });

    const obj = user.toObject();
    delete obj.password;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

// PUT /api/users/:id  ("Edit PRT Data")
exports.updateUser = async (req, res) => {
  try {
    const { name, loginEmail, reportingManagerEmail, zone, isInactive, contactNumber, state, hq } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (loginEmail !== undefined) user.loginEmail = loginEmail.toLowerCase().trim();
    if (reportingManagerEmail !== undefined) user.reportingManagerEmail = reportingManagerEmail;
    if (zone !== undefined) user.zone = zone;
    if (isInactive !== undefined) user.isInactive = isInactive;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (state !== undefined) user.state = state;
    if (hq !== undefined) user.hq = hq;

    await user.save();
    const obj = user.toObject();
    delete obj.password;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// GET /api/users/prt-stats  (Dashboard "Registration Data" table: PRT | Total Patients | Total Sessions)
exports.getPrtStats = async (req, res) => {
  try {
    const prts = await User.find({ role: 'prt' }).lean();

    const stats = await Promise.all(
      prts.map(async (prt) => {
        const totalPatients = await Patient.countDocuments({ addedBy: prt._id });
        const patientIds = await Patient.find({ addedBy: prt._id }).distinct('_id');
        const totalSessions = await Session.countDocuments({ patient: { $in: patientIds } });
        return {
          _id: prt._id,
          prtName: prt.name,
          zone: prt.zone,
          totalPatients,
          totalSessions,
        };
      })
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute PRT stats', error: err.message });
  }
};
