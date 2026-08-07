import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { FullPageSpinner } from '../../components/Ui';
import { TextField, SelectField, ToggleField } from '../../components/FormFields';

const ZONES = ['East', 'West', 'North', 'South', 'Central'];

export default function EditPrt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    api
      .get(`/users/${id}`)
      .then(({ data }) =>
        setForm({
          name: data.name,
          loginEmail: data.loginEmail,
          reportingManagerEmail: data.reportingManagerEmail || '',
          zone: data.zone || '',
          isInactive: data.isInactive,
        })
      )
      .catch(() => toast.error('Failed to load PRT'))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${id}`, form);
      toast.success('PRT data updated');
      navigate('/admin/prts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update PRT');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Edit PRT Data</h1>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <TextField label="PRT Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TextField label="Email" required type="email" value={form.loginEmail} onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))} />
        <TextField label="PRT Manager Email" type="email" value={form.reportingManagerEmail} onChange={(e) => setForm((f) => ({ ...f, reportingManagerEmail: e.target.value }))} />
        <SelectField label="Zone" options={ZONES} value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} />
        <ToggleField label="Is Inactive" checked={form.isInactive} onChange={(v) => setForm((f) => ({ ...f, isInactive: v }))} />

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/admin/prts')}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}
