import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MoreVertical, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { FullPageSpinner, EmptyState, SearchBar, PageHeader } from '../../components/Ui';
import Modal from '../../components/Modal';
import { TextField, SelectField } from '../../components/FormFields';

const ZONES = ['East', 'West', 'North', 'South', 'Central'];
const ROLES = ['prt', 'admin'];

export default function AdminPrts() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const addOpen = params.get('add') === '1';

  const [form, setForm] = useState({
    name: '', loginEmail: '', userEmail: '', password: '', role: 'prt', contactNumber: '',
    zone: '', state: '', hq: '', reportingManagerEmail: '', agency: '', rbm: '', team: '',
  });

  const load = useCallback(async () => {
    try {
      const [{ data: usersData }, { data: patientsData }] = await Promise.all([
        api.get('/users'),
        api.get('/patients'),
      ]);
      setUsers(usersData);
      setPatients(patientsData);
    } catch (err) {
      toast.error('Failed to load PRTs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patientsFor = (prtId) => patients.filter((p) => (p.addedBy?._id || p.addedBy) === prtId);

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  const closeModal = () => {
    params.delete('add');
    setParams(params);
  };

  const submitUser = async (e) => {
    e.preventDefault();
    const { name, loginEmail, userEmail, password } = form;
    if (!name || !loginEmail || !userEmail || !password) return toast.error('Please fill all required fields');
    if (loginEmail.toLowerCase() !== userEmail.toLowerCase()) return toast.error('Login Email and User Email must match');
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      setForm({ name: '', loginEmail: '', userEmail: '', password: '', role: 'prt', contactNumber: '', zone: '', state: '', hq: '', reportingManagerEmail: '', agency: '', rbm: '', team: '' });
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.zone?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4 pb-6">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        title="All PRTs"
        right={
          <button className="btn-primary" onClick={() => setParams({ add: '1' })}>
            Add User
          </button>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by PRT Name or Zone" />

      {filtered.length === 0 ? (
        <EmptyState title="No PRTs yet" subtitle="Add your first user to get started." />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const theirPatients = patientsFor(u._id);
            const isOpen = expandedId === u._id;
            return (
              <div key={u._id} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(u._id)}>
                    <span className="badge mb-1 inline-block bg-brand-50 text-brand-700">{u.zone || 'No Zone'}</span>
                    <p className="truncate text-sm font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">
                      {theirPatients.length} patient{theirPatients.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleExpand(u._id)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === u._id ? null : u._id);
                        }}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === u._id && (
                        <div className="absolute right-0 top-9 z-10 w-32 rounded-xl border border-slate-100 bg-white py-1 shadow-pop">
                          <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                            onClick={() => navigate(`/admin/prts/${u._id}/edit`)}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="divide-y divide-slate-50 border-t border-slate-100">
                    {theirPatients.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400">No patients registered by this PRT yet.</p>
                    ) : (
                      theirPatients.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => navigate(`/my-patients/${p._id}`)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-700">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.patientId} · {p.lungCondition}</p>
                          </div>
                          <span className="whitespace-nowrap text-xs font-medium text-brand-500">View →</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add User Modal (scrollable bottom sheet) */}
      <Modal
        open={addOpen}
        onClose={closeModal}
        title="Add User"
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitUser}>{saving ? 'Saving…' : 'Submit'}</button>
          </>
        }
      >
        <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <p className="-mt-2 text-xs text-slate-400">Please keep both email same.</p>
        <TextField label="Login Email" required type="email" value={form.loginEmail} onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))} />
        <TextField label="User Email" required type="email" value={form.userEmail} onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))} />
        <TextField label="Temporary Password" required type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
        <SelectField label="Role" required options={ROLES} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        <TextField label="Contact Number" required value={form.contactNumber} onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))} />
        <SelectField label="Zone" required options={ZONES} value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} />
        <TextField label="State" required value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
        <TextField label="HQ" required value={form.hq} onChange={(e) => setForm((f) => ({ ...f, hq: e.target.value }))} />
        <TextField label="Reporting Manager Email" required type="email" value={form.reportingManagerEmail} onChange={(e) => setForm((f) => ({ ...f, reportingManagerEmail: e.target.value }))} />
        <TextField label="Agency" value={form.agency} onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))} />
        <TextField label="RBM" value={form.rbm} onChange={(e) => setForm((f) => ({ ...f, rbm: e.target.value }))} />
        <TextField label="Team" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} />
      </Modal>
    </div>
  );
}