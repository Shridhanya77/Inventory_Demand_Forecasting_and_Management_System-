import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import Branches from './pages/admin/Branches';
import ComponentsPage from './pages/admin/Components';
import TransferApproval from './pages/admin/TransferApproval';
import AdminTransactions from './pages/admin/Transactions';
import AuditLogs from './pages/admin/AuditLogs';
import UsageReport from './pages/admin/reports/UsageReport';
import ProjectsReport from './pages/admin/reports/ProjectsReport';
import LossReport from './pages/admin/reports/LossReport';
import StaffDashboard from './pages/staff/Dashboard';
import AddStock from './pages/staff/AddStock';
import RegisterStudent from './pages/staff/RegisterStudent';
import Issue from './pages/staff/Issue';
import ReturnPage from './pages/staff/Return';
import TransferRequest from './pages/staff/TransferRequest';
import ManagerTransactions from './pages/manager/Transactions';
import StudentDashboard from './pages/student/Dashboard';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

const getUser = () => {
  const userJson = localStorage.getItem('inventory_user');
  return userJson ? JSON.parse(userJson) : null;
};

function App() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const menuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'master_admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Branches', path: '/admin/branches' },
        { label: 'Components', path: '/admin/components' },
        { label: 'Transfer Approvals', path: '/admin/transfers' },
        { label: 'Transactions', path: '/admin/transactions' },
        { label: 'Reports - Usage', path: '/admin/reports/usage' },
        { label: 'Reports - Projects', path: '/admin/reports/projects' },
        { label: 'Reports - Loss/Discard', path: '/admin/reports/loss' },
        { label: 'Audit Logs', path: '/admin/audit-logs' },
      ];
    }
    if (user.role === 'center_manager') {
      return [
        { label: 'Dashboard', path: '/manager/dashboard' },
        { label: 'Add Stock', path: '/manager/add-stock' },
        { label: 'Register Student', path: '/manager/register-student' },
        { label: 'Issue Items', path: '/manager/issue' },
        { label: 'Return Items', path: '/manager/return' },
        { label: 'Transfer Request', path: '/manager/transfer-request' },
        { label: 'Transactions', path: '/manager/transactions' },
      ];
    }
    if (user.role === 'staff') {
      return [
        { label: 'Dashboard', path: '/staff/dashboard' },
        { label: 'Add Stock', path: '/staff/add-stock' },
        { label: 'Register Student', path: '/staff/register-student' },
        { label: 'Issue Items', path: '/staff/issue' },
        { label: 'Return Items', path: '/staff/return' },
        { label: 'Transfer Request', path: '/staff/transfer-request' },
      ];
    }
    if (user.role === 'student') {
      return [
        { label: 'Dashboard', path: '/student/dashboard' },
      ];
    }
    return [];
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      {user && <Sidebar user={user} menuItems={menuItems} onLogout={handleLogout} />}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f3f4f6' }}>
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onLogin={setUser} />} />
          <Route
            path="/admin/dashboard"
            element={<ProtectedRoute user={user} role={['admin','master_admin']}><AdminDashboard /></ProtectedRoute>}
          />
          <Route path="/admin/branches" element={<ProtectedRoute user={user} role={['admin','master_admin']}><Branches /></ProtectedRoute>} />
          <Route path="/admin/components" element={<ProtectedRoute user={user} role={['admin','master_admin']}><ComponentsPage /></ProtectedRoute>} />
          <Route path="/admin/transfers" element={<ProtectedRoute user={user} role={['admin','master_admin']}><TransferApproval /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute user={user} role={['admin','master_admin']}><AdminTransactions /></ProtectedRoute>} />
          <Route path="/admin/reports/usage" element={<ProtectedRoute user={user} role={['admin','master_admin']}><UsageReport /></ProtectedRoute>} />
          <Route path="/admin/reports/projects" element={<ProtectedRoute user={user} role={['admin','master_admin']}><ProjectsReport /></ProtectedRoute>} />
          <Route path="/admin/reports/loss" element={<ProtectedRoute user={user} role={['admin','master_admin']}><LossReport /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute user={user} role={['admin','master_admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/staff/dashboard" element={<ProtectedRoute user={user} role="staff"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/add-stock" element={<ProtectedRoute user={user} role="staff"><AddStock /></ProtectedRoute>} />
          <Route path="/staff/register-student" element={<ProtectedRoute user={user} role="staff"><RegisterStudent /></ProtectedRoute>} />
          <Route path="/staff/issue" element={<ProtectedRoute user={user} role="staff"><Issue /></ProtectedRoute>} />
          <Route path="/staff/return" element={<ProtectedRoute user={user} role="staff"><ReturnPage /></ProtectedRoute>} />
          <Route path="/staff/transfer-request" element={<ProtectedRoute user={user} role="staff"><TransferRequest /></ProtectedRoute>} />
          <Route path="/manager/dashboard" element={<ProtectedRoute user={user} role="center_manager"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/manager/add-stock" element={<ProtectedRoute user={user} role="center_manager"><AddStock /></ProtectedRoute>} />
          <Route path="/manager/register-student" element={<ProtectedRoute user={user} role="center_manager"><RegisterStudent /></ProtectedRoute>} />
          <Route path="/manager/issue" element={<ProtectedRoute user={user} role="center_manager"><Issue /></ProtectedRoute>} />
          <Route path="/manager/return" element={<ProtectedRoute user={user} role="center_manager"><ReturnPage /></ProtectedRoute>} />
          <Route path="/manager/transfer-request" element={<ProtectedRoute user={user} role="center_manager"><TransferRequest /></ProtectedRoute>} />
          <Route path="/manager/transactions" element={<ProtectedRoute user={user} role="center_manager"><ManagerTransactions /></ProtectedRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute user={user} role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route
            path="*"
            element={
              <Navigate
                to={
                  user
                    ? (user.role === 'admin' || user.role === 'master_admin')
                      ? '/admin/dashboard'
                      : user.role === 'center_manager'
                        ? '/manager/dashboard'
                        : user.role === 'student'
                          ? '/student/dashboard'
                        : '/staff/dashboard'
                    : '/login'
                }
                replace
              />
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
