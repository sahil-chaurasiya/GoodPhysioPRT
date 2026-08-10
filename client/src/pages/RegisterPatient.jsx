import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { TextField, SelectField, RadioGroup, CheckboxGroup, TextareaField } from '../components/FormFields';
import { Spinner } from '../components/Ui';

const COMORBIDITIES = ['Hypertension', 'Cardiac Condition', 'Diabetes', 'Obesity', 'Arthritis'];
const TIME_SLOTS = ['9:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '12:00 PM - 1:00 PM', '2:00 PM - 3:00 PM', '4:00 PM - 5:00 PM'];
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Other'];
const SESSION_TYPES = ['Physical Session', 'Online Session', 'Consultation'];

const STEPS = ['Basic Info', 'Doctor & Clinical', 'Consent Upload', 'Pre-Session Vitals', 'Post-Session Vitals'];

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);
  const [createdSession, setCreatedSession] = useState(null);
  // null = not yet decided, 'skip' = end after this session (no vitals), 'record' = fill in vitals
  const [vitalsChoice, setVitalsChoice] = useState(null);

  const [form, setForm] = useState({
    // Basic Info
    name: '', age: '', gender: '', phoneNumber: '', email: '',
    // Doctor & Clinical
    assignedDoctor: '', lungCondition: '', secondaryConditions: [], timeSlot: '',
    reasonNotJoiningOnline: '', languageForSession: '', isPatientNewOrOld: 'New',
    // Consent
    consentFormUrl: '', consentFormPublicId: '',
    // Pre vitals
    sessionType: '', exerciseName: '', spo2Percent: '', heartRate: '', bpMmhg: '', meetingLink: '',
    // Post vitals
    postHeartRate: '', postBpMmhg: '', respirationRate: '', sixMwtMeters: '', eq5d3lScore: '',
  });

  useEffect(() => {
    api.get('/doctors').then(({ data }) => setDoctors(data)).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const isConsultation = form.sessionType === 'Consultation';
  const needsVitalsChoice = isConsultation && vitalsChoice === null;
  const skippingVitals = isConsultation && vitalsChoice === 'skip';

  const handleSessionTypeChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, sessionType: value }));
    setVitalsChoice(null);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.age || !form.gender || !form.phoneNumber) {
        toast.error('Please fill all required fields');
        return false;
      }
    }
    if (step === 1) {
      if (!form.assignedDoctor || !form.lungCondition) {
        toast.error('Please select a doctor and primary condition');
        return false;
      }
    }
    if (step === 2 && !form.consentFormUrl) {
      toast.error('Please upload the patient consent form');
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads?purpose=consent-forms', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, consentFormUrl: data.url, consentFormPublicId: data.publicId }));
      toast.success('Consent form uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Check your Cloudinary credentials in server/.env');
    } finally {
      setUploading(false);
    }
  };

  // Step 2.1 -> Save & Proceed to Session Vitals
  const submitPatient = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/patients', {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        phoneNumber: form.phoneNumber,
        email: form.email,
        assignedDoctor: form.assignedDoctor,
        lungCondition: form.lungCondition,
        secondaryConditions: form.secondaryConditions,
        timeSlot: form.timeSlot,
        reasonNotJoiningOnline: form.reasonNotJoiningOnline,
        languageForSession: form.languageForSession,
        isPatientNewOrOld: form.isPatientNewOrOld,
        consentFormUrl: form.consentFormUrl,
        consentFormPublicId: form.consentFormPublicId,
      });
      setCreatedPatient(data);
      toast.success('Patient registered — now record pre-session vitals');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2.2 -> Start Session & Record Post-Vitals
  const submitPreVitals = async () => {
    if (!form.sessionType) {
      toast.error('Please select a session type');
      return;
    }
    if (isConsultation && vitalsChoice === null) {
      toast.error('Please confirm whether to record vitals for this consultation');
      return;
    }
    if (!skippingVitals && (!form.spo2Percent || !form.heartRate || !form.bpMmhg)) {
      toast.error('Please fill all required vitals');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/patients/${createdPatient._id}/sessions`, {
        sessionType: form.sessionType,
        exerciseName: form.exerciseName,
        spo2Percent: form.spo2Percent ? Number(form.spo2Percent) : undefined,
        heartRate: form.heartRate ? Number(form.heartRate) : undefined,
        bpMmhg: form.bpMmhg,
        meetingLink: form.meetingLink,
      });
      setCreatedSession(data);
      if (skippingVitals) {
        toast.success('Consultation saved — patient registration complete!');
        navigate('/my-patients');
      } else {
        toast.success('Pre-session vitals saved');
        setStep(4);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2.3 -> Complete Patient Registration & Session Log
  const submitPostVitals = async () => {
    setSubmitting(true);
    try {
      await api.put(`/patients/${createdPatient._id}/sessions/${createdSession._id}`, {
        heartRate: form.postHeartRate ? Number(form.postHeartRate) : undefined,
        bpMmhg: form.postBpMmhg,
        respirationRate: form.respirationRate ? Number(form.respirationRate) : undefined,
        sixMwtMeters: form.sixMwtMeters ? Number(form.sixMwtMeters) : undefined,
        eq5d3lScore: form.eq5d3lScore,
      });
      toast.success('Patient registration & session log complete!');
      navigate('/my-patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post-session vitals');
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === 1) return setStep(2);
    if (step === 2) return submitPatient();
    setStep((s) => s + 1);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Register a Patient</h1>
        <p className="text-sm text-slate-400">{STEPS[step]}</p>
      </div>

      {/* Step progress */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="card p-5 space-y-4">
        {step === 0 && (
          <>
            <TextField label="Patient Full Name" required value={form.name} onChange={set('name')} placeholder="e.g. Jaynal Hafiz" />
            <TextField label="Age (Years)" required type="number" min="0" value={form.age} onChange={set('age')} placeholder="e.g. 66" />
            <RadioGroup label="Gender" required options={['Male', 'Female', 'Other']} value={form.gender} onChange={set('gender')} />
            <TextField label="Phone Number" required type="tel" maxLength={10} value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="10-digit number" />
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="Optional" />
          </>
        )}

        {step === 1 && (
          <>
            <SelectField
              label="Select a Doctor"
              required
              value={form.assignedDoctor}
              onChange={set('assignedDoctor')}
              options={doctors.map((d) => ({ value: d._id, label: `${d.doctorName} - ${d.specialty} (${d.doctorId})` }))}
            />
            <TextField label="Lung / Primary Condition" required value={form.lungCondition} onChange={set('lungCondition')} placeholder="e.g. COPD, Asthma, Hypertension" />
            <CheckboxGroup
              label="Other Health Conditions / Comorbidities"
              options={COMORBIDITIES}
              values={form.secondaryConditions}
              onChange={(vals) => setForm((f) => ({ ...f, secondaryConditions: vals }))}
            />
            <SelectField label="Time Slot Allocated" value={form.timeSlot} onChange={set('timeSlot')} options={TIME_SLOTS} />
            <TextareaField
              label="Why is patient not joining online session?"
              value={form.reasonNotJoiningOnline}
              onChange={set('reasonNotJoiningOnline')}
              placeholder="Optional"
            />
            <SelectField label="Language for online session" value={form.languageForSession} onChange={set('languageForSession')} options={LANGUAGES} />
            <RadioGroup label="Is patient new or old?" options={['New', 'Old']} value={form.isPatientNewOrOld} onChange={set('isPatientNewOrOld')} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="field-label field-required">Upload Patient Consent Form</p>
            {form.consentFormUrl ? (
              <div className="space-y-3">
                <img src={form.consentFormUrl} alt="Consent form preview" className="max-h-64 w-full rounded-xl border border-slate-200 object-contain bg-slate-50" />
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Uploaded to Cloudinary
                </div>
                <label className="btn-secondary w-full cursor-pointer">
                  Replace file
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-slate-400 hover:border-brand-300 hover:text-brand-500">
                {uploading ? <Spinner /> : <Camera className="h-8 w-8" />}
                <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Take a picture or choose a file'}</span>
                <span className="text-xs">JPG, PNG or PDF</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
              Current Session No: 1
            </div>
            <SelectField label="Session Type" required value={form.sessionType} onChange={handleSessionTypeChange} options={SESSION_TYPES} />

            {needsVitalsChoice && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2.5">
                <p className="text-sm font-medium text-amber-800">
                  Vitals aren't necessary for a consultation. Do you want to end registration here, or proceed to fill out vitals?
                </p>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setVitalsChoice('skip')}>
                    End Here
                  </button>
                  <button type="button" className="btn-primary flex-1" onClick={() => setVitalsChoice('record')}>
                    Proceed with Vitals
                  </button>
                </div>
              </div>
            )}

            {!needsVitalsChoice && !skippingVitals && (
              <>
                <TextField label="Exercise / Activity Name" value={form.exerciseName} onChange={set('exerciseName')} placeholder="e.g. Mobility & Breathing Exercises" />
                <TextField label="SPO2 (Pre-Session) %" required type="number" value={form.spo2Percent} onChange={set('spo2Percent')} placeholder="e.g. 98" />
                <TextField label="Heart Rate (Pre-Session) BPM" required type="number" value={form.heartRate} onChange={set('heartRate')} placeholder="e.g. 75" />
                <TextField label="BP (Pre-Session) mmHg" required value={form.bpMmhg} onChange={set('bpMmhg')} placeholder="SYS/DIA e.g. 125/86" />
                <TextField
                  label="Meeting / Join Link"
                  value={form.meetingLink}
                  onChange={set('meetingLink')}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
                <p className="-mt-2 text-xs text-slate-400">Optional — shown to the patient as a "Join" button for this session.</p>
              </>
            )}

            {skippingVitals && (
              <p className="text-xs text-slate-400">Vitals will be skipped for this consultation. Click below to complete registration.</p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <TextField label="Heart Rate (Post-Session) BPM" required type="number" value={form.postHeartRate} onChange={set('postHeartRate')} placeholder="e.g. 85" />
            <TextField label="BP (Post-Session) mmHg" required value={form.postBpMmhg} onChange={set('postBpMmhg')} placeholder="SYS/DIA e.g. 130/88" />
            <TextField label="Post-Respiration Rate" type="number" value={form.respirationRate} onChange={set('respirationRate')} placeholder="Breaths/minute" />
            <TextField label="6MWT / Capacity Test (meters)" type="number" value={form.sixMwtMeters} onChange={set('sixMwtMeters')} placeholder="Distance in 6 minutes" />
            <TextField
              label="EQ5D3L Health Index Score"
              maxLength={5}
              value={form.eq5d3lScore}
              onChange={set('eq5d3lScore')}
              placeholder="e.g. 32132"
            />
            <p className="text-xs text-slate-400">
              Example: 32132 → 3 Mobility, 2 Self-Care, 1 Usual Activity, 3 Pain/Discomfort, 2 Anxiety/Depression
            </p>
          </>
        )}
      </div>

      <div className="flex gap-3 pb-4">
        {step > 0 && step < 3 && (
          <button className="btn-secondary flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < 3 && (
          <button className="btn-primary flex-1" onClick={next} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 2 ? 'Save & Proceed to Session Vitals' : 'Continue'}
          </button>
        )}
        {step === 3 && (
          <button className="btn-primary flex-1" onClick={submitPreVitals} disabled={submitting || needsVitalsChoice}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : skippingVitals ? (
              'Complete Registration'
            ) : (
              'Start Session & Record Post-Vitals'
            )}
          </button>
        )}
        {step === 4 && (
          <button className="btn-primary flex-1" onClick={submitPostVitals} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Registration & Session Log'}
          </button>
        )}
      </div>
    </div>
  );
}