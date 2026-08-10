import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleHomePath } from '../utils/roleHome';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={roleHomePath(user.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(loginEmail, password);
      toast.success('Welcome back!');
      navigate(roleHomePath(loggedInUser.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-[#f4f5fb] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-pop">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">PRT Health</h1>
          <p className="text-sm text-slate-500">Patient Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label field-required">Login Email / Phone Number</label>
            <input
              type="text"
              required
              autoFocus
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@cipla.com or 10-digit phone number"
              className="input"
            />
          </div>
          <div>
            <label className="field-label field-required">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}