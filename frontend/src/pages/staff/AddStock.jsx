import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material';
import api from '../../api/api';
import { getRoleApiBase } from '../../api/rolePath';

const AddStock = () => {
  const [components, setComponents] = useState([]);
  const [componentId, setComponentId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/components').then((res) => setComponents(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (Number(quantity) <= 0) {
        setMessage('Quantity must be positive');
        return;
      }
      await api.post(`${getRoleApiBase()}/stock/add`, { component_id: componentId, quantity: Number(quantity) });
      setMessage('Stock added successfully');
      setQuantity(0);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add stock');
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Add Stock</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField select label="Component" value={componentId} onChange={(e) => setComponentId(e.target.value)} required>
            {components.map((component) => (
              <MenuItem key={component.id} value={component.id}>{component.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Button type="submit" variant="contained">Add Stock</Button>
          {message && <Typography>{message}</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default AddStock;
