const mongoose = require('mongoose');

// Catalog of medicines (Admin Portal -> Update Medicine Data)
const medicineSchema = new mongoose.Schema(
  {
    medicineId: { type: String, unique: true }, // MED-XXXX
    name: { type: String, required: true, trim: true },
    composition: { type: String, trim: true },
    dosageForm: { type: String, trim: true }, // Tablet, Syrup, Inhaler, Injection...
    manufacturer: { type: String, trim: true },
    imageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
