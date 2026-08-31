import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Activity, FileText, Download } from 'lucide-react';
import api from '../../api/axios';
import { FullPageSpinner, EmptyState, SearchBar, PageHeader } from '../../components/Ui';

export default function AdminReports() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'medicines' ? 'medicines' : 'sessions';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]); // flattened session or medicine rows

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: allPatients } = await api.get('/patients');
      setPatients(allPatients);

      // Fetch sessions/medicines for every patient (admin-wide report)
      const detail = await Promise.all(
        allPatients.map((p) => api.get(`/patients/${p._id}`).then((r) => ({ patient: p, ...r.data })))
      );

      if (tab === 'sessions') {
        const flat = detail.flatMap((d) =>
          d.sessions.map((s) => ({
            patientName: d.patient.name,
            prtName: d.patient.addedBy?.name || '-',
            sessionNumber: s.sessionNumber,
            sessionType: s.sessionType,
            status: s.status,
            remark: [s.preVitals?.remark, s.postVitals?.remark].filter(Boolean).join(' | '),
            date: s.createdAt,
          }))
        );
        setRows(flat.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        const flat = detail.flatMap((d) =>
          d.medicines.map((m) => ({
            patientName: d.patient.name,
            prtName: d.patient.addedBy?.name || '-',
            medicineName: m.medicineName,
            dosage: m.dosage,
            frequency: m.frequency,
            date: m.createdAt,
          }))
        );
        setRows(flat.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (r) => !search || r.patientName.toLowerCase().includes(search.toLowerCase()) || r.prtName.toLowerCase().includes(search.toLowerCase())
  );

  const csvEscape = (val) => {
    const str = val === undefined || val === null ? '' : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const downloadCsv = () => {
    if (filtered.length === 0) return toast.error('No data to download');
    const headers =
      tab === 'sessions'
        ? ['Patient', 'PRT', 'Session Number', 'Session Type', 'Status', 'Remark', 'Date']
        : ['Patient', 'PRT', 'Medicine', 'Dosage', 'Frequency', 'Date'];
    const lines = [headers.map(csvEscape).join(',')];
    filtered.forEach((r) => {
      const row =
        tab === 'sessions'
          ? [r.patientName, r.prtName, r.sessionNumber, r.sessionType, r.status === 'complete' ? 'Complete' : 'Pre-only', r.remark, format(new Date(r.date), 'd MMM yyyy, h:mm a')]
          : [r.patientName, r.prtName, r.medicineName, r.dosage, r.frequency, format(new Date(r.date), 'd MMM yyyy, h:mm a')];
      lines.push(row.map(csvEscape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-6">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title={tab === 'sessions' ? 'All Session Data' : 'All Prescription Data'}
        right={
          <button className="btn-secondary text-xs" onClick={downloadCsv}>
            <Download className="h-4 w-4" /> Download Report
          </button>
        }
      />

      <div className="flex gap-2">
        <button
          onClick={() => setParams({ tab: 'sessions' })}
          className={tab === 'sessions' ? 'btn-primary flex-1 text-xs' : 'btn-secondary flex-1 text-xs'}
        >
          <Activity className="h-4 w-4" /> Sessions
        </button>
        <button
          onClick={() => setParams({ tab: 'medicines' })}
          className={tab === 'medicines' ? 'btn-primary flex-1 text-xs' : 'btn-secondary flex-1 text-xs'}
        >
          <FileText className="h-4 w-4" /> Prescriptions
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or PRT name" />

      {loading ? (
        <FullPageSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${tab} data yet`} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">PRT</th>
                {tab === 'sessions' ? (
                  <>
                    <th className="px-4 py-2.5">Session</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Remark</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2.5">Medicine</th>
                    <th className="px-4 py-2.5">Dosage</th>
                  </>
                )}
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{r.patientName}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.prtName}</td>
                  {tab === 'sessions' ? (
                    <>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">#{r.sessionNumber} — {r.sessionType}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.status === 'complete' ? 'Complete' : 'Pre-only'}</td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{r.remark || '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.medicineName}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{[r.dosage, r.frequency].filter(Boolean).join(' · ') || '-'}</td>
                    </>
                  )}
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{format(new Date(r.date), 'd MMM yyyy, h:mm a')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}