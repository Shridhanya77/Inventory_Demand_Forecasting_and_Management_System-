import { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../../api/api';

const ComponentsPage = () => {
  const [components, setComponents] = useState([]);
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/components').then((res) => setComponents(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        name,
        unit_price: unitPrice === '' ? 0 : Number(unitPrice),
        sku: sku || undefined,
        description: description || undefined,
      };
      const response = await api.post('/admin/components', payload);
      setComponents((prev) => [...prev, response.data]);
      setName('');
      setUnitPrice('');
      setSku('');
      setDescription('');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add component');
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Manage Components</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Component Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField
            label="Unit Price (₹)"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
          <TextField label="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
          <Button type="submit" variant="contained">Add Component</Button>
          {error ? <Typography color="error">{error}</Typography> : null}
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Unit Price (₹)</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.map((component) => (
              <TableRow key={component.id}>
                <TableCell>{component.id}</TableCell>
                <TableCell>{component.name}</TableCell>
                <TableCell align="right">{Number(component.unit_price || 0).toFixed(2)}</TableCell>
                <TableCell>{component.sku || '-'}</TableCell>
                <TableCell sx={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {component.description || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ComponentsPage;
