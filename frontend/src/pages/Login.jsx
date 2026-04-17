import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Tabs, Tab } from '@mui/material';
import api from '../api/api';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (mode === 'student') {
        const response = await api.post('/student/login', { student_id: Number(studentId) });
        const studentUser = { ...response.data.student, role: 'student' };
        localStorage.setItem('inventory_token', response.data.token);
        localStorage.setItem('inventory_user', JSON.stringify(studentUser));
        onLogin(studentUser);
        navigate('/student/dashboard');
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      const user = response.data.user;
      localStorage.setItem('inventory_token', response.data.token);
      localStorage.setItem('inventory_user', JSON.stringify(user));
      onLogin(user);
      if (user.role === 'admin' || user.role === 'master_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'center_manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', bgcolor: '#f3f4f6', p: 2 }}>
      <Paper sx={{ width: 400, maxWidth: '100%', p: 4 }}>
        <Typography variant="h5" mb={2}>Inventory Login</Typography>
        <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 1 }}>
          <Tab label="Staff/Admin" value="staff" />
          <Tab label="Student" value="student" />
        </Tabs>
        <Box component="form" onSubmit={handleSubmit}>
          {mode === 'student' ? (
            <TextField label="Student ID" type="number" value={studentId} onChange={(e) => setStudentId(e.target.value)} fullWidth margin="normal" required />
          ) : (
            <>
              <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" required />
              <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" required />
            </>
          )}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            {mode === 'student' ? 'Student Sign In' : 'Sign In'}
          </Button>
          {mode === 'staff' && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              New user? <Link to="/register">Register with email</Link>
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
