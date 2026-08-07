import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, EmptyState, SearchBar, PageHeader } from '../components/Ui';

export default function MyPatients() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/patients')
      .then(({ data }) => setPatients(data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.lungCondition?.toLowerCase().includes(q) ||
      p.assignedDoctor?.doctorName?.toLowerCase().includes(q)
    );
  });

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Patients"
        right={
          isAdmin && (
            <button className="btn-secondary" onClick={() => navigate('/admin/prts')}>
              Edit PRT Data
            </button>
          )
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search Patient Name, Diagnosis, or Doctor" />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" subtitle="Register your first patient from the Register a Patient tab." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <Link
              key={p._id}
              to={`/my-patients/${p._id}`}
              className="card flex items-center justify-between gap-3 p-4 transition hover:shadow-pop"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  {p.assignedDoctor?.doctorName || 'No doctor assigned'}
                </p>
                <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-400">{format(new Date(p.createdAt), "d MMM yyyy 'at' h:mm a")}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
