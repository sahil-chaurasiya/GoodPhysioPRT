import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Grid3x3, ClipboardList, Activity, FileText, Pill, ListPlus, KeyRound, Settings2 } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Update Doctor Data',
    buttons: [
      { label: 'Add New Doctor', icon: UserPlus, to: '/admin/doctors?new=1' },
      { label: 'View All Doctor', icon: Users, to: '/admin/doctors' },
      { label: 'Map Doctor To PRT', icon: Grid3x3, to: '/admin/doctors?map=1' },
    ],
  },
  {
    title: 'PRT Data',
    buttons: [
      { label: 'View All PRT Data', icon: Users, to: '/admin/prts' },
      { label: 'View All Session Data', icon: Activity, to: '/admin/reports?tab=sessions' },
      { label: 'View All Prescription Data', icon: FileText, to: '/admin/reports?tab=medicines' },
    ],
  },
  {
    title: 'Update Medicine Data',
    buttons: [
      { label: 'Add New Medicine', icon: ListPlus, to: '/admin/medicines?new=1' },
      { label: 'View All Medicine', icon: Pill, to: '/admin/medicines' },
    ],
  },
  {
    title: 'User Management',
    buttons: [
      { label: 'Create Login / Add User', icon: KeyRound, to: '/admin/prts?add=1' },
      { label: 'Update PRT Data', icon: Settings2, to: '/admin/prts' },
    ],
  },
];

export default function AdminPortal() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Admin Portal</h1>
        <p className="text-sm text-slate-400">Manage doctors, PRTs, medicines and reports</p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">{section.title}</p>
          <div className="space-y-2.5">
            {section.buttons.map((b) => (
              <button key={b.label} onClick={() => navigate(b.to)} className="btn-primary w-full justify-between px-4">
                <span className="flex items-center gap-2">
                  <b.icon className="h-4 w-4" />
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
