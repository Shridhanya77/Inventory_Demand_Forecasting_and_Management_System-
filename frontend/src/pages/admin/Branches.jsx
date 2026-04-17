import { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../../api/api';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    api.get('/admin/branches').then((res) => setBranches(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await api.post('/admin/branches', { name, location });
    setBranches((prev) => [...prev, response.data]);
    setName('');
    setLocation('');
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Manage Branches</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          <Button type="submit" variant="contained">Add Branch</Button>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell>{branch.id}</TableCell>
                <TableCell>{branch.name}</TableCell>
                <TableCell>{branch.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Branches;
