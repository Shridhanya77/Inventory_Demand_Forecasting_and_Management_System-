import { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import api from '../../api/api';
import { getRoleApiBase } from '../../api/rolePath';

const RegisterStudent = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        setMessage('Student name must be at least 2 characters');
        return;
      }
      const res = await api.post(`${getRoleApiBase()}/students`, { name: trimmed });
      setMessage(`Student created: ${res.data.name} (ID ${res.data.id})`);
      setName('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create student');
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Register Student</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Student Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" variant="contained">Create Student</Button>
          {message && <Typography>{message}</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterStudent;
