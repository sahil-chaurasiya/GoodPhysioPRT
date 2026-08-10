const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, unique: true }, // SES-XXXX
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    sessionNumber: { type: Number, required: true },
    sessionType: {
      type: String,
      required: true,
      enum: ['Physical Session', 'Online Session', 'Consultation'],
    },
    exerciseName: { type: String, trim: true },

    // Online session join link — entered by the PRT on the session form,
    // surfaced to the patient as a "Join" button.
    meetingLink: { type: String, trim: true },

    preVitals: {
      // Not schema-required: a Consultation session can skip pre-vitals
      // entirely (see createSession's conditional check for the other types).
      spo2Percent: { type: Number },
      heartRate: { type: Number },
      bpMmhg: { type: String }, // SYS/DIA
    },

    postVitals: {
      heartRate: { type: Number },
      bpMmhg: { type: String },
      respirationRate: { type: Number },
      sixMwtMeters: { type: Number },
      eq5d3lScore: { type: String }, // 5-digit string e.g. 32132
    },

    status: { type: String, enum: ['pre-only', 'complete'], default: 'pre-only' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);