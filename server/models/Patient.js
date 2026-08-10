const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true }, // PAT-YYYY-XXXX

    // Section 1: Basic Info
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    phoneNumber: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true },

    // Section 2: Doctor & Clinical Info
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    lungCondition: { type: String, required: true, trim: true }, // Primary Diagnosis
    secondaryConditions: [{ type: String }], // Comorbidities
    timeSlot: { type: String, trim: true },
    reasonNotJoiningOnline: { type: String, trim: true },
    languageForSession: { type: String, trim: true },
    isPatientNewOrOld: { type: String, enum: ['New', 'Old'], default: 'New' },

    // Section 3: Document Upload
    consentFormUrl: { type: String, required: true },
    consentFormPublicId: { type: String },

    // Ownership
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addedByPrtEmail: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

patientSchema.index({ name: 'text', lungCondition: 'text' });

module.exports = mongoose.model('Patient', patientSchema);