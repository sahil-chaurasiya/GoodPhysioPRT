const mongoose = require('mongoose');

// Covers "Update Visit" and "Add Sales Team Visit" buttons on the Dashboard —
// used to log a field visit even when no patient was registered (e.g. doctor
// unavailable, no eligible patient, holiday, leave etc.)
const visitSchema = new mongoose.Schema(
  {
    prt: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['visit', 'sales-team-visit'], default: 'visit' },
    doctorVisited: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    reason: {
      type: String,
      enum: ['No Patient Visit', 'No Patient Eligible', 'Dr Not available', 'Registered Patient', 'Other'],
      required: true,
    },
    notes: { type: String, trim: true },
    visitDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);
