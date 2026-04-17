import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../../../api/api';

const UsageReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branchId, setBranchId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [componentId, setComponentId] = useState('');

  const params = useMemo(() => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    if (branchId) p.branch_id = branchId;
    if (projectId) p.project_id = projectId;
    if (componentId) p.component_id = componentId;
    return p;
  }, [from, to, branchId, projectId, componentId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports/usage', { params });
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load usage report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={2}>Usage Report</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2, alignItems: 'end' }}>
          <TextField label="From (ISO)" placeholder="2026-04-01" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="To (ISO)" placeholder="2026-04-30" value={to} onChange={(e) => setTo(e.target.value)} />
          <TextField label="Branch ID" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          <TextField label="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          <TextField label="Component ID" value={componentId} onChange={(e) => setComponentId(e.target.value)} />
          <Button variant="contained" onClick={load} disabled={loading} sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            {loading ? 'Loading…' : 'Apply Filters'}
          </Button>
        </Box>
        {error ? <Typography color="error" mt={2}>{error}</Typography> : null}
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Component</TableCell>
              <TableCell align="right">Issued</TableCell>
              <TableCell align="right">Returned</TableCell>
              <TableCell align="right">Damaged</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.component_id}>
                <TableCell>{r.component_name} (#{r.component_id})</TableCell>
                <TableCell align="right">{r.issued_qty}</TableCell>
                <TableCell align="right">{r.returned_qty}</TableCell>
                <TableCell align="right">{r.damaged_qty}</TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={4}>No results</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsageReport;

