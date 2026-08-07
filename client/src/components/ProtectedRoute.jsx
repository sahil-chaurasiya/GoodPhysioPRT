import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from './Ui';
import { roleHomePath } from '../utils/roleHome';

// Pass either `adminOnly` (shorthand for roles=['admin']) or an explicit
// `roles` array, e.g. roles={['admin', 'prt']}. Omit both to just require login.
export default function ProtectedRoute({ children, adminOnly = false, roles = null }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = roles || (adminOnly ? ['admin'] : null);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children;
}
