import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { QrReader } from 'react-qr-reader';
import api from '../../api/api';
import { getRoleApiBase } from '../../api/rolePath';

const ReturnPage = () => {
  const [componentId, setComponentId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [components, setComponents] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/components').then((res) => setComponents(res.data)).catch(console.error);
  }, []);

  const handleReturn = async (event) => {
    event.preventDefault();
    try {
      if (Number(quantity) <= 0) {
        setMessage('Quantity must be positive');
        return;
      }
      await api.post(`${getRoleApiBase()}/return`, { student_id: studentId, component_id: componentId, quantity: Number(quantity) });
      setMessage('Return transaction completed successfully');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Return failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Return Component</Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="subtitle1" mb={1}>Scan Student QR</Typography>
        <Box sx={{ mb: 2 }}>
          <QrReader onResult={(result, error) => {
            if (result) {
              try {
                const payload = JSON.parse(result?.text);
                if (payload.type === 'student') setStudentId(payload.student_id);
              } catch {}
            }
          }} constraints={{ facingMode: 'environment' }} style={{ width: '100%' }} />
        </Box>
        <Box component="form" onSubmit={handleReturn} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          <TextField select label="Component" value={componentId} onChange={(e) => setComponentId(e.target.value)} required>
            {components.map((component) => (
              <MenuItem key={component.id} value={component.id}>{component.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Button type="submit" variant="contained">Return</Button>
          {message && <Typography>{message}</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReturnPage;
