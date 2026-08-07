const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const Medicine = require('../models/Medicine');
const PatientMedicine = require('../models/PatientMedicine');
const Visit = require('../models/Visit');

const PLACEHOLDER_CONSENT_IMG = 'https://placehold.co/600x800/e0e4ff/4a3fe0?text=Patient+Consent+Form';
const PLACEHOLDER_MEDICINE_IMG = 'https://placehold.co/400x400/eef1ff/4a3fe0?text=Medicine';

/**
 * Ensures a default admin account exists so you can log in on first run.
 */
async function seedAdmin() {
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) return adminExists;

  const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@cipla.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  const admin = await User.create({
    prtId: 'ADMIN-0001',
    name,
    loginEmail: email,
    userEmail: email,
    password,
    role: 'admin',
    zone: 'Central',
  });

  console.log('🌱 Seeded default admin account:');
  console.log(`   Login Email: ${email}`);
  console.log(`   Password:    ${password}`);
  return admin;
}

/**
 * Seeds sample PRTs, Doctors, Patients, Sessions, Medicines and one login
 * account per role (admin / prt / doctor / patient) so the app is fully
 * explorable right after first boot. Only runs once — skipped if any
 * Doctor already exists (i.e. the DB isn't fresh).
 */
async function seedSampleData(admin) {
  const alreadySeeded = await Doctor.countDocuments();
  if (alreadySeeded > 0) return;

  console.log('🌱 Seeding sample data (PRTs, Doctors, Patients, Sessions, Medicines)...');

  // ---------------- PRTs ----------------
  const prt1 = await User.create({
    prtId: 'PRT-1001',
    name: 'Alisha Verma',
    loginEmail: 'prt1@cipla.com',
    userEmail: 'prt1@cipla.com',
    password: 'Prt@123',
    role: 'prt',
    contactNumber: '9876500001',
    zone: 'West',
    state: 'Maharashtra',
    hq: 'Mumbai',
    reportingManagerEmail: admin.loginEmail,
    team: 'Field Team A',
  });

  const prt2 = await User.create({
    prtId: 'PRT-1002',
    name: 'Rohan Mehta',
    loginEmail: 'prt2@cipla.com',
    userEmail: 'prt2@cipla.com',
    password: 'Prt@123',
    role: 'prt',
    contactNumber: '9876500002',
    zone: 'North',
    state: 'Delhi',
    hq: 'New Delhi',
    reportingManagerEmail: admin.loginEmail,
    team: 'Field Team B',
  });

  // ---------------- Doctors ----------------
  const doctor1 = await Doctor.create({
    doctorId: 'DOC-2026-0001',
    doctorName: 'Dr. Sanjeev Kumar',
    phoneNumber: '9820011148',
    email: 'sanjeev.kumar@example.com',
    mslCode: 'CIP1148162',
    clinicLocation: 'Lilavati Hospital, Mumbai',
    specialty: 'Cardiologist',
    zone: 'West',
    assignedPRTs: [prt1._id],
  });

  const doctor2 = await Doctor.create({
    doctorId: 'DOC-2026-0002',
    doctorName: 'Dr. Kirti Kadian',
    phoneNumber: '9820011149',
    email: 'kirti.kadian@example.com',
    mslCode: 'CLX0184032',
    clinicLocation: 'Fortis Hospital, New Delhi',
    specialty: 'Pulmonologist',
    zone: 'North',
    assignedPRTs: [prt2._id],
  });

  const doctor3 = await Doctor.create({
    doctorId: 'DOC-2026-0003',
    doctorName: 'Dr. Arpit Bhargava',
    phoneNumber: '9820011150',
    email: 'arpit.bhargava@example.com',
    mslCode: 'CIP4835207',
    clinicLocation: 'Apollo Hospital, Chennai',
    specialty: 'Physiotherapist',
    zone: 'South',
    assignedPRTs: [prt1._id],
  });

  // Give Dr. Sanjeev Kumar a login to the Doctor portal
  const doctorUser = await User.create({
    name: doctor1.doctorName,
    loginEmail: 'doctor1@cipla.com',
    userEmail: 'doctor1@cipla.com',
    password: 'Doctor@123',
    role: 'doctor',
    linkedDoctor: doctor1._id,
  });

  // ---------------- Patients ----------------
  const patient1 = await Patient.create({
    patientId: 'PAT-2026-0001',
    name: 'Jaynal Hafiz',
    age: 66,
    gender: 'Male',
    phoneNumber: '9949531644',
    email: 'jaynal.hafiz@example.com',
    assignedDoctor: doctor1._id,
    lungCondition: 'COPD',
    secondaryConditions: ['Hypertension', 'Cardiac Condition'],
    timeSlot: '10:30 AM - 11:30 AM',
    languageForSession: 'Hindi',
    isPatientNewOrOld: 'Old',
    consentFormUrl: PLACEHOLDER_CONSENT_IMG,
    addedBy: prt1._id,
    addedByPrtEmail: prt1.loginEmail,
  });

  const patient2 = await Patient.create({
    patientId: 'PAT-2026-0002',
    name: 'Sushil Sharma',
    age: 54,
    gender: 'Male',
    phoneNumber: '9911022334',
    email: 'sushil.sharma@example.com',
    assignedDoctor: doctor2._id,
    lungCondition: 'Asthma',
    secondaryConditions: ['Diabetes'],
    timeSlot: '2:00 PM - 3:00 PM',
    languageForSession: 'English',
    isPatientNewOrOld: 'New',
    consentFormUrl: PLACEHOLDER_CONSENT_IMG,
    addedBy: prt2._id,
    addedByPrtEmail: prt2.loginEmail,
  });

  const patient3 = await Patient.create({
    patientId: 'PAT-2026-0003',
    name: 'Karina Khatun',
    age: 41,
    gender: 'Female',
    phoneNumber: '9933221100',
    email: 'karina.khatun@example.com',
    assignedDoctor: doctor3._id,
    lungCondition: 'Post-Stroke Rehab',
    secondaryConditions: ['Arthritis'],
    timeSlot: '9:00 AM - 10:00 AM',
    languageForSession: 'Tamil',
    isPatientNewOrOld: 'New',
    consentFormUrl: PLACEHOLDER_CONSENT_IMG,
    addedBy: prt1._id,
    addedByPrtEmail: prt1.loginEmail,
  });

  // Give Jaynal Hafiz a login to the Patient portal
  await User.create({
    name: patient1.name,
    loginEmail: 'patient1@cipla.com',
    userEmail: 'patient1@cipla.com',
    password: 'Patient@123',
    role: 'patient',
    linkedPatient: patient1._id,
  });

  // ---------------- Sessions ----------------
  // Patient 1 — one completed session, one upcoming (pre-only) session with a join link
  await Session.create({
    sessionId: 'SES-1001',
    patient: patient1._id,
    sessionNumber: 1,
    sessionType: 'Assessment',
    exerciseName: 'Initial Mobility & Breathing Assessment',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    preVitals: { spo2Percent: 96, heartRate: 78, bpMmhg: '128/84' },
    postVitals: { heartRate: 88, bpMmhg: '132/86', respirationRate: 16, sixMwtMeters: 320, eq5d3lScore: '21121' },
    status: 'complete',
    recordedBy: prt1._id,
  });

  await Session.create({
    sessionId: 'SES-1002',
    patient: patient1._id,
    sessionNumber: 2,
    sessionType: 'Physical Rehab',
    exerciseName: 'Breathing & Endurance Exercises',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    preVitals: { spo2Percent: 97, heartRate: 75, bpMmhg: '125/86' },
    status: 'pre-only',
    recordedBy: prt1._id,
  });

  // Patient 2 — one completed session, no online link (in-person)
  await Session.create({
    sessionId: 'SES-1003',
    patient: patient2._id,
    sessionNumber: 1,
    sessionType: 'Follow-up',
    exerciseName: 'Inhaler Technique Review',
    preVitals: { spo2Percent: 98, heartRate: 72, bpMmhg: '120/80' },
    postVitals: { heartRate: 80, bpMmhg: '122/82', respirationRate: 15, sixMwtMeters: 380, eq5d3lScore: '11111' },
    status: 'complete',
    recordedBy: prt2._id,
  });

  // Patient 3 — upcoming session with a join link
  await Session.create({
    sessionId: 'SES-1004',
    patient: patient3._id,
    sessionNumber: 1,
    sessionType: 'Assessment',
    exerciseName: 'Post-Stroke Mobility Assessment',
    meetingLink: 'https://meet.google.com/pqr-stuv-wxy',
    preVitals: { spo2Percent: 95, heartRate: 82, bpMmhg: '130/88' },
    status: 'pre-only',
    recordedBy: prt1._id,
  });

  // ---------------- Medicine catalog ----------------
  const med1 = await Medicine.create({
    medicineId: 'MED-1001',
    name: 'Montair LC',
    composition: 'Montelukast 10mg + Levocetirizine 5mg',
    dosageForm: 'Tablet',
    manufacturer: 'Cipla',
    imageUrl: PLACEHOLDER_MEDICINE_IMG,
    createdBy: admin._id,
  });

  await Medicine.create({
    medicineId: 'MED-1002',
    name: 'Asthalin Inhaler',
    composition: 'Salbutamol 100mcg',
    dosageForm: 'Inhaler',
    manufacturer: 'Cipla',
    imageUrl: PLACEHOLDER_MEDICINE_IMG,
    createdBy: admin._id,
  });

  await Medicine.create({
    medicineId: 'MED-1003',
    name: 'Duolin Respules',
    composition: 'Ipratropium + Levosalbutamol',
    dosageForm: 'Respule',
    manufacturer: 'Cipla',
    imageUrl: PLACEHOLDER_MEDICINE_IMG,
    createdBy: admin._id,
  });

  // ---------------- Medicine prescribed to patients ----------------
  await PatientMedicine.create({
    patient: patient1._id,
    medicineName: med1.name,
    dosage: '10mg',
    frequency: '0-0-1 after dinner',
    notes: 'Continue for 3 months, review at next session.',
    addedBy: prt1._id,
  });

  await PatientMedicine.create({
    patient: patient2._id,
    medicineName: 'Asthalin Inhaler',
    dosage: '2 puffs',
    frequency: 'As needed for breathlessness',
    addedBy: prt2._id,
  });

  // ---------------- Visits (no-patient-registered field log) ----------------
  await Visit.create({
    prt: prt1._id,
    type: 'visit',
    doctorVisited: doctor1._id,
    reason: 'Dr Not available',
    notes: 'Doctor was in surgery, will revisit tomorrow.',
    visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  await Visit.create({
    prt: prt2._id,
    type: 'sales-team-visit',
    doctorVisited: doctor2._id,
    reason: 'No Patient Eligible',
    visitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });

  console.log('✅ Sample data seeded:');
  console.log('   PRT logins:      prt1@cipla.com / Prt@123   (and prt2@cipla.com / Prt@123)');
  console.log('   Doctor login:    doctor1@cipla.com / Doctor@123');
  console.log('   Patient login:   patient1@cipla.com / Patient@123');
}

/**
 * Full seed entrypoint — called automatically on server start (see
 * server.js), and can also be run standalone via `npm run seed`.
 */
async function seedAll() {
  try {
    const admin = await seedAdmin(); // always resolves to a valid admin doc, new or existing
    await seedSampleData(admin);
    console.log('   ⚠️  Please change seeded passwords after first login.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  }
}

module.exports = seedAll;

// Allow this file to be run standalone: `npm run seed` (from server/)
if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');

  (async () => {
    await connectDB();
    await seedAll();
    await mongoose.connection.close();
    console.log('Done. Connection closed.');
    process.exit(0);
  })();
}
