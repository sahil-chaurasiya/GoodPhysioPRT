import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Video, Activity } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, EmptyState } from '../components/Ui';

export default function PatientSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedPatient) {
      setLoading(false);
      return;
    }
    api
      .get(`/patients/${user.linkedPatient}/sessions`)
      .then(({ data }) => setSessions(data))
      .catch(() => toast.error('Failed to load your sessions'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">My Sessions</h1>
        <p className="text-sm text-slate-400">Join your online session using the link your PRT shared</p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={Video} title="No sessions scheduled yet" />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s._id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="badge bg-brand-50 text-brand-700">Session {s.sessionNumber}</span>
                <span className={`badge ${s.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {s.status === 'complete' ? 'Completed' : 'Upcoming'}
                </span>
              </div>
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Activity className="h-4 w-4 text-brand-500" />
                {s.sessionType}
                {s.exerciseName ? ` — ${s.exerciseName}` : ''}
              </p>
              <p className="mb-3 text-xs text-slate-400">{format(new Date(s.createdAt), "d MMM yyyy 'at' h:mm a")}</p>

              {s.meetingLink ? (
                <a href={s.meetingLink} target="_blank" rel="noreferrer" className="btn-primary w-full">
                  <Video className="h-4 w-4" /> Join Session
                </a>
              ) : (
                <button disabled className="btn-secondary w-full opacity-60">
                  No online link for this session
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
