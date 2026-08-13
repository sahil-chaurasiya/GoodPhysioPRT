// Each role's default landing page after login / when redirected away from a
// route they don't have access to.
export function roleHomePath(role) {
  switch (role) {
    case 'admin':
    case 'prt':
      return '/dashboard';
    case 'doctor':
      return '/my-patients';
    case 'patient':
      return '/my-sessions';
    default:
      return '/login';
  }
}