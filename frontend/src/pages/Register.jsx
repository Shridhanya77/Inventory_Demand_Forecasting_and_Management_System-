import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, MenuItem } from '@mui/material';
import api from '../api/api';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('staff');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/branches').then((res) => {
      setBranches(res.data);
      if (res.data[0]) setBranchId(String(res.data[0].id));
    }).catch(() => setError('Could not load branches. Is the backend and database running?'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        branch_id: Number(branchId),
      });
      localStorage.setItem('inventory_token', response.data.token);
      localStorage.setItem('inventory_user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
      if (response.data.user.role === 'center_manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', bgcolor: '#f3f4f6', p: 2 }}>
      <Paper sx={{ width: 400, p: 4 }}>
        <Typography variant="h5" mb={2}>Create account</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Register with your work email. Only registered users can sign in. Admin accounts are created separately (seed).
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField label="Password (min 8 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
          <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required fullWidth />
          <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="center_manager">Center manager</MenuItem>
          </TextField>
          <TextField select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required fullWidth disabled={!branches.length}>
            {branches.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>{b.name}{b.location ? ` — ${b.location}` : ''}</MenuItem>
            ))}
          </TextField>
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth disabled={!branches.length}>Register</Button>
          <Typography variant="body2">
            Already have an account? <Link to="/login">Sign in</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
