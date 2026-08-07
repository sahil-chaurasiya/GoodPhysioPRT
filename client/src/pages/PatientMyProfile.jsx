import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, EmptyState } from '../components/Ui';

export default function PatientMyProfile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedPatient) {
      setLoading(false);
      return;
    }
    api
      .get(`/patients/${user.linkedPatient}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load your profile'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <FullPageSpinner />;

  if (!data) {
    return (
      <EmptyState
        title="No profile found"
        subtitle="Your account isn't linked to a patient record yet. Please contact your PRT or clinic admin."
      />
    );
  }

  const { patient } = data;

  const gridItems = [
    ['Patient ID', patient.patientId],
    ['Age', `${patient.age} Yrs`],
    ['Gender', patient.gender],
    ['Phone Number', patient.phoneNumber],
    ['Doctor', patient.assignedDoctor?.doctorName || '-'],
    ['Doctor Specialty', patient.assignedDoctor?.specialty || '-'],
    ['Primary Diagnosis', patient.lungCondition],
    ['Secondary Conditions', patient.secondaryConditions?.join(', ') || 'None'],
    ['Time Slot', patient.timeSlot || '-'],
    ['Language for Session', patient.languageForSession || '-'],
    ['Registered On', format(new Date(patient.createdAt), 'd MMM yyyy, h:mm a')],
    ['Registered By', patient.addedBy?.name || '-'],
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">My Profile</p>
        <h1 className="text-xl font-extrabold text-slate-900">{patient.name}</h1>
        <p className="text-xs text-slate-400">These details were entered by your PRT or clinic admin.</p>
      </div>

      <div className="card divide-y divide-slate-50 px-4">
        {gridItems.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="max-w-[60%] text-right font-medium text-slate-700">{value}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="field-label">My Consent Form</p>
        <a href={patient.consentFormUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-slate-200">
          <img src={patient.consentFormUrl} alt="Consent form" className="w-full max-h-80 bg-slate-50 object-contain" />
        </a>
      </div>
    </div>
  );
}
