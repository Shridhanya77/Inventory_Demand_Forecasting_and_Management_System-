import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material';
import api from '../../api/api';
import { getRoleApiBase } from '../../api/rolePath';

const TransferRequest = () => {
  const [branches, setBranches] = useState([]);
  const [components, setComponents] = useState([]);
  const [toBranch, setToBranch] = useState('');
  const [componentId, setComponentId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/branches').then((res) => setBranches(res.data)).catch(console.error);
    api.get('/admin/components').then((res) => setComponents(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (Number(quantity) <= 0) {
        setMessage('Quantity must be positive');
        return;
      }
      await api.post(`${getRoleApiBase()}/transfer-requests`, { to_branch: toBranch, component_id: componentId, quantity: Number(quantity) });
      setMessage('Transfer request created');
      setToBranch('');
      setComponentId('');
      setQuantity(1);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create transfer request');
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Transfer Request</Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField select label="Destination Branch" value={toBranch} onChange={(e) => setToBranch(e.target.value)} required>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Component" value={componentId} onChange={(e) => setComponentId(e.target.value)} required>
            {components.map((component) => (
              <MenuItem key={component.id} value={component.id}>{component.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Button type="submit" variant="contained">Submit Request</Button>
          {message && <Typography>{message}</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default TransferRequest;
