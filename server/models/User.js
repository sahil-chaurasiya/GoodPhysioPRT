const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    prtId: { type: String, unique: true, sparse: true }, // e.g. PRT-1082
    name: { type: String, required: true, trim: true },
    loginEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'prt', 'doctor', 'patient'], default: 'prt' },

    // Only set for role: 'doctor' — links this login to its Doctor profile
    linkedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    // Only set for role: 'patient' — links this login to its Patient profile
    linkedPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },

    contactNumber: { type: String, trim: true },
    zone: { type: String, enum: ['East', 'West', 'North', 'South', 'Central', ''], default: '' },
    state: { type: String, trim: true },
    hq: { type: String, trim: true },
    reportingManagerEmail: { type: String, trim: true, lowercase: true },
    agency: { type: String, trim: true },
    rbm: { type: String, trim: true },
    team: { type: String, trim: true },
    isInactive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
