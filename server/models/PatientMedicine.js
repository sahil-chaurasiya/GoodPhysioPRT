const mongoose = require('mongoose');

// "+ Add Medicine Data" on a patient's profile
const patientMedicineSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true }, // e.g. "1-0-1 after food"
    notes: { type: String, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientMedicine', patientMedicineSchema);
