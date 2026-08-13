import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Video } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, EmptyState } from '../components/Ui';

export default function PatientSessions() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedPatient) {
      setLoading(false);
      return;
    }
    api
      .get(`/patients/${user.linkedPatient}/sessions`)
      .then(({ data }) => {
        // Sessions come back sorted oldest -> newest; the current session is
        // the most recently created one.
        setSession(data.length ? data[data.length - 1] : null);
      })
      .catch(() => toast.error('Failed to load your session'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Session</h1>
        <p className="text-sm text-slate-400">Join your session using the button below</p>
      </div>

      {!session ? (
        <EmptyState icon={Video} title="No session scheduled yet" />
      ) : session.meetingLink ? (
        <a href={session.meetingLink} target="_blank" rel="noreferrer" className="btn-primary w-full">
          <Video className="h-4 w-4" /> Join Now
        </a>
      ) : (
        <button disabled className="btn-secondary w-full opacity-60">
          Join Now
        </button>
      )}
    </div>
  );
}