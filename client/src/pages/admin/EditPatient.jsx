import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { FullPageSpinner } from '../../components/Ui';
import { TextField, SelectField, RadioGroup, CheckboxGroup, TextareaField } from '../../components/FormFields';

const LUNG_CONDITIONS = ['COPD', 'Asthma', 'Pulmonary Fibrosis', 'Hypertension', 'Post-Stroke Rehab', 'Other'];
const COMORBIDITIES = ['Hypertension', 'Cardiac Condition', 'Diabetes', 'Obesity', 'Arthritis'];
const TIME_SLOTS = ['9:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '12:00 PM - 1:00 PM', '2:00 PM - 3:00 PM', '4:00 PM - 5:00 PM'];
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Other'];

// Admin-only — editing an existing patient's record is restricted server-side
// (routes/patientRoutes.js: PUT /:id -> authorize('admin')).
export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/patients/${id}`), api.get('/doctors')])
      .then(([{ data }, { data: docs }]) => {
        setDoctors(docs);
        const p = data.patient;
        setForm({
          name: p.name || '',
          age: p.age ?? '',
          gender: p.gender || '',
          phoneNumber: p.phoneNumber || '',
          email: p.email || '',
          assignedDoctor: p.assignedDoctor?._id || p.assignedDoctor || '',
          lungCondition: p.lungCondition || '',
          secondaryConditions: p.secondaryConditions || [],
          timeSlot: p.timeSlot || '',
          reasonNotJoiningOnline: p.reasonNotJoiningOnline || '',
          languageForSession: p.languageForSession || '',
          isPatientNewOrOld: p.isPatientNewOrOld || 'New',
        });
      })
      .catch(() => toast.error('Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender || !form.phoneNumber || !form.assignedDoctor || !form.lungCondition) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/patients/${id}`, { ...form, age: Number(form.age) });
      toast.success('Patient updated');
      navigate(`/my-patients/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      <h1 className="text-lg font-bold text-slate-900">Edit Patient</h1>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <TextField label="Patient Full Name" required value={form.name} onChange={set('name')} />
        <TextField label="Age (Years)" required type="number" min="0" value={form.age} onChange={set('age')} />
        <RadioGroup label="Gender" required options={['Male', 'Female', 'Other']} value={form.gender} onChange={set('gender')} />
        <TextField label="Phone Number" required type="tel" maxLength={10} value={form.phoneNumber} onChange={set('phoneNumber')} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} />

        <SelectField
          label="Assigned Doctor"
          required
          value={form.assignedDoctor}
          onChange={set('assignedDoctor')}
          options={doctors.map((d) => ({ value: d._id, label: `${d.doctorName} - ${d.specialty} (${d.doctorId})` }))}
        />
        <SelectField label="Lung / Primary Condition" required value={form.lungCondition} onChange={set('lungCondition')} options={LUNG_CONDITIONS} />
        <CheckboxGroup
          label="Other Health Conditions / Comorbidities"
          options={COMORBIDITIES}
          values={form.secondaryConditions}
          onChange={(vals) => setForm((f) => ({ ...f, secondaryConditions: vals }))}
        />
        <SelectField label="Time Slot Allocated" value={form.timeSlot} onChange={set('timeSlot')} options={TIME_SLOTS} />
        <TextareaField label="Why is patient not joining online session?" value={form.reasonNotJoiningOnline} onChange={set('reasonNotJoiningOnline')} placeholder="Optional" />
        <SelectField label="Language for online session" value={form.languageForSession} onChange={set('languageForSession')} options={LANGUAGES} />
        <RadioGroup label="Is patient new or old?" options={['New', 'Old']} value={form.isPatientNewOrOld} onChange={set('isPatientNewOrOld')} />

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(`/my-patients/${id}`)}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}