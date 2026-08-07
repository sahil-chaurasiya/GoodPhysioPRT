import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pill, Camera } from 'lucide-react';
import api from '../../api/axios';
import { FullPageSpinner, EmptyState, SearchBar, PageHeader, Spinner } from '../../components/Ui';
import Modal from '../../components/Modal';
import { TextField } from '../../components/FormFields';

export default function AdminMedicines() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addOpen = params.get('new') === '1';
  const [form, setForm] = useState({ name: '', composition: '', dosageForm: '', manufacturer: '', imageUrl: '' });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/medicines');
      setMedicines(data);
    } catch (err) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = () => {
    params.delete('new');
    setParams(params);
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads?purpose=medicines', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, imageUrl: data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitMedicine = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Medicine name is required');
    setSaving(true);
    try {
      await api.post('/medicines', form);
      toast.success('Medicine added');
      setForm({ name: '', composition: '', dosageForm: '', manufacturer: '', imageUrl: '' });
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSaving(false);
    }
  };

  const filtered = medicines.filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4 pb-6">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        title="Medicine Catalog"
        right={<button className="btn-primary" onClick={() => setParams({ new: '1' })}>Add New Medicine</button>}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search medicine" />

      {filtered.length === 0 ? (
        <EmptyState icon={Pill} title="No medicines yet" subtitle="Add your first medicine to the catalog." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((m) => (
            <div key={m._id} className="card p-3">
              {m.imageUrl ? (
                <img src={m.imageUrl} alt={m.name} className="mb-2 h-20 w-full rounded-lg object-cover bg-slate-50" />
              ) : (
                <div className="mb-2 grid h-20 w-full place-items-center rounded-lg bg-brand-50 text-brand-300">
                  <Pill className="h-7 w-7" />
                </div>
              )}
              <p className="truncate text-sm font-bold text-slate-800">{m.name}</p>
              <p className="truncate text-xs text-slate-400">{m.dosageForm || '-'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={closeModal}
        title="Add New Medicine"
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button className="btn-primary flex-1" disabled={saving} onClick={submitMedicine}>{saving ? 'Saving…' : 'Save Medicine'}</button>
          </>
        }
      >
        <TextField label="Medicine Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TextField label="Composition" value={form.composition} onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))} />
        <TextField label="Dosage Form" value={form.dosageForm} onChange={(e) => setForm((f) => ({ ...f, dosageForm: e.target.value }))} placeholder="Tablet, Syrup, Inhaler…" />
        <TextField label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
        <div>
          <p className="field-label">Medicine Image</p>
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="preview" className="h-28 w-full rounded-xl object-cover" />
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-slate-400">
              {uploading ? <Spinner /> : <Camera className="h-5 w-5" />}
              <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Upload image (optional)'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
