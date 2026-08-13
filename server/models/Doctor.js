const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: { type: String, unique: true }, // DOC-YYYY-XXXX, auto-generated & read-only
    doctorName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    clinicLocation: { type: String, required: true, trim: true },
    specialty: {
      type: String,
      required: true,
      enum: [
        'General Physician',
        'Cardiologist',
        'Pulmonologist',
        'Orthopedic',
        'Neurologist',
        'Physiotherapist',
        'Other',
      ],
    },
    zone: { type: String, required: true, enum: ['East', 'West', 'North', 'South', 'Central'] },
    assignedPRTs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);