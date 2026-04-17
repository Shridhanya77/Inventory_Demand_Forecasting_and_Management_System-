export const getRoleApiBase = () => {
  const user = JSON.parse(localStorage.getItem('inventory_user') || '{}');
  if (user.role === 'master_admin') return '/admin';
  if (user.role === 'center_manager') return '/manager';
  if (user.role === 'staff') return '/staff';
  return '/staff';
};
