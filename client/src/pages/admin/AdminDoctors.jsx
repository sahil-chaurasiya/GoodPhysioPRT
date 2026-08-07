import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Phone, KeyRound } from 'lucide-react';
import api from '../../api/axios';
import { FullPageSpinner, EmptyState, SearchBar, PageHeader } from '../../components/Ui';
import Modal from '../../components/Modal';
import { TextField, SelectField } from '../../components/FormFields';

const SPECIALTIES = ['General Physician', 'Cardiologist', 'Pulmonologist', 'Orthopedic', 'Neurologist', 'Physiotherapist', 'Other'];
const ZONES = ['East', 'West', 'North', 'South', 'Central'];

export default function AdminDoctors() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [prts, setPrts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loginTarget, setLoginTarget] = useState(null); // doctor object

  const addOpen = params.get('new') === '1';
  const mapOpen = params.get('map') === '1';

  const [form, setForm] = useState({ doctorName: '', phoneNumber: '', email: '', mslCode: '', clinicLocation: '', specialty: '', zone: '' });
  const [mapForm, setMapForm] = useState({ prtId: '', doctorId: '' });
  const [loginForm, setLoginForm] = useState({ loginEmail: '', password: '' });

  const load = useCallback(async () => {
    try {
      const [d, u] = await Promise.all([api.get('/doctors'), api.get('/users?role=prt')]);
      setDoctors(d.data);
      setPrts(u.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModals = () => {
    params.delete('new');
    params.delete('map');
    setParams(params);
  };

  const submitDoctor = async (e) => {
    e.preventDefault();
    const { doctorName, phoneNumber, clinicLocation, specialty, zone } = form;
    if (!doctorName || !phoneNumber || !clinicLocation || !specialty || !zone) {
      return toast.error('Please fill all required fields');
    }
    setSaving(true);
    try {
      await api.post('/doctors', form);
      toast.success('Doctor added');
      setForm({ doctorName: '', phoneNumber: '', email: '', mslCode: '', clinicLocation: '', specialty: '', zone: '' });
      closeModals();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setSaving(false);
    }
  };

  const submitMap = async (e) => {
    e.preventDefault();
    if (!mapForm.prtId || !mapForm.doctorId) return toast.error('Select both PRT and Doctor');
    setSaving(true);
    try {
      await api.post('/doctors/map', { doctorId: mapForm.doctorId, prtId: mapForm.prtId });
      toast.success('Doctor mapped to PRT');
      setMapForm({ prtId: '', doctorId: '' });
      closeModals();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to map doctor');
    } finally {
      setSaving(false);
    }
  };

  const filtered = doctors.filter((d) => !search || d.doctorName.toLowerCase().includes(search.toLowerCase()) || d.zone.toLowerCase().includes(search.toLowerCase()));

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.loginEmail || !loginForm.password) return toast.error('Email and password are required');
    setSaving(true);
    try {
      await api.post(`/doctors/${loginTarget._id}/create-login`, loginForm);
      toast.success('Doctor portal login created');
      setLoginTarget(null);
      setLoginForm({ loginEmail: '', password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor login');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4 pb-6">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        title="Doctor"
        right={
          <button className="btn-primary" onClick={() => setParams({ new: '1' })}>
            Add New Doctor
          </button>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or zone" />

      {filtered.length === 0 ? (
        <EmptyState title="No doctors yet" subtitle="Add your first doctor to get started." />
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <div key={d._id} className="card flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{d.doctorName}</p>
                <p className="text-xs text-slate-400">{d.doctorId} · {d.specialty}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Phone className="h-3 w-3" />{d.phoneNumber}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    setLoginForm({ loginEmail: d.email || '', password: '' });
                    setLoginTarget(d);
                  }}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                  title="Create doctor portal login"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <span className="badge bg-brand-50 text-brand-700">{d.zone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Doctor Modal */}
      <Modal
        open={addOpen}
        onClose={closeModals}
        title="Add New Doctor"
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={closeModals}>Cancel</button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitDoctor}>{saving ? 'Saving…' : 'Save Doctor'}</button>
          </>
        }
      >
        <TextField label="Doctor Name" required value={form.doctorName} onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))} placeholder="Dr. Romjan Ali" />
        <TextField label="Doctor Mobile" required value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="10-digit number" />
        <TextField label="Doctor Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <TextField label="Doctor MSL Code" value={form.mslCode} onChange={(e) => setForm((f) => ({ ...f, mslCode: e.target.value }))} />
        <TextField label="Clinic / Hospital Location" required value={form.clinicLocation} onChange={(e) => setForm((f) => ({ ...f, clinicLocation: e.target.value }))} placeholder="City, HQ, or hospital address" />
        <SelectField label="Speciality" required options={SPECIALTIES} value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
        <SelectField label="Zone / Region" required options={ZONES} value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} />
      </Modal>

      {/* Map Doctor Modal */}
      <Modal
        open={mapOpen}
        onClose={closeModals}
        title="Map Doctor"
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={closeModals}>Cancel</button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitMap}>{saving ? 'Saving…' : 'Submit'}</button>
          </>
        }
      >
        <SelectField
          label="PRT Email"
          required
          options={prts.map((p) => ({ value: p._id, label: `${p.name} (${p.loginEmail})` }))}
          value={mapForm.prtId}
          onChange={(e) => setMapForm((f) => ({ ...f, prtId: e.target.value }))}
        />
        <SelectField
          label="Doctor Name"
          required
          options={doctors.map((d) => ({ value: d._id, label: `${d.doctorName} (${d.doctorId})` }))}
          value={mapForm.doctorId}
          onChange={(e) => setMapForm((f) => ({ ...f, doctorId: e.target.value }))}
        />
      </Modal>

      {/* Create Doctor Login Modal */}
      <Modal
        open={!!loginTarget}
        onClose={() => setLoginTarget(null)}
        title="Create Doctor Login"
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => setLoginTarget(null)}>Cancel</button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitLogin}>{saving ? 'Creating…' : 'Create Login'}</button>
          </>
        }
      >
        <p className="text-xs text-slate-400">
          This gives {loginTarget?.doctorName} their own portal access to view their assigned patients.
        </p>
        <TextField label="Login Email" required type="email" value={loginForm.loginEmail} onChange={(e) => setLoginForm((f) => ({ ...f, loginEmail: e.target.value }))} />
        <TextField label="Temporary Password" required value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
      </Modal>
    </div>
  );
}
