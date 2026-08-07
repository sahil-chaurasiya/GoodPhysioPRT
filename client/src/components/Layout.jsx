import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, User, ShieldCheck, LogOut, Stethoscope, Users, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard, roles: ['admin', 'prt'] },
  { to: '/register-patient', label: 'Register a Patient', icon: UserPlus, roles: ['admin', 'prt'] },
  { to: '/my-patients', label: 'My Patients', icon: Users, roles: ['admin', 'prt', 'doctor'] },
  { to: '/my-profile', label: 'My Profile', icon: User, roles: ['patient'] },
  { to: '/my-sessions', label: 'Sessions', icon: Video, roles: ['patient'] },
  { to: '/me', label: 'Me', icon: User, roles: ['admin', 'prt', 'doctor', 'patient'] },
  { to: '/admin', label: 'Admin Portal', icon: ShieldCheck, roles: ['admin'] },
];

const ROLE_LABELS = {
  admin: 'Administrator',
  prt: 'PRT',
  doctor: 'Doctor',
  patient: 'Patient',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f4f5fb]">
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex sm:w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900 leading-tight">PRT Health</p>
            <p className="text-[11px] text-slate-400 leading-tight">Patient Management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-xl px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {user?.name?.slice(0, 1)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}