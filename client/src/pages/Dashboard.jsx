import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ListFilter } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, EmptyState, SearchBar } from '../components/Ui';
import Modal from '../components/Modal';
import { SelectField, TextField, TextareaField } from '../components/FormFields';

const REASONS = ['No Patient Visit', 'No Patient Eligible', 'Dr Not available', 'Other'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [prtStats, setPrtStats] = useState([]);
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [visitType, setVisitType] = useState('visit');
  const [form, setForm] = useState({ doctorVisited: '', reason: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, ps, v, d] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/users/prt-stats'),
        api.get('/dashboard/all-visit-data'),
        api.get('/doctors'),
      ]);
      setSummary(s.data);
      setPrtStats(ps.data);
      setVisits(v.data);
      setDoctors(d.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = (type) => {
    setVisitType(type);
    setForm({ doctorVisited: '', reason: '', notes: '' });
    setModalOpen(true);
  };

  const submitVisit = async (e) => {
    e.preventDefault();
    if (!form.reason) return toast.error('Reason is required');
    setSaving(true);
    try {
      await api.post('/dashboard/visits', { ...form, type: visitType });
      toast.success('Visit logged');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  const filteredVisits = visits.filter(
    (v) =>
      !search ||
      v.prtName?.toLowerCase().includes(search.toLowerCase()) ||
      v.drName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-400">Welcome back, {user?.name?.split(' ')[0]}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Patients', value: summary?.totalPatients ?? 0 },
          { label: 'Sessions', value: summary?.totalSessions ?? 0 },
          { label: 'Doctors', value: summary?.totalDoctors ?? 0 },
          { label: 'PRTs', value: summary?.totalPrts ?? 0 },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-2xl font-extrabold text-slate-900">{c.value}</p>
            <p className="text-xs font-medium text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={() => openModal('visit')} className="btn-primary w-full">
          Update Visit
        </button>
        <button onClick={() => openModal('sales-team-visit')} className="btn-secondary w-full">
          Add Sales Team Visit
        </button>
      </div>

      {/* Registration Data (PRT | Total Patients | Total Sessions) */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Registration Data</h2>
          <ListFilter className="h-4 w-4 text-slate-300" />
        </div>
        {prtStats.length === 0 ? (
          <EmptyState title="No PRT data yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                  <th className="px-4 py-2.5">PRT</th>
                  <th className="px-4 py-2.5">Total Patients</th>
                  <th className="px-4 py-2.5">Total Sessions</th>
                </tr>
              </thead>
              <tbody>
                {prtStats.map((row) => (
                  <tr key={row._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{row.prtName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.totalPatients}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.totalSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Visit Data */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">All Visit Data</h2>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by PRT or Doctor name" />
        </div>
        {filteredVisits.length === 0 ? (
          <EmptyState title="No visits logged yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                  <th className="px-4 py-2.5">PRT Name</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Dr Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.slice(0, 50).map((v, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{v.prtName}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {format(new Date(v.date), "d MMM yyyy 'at' h:mm a")}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{v.drName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={visitType === 'visit' ? 'Updated why no patient was registered' : 'Add Sales Team Visit'}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitVisit}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </>
        }
      >
        <SelectField
          label="Doctor Visited"
          value={form.doctorVisited}
          onChange={(e) => setForm((f) => ({ ...f, doctorVisited: e.target.value }))}
          options={doctors.map((d) => ({ value: d._id, label: `${d.doctorName} (${d.doctorId})` }))}
        />
        <SelectField
          label="Reason"
          required
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          options={REASONS}
        />
        <TextareaField
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional notes"
        />
      </Modal>
    </div>
  );
}
