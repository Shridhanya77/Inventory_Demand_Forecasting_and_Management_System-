import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../../../api/api';

const LossReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branchId, setBranchId] = useState('');
  const [projectId, setProjectId] = useState('');

  const params = useMemo(() => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    if (branchId) p.branch_id = branchId;
    if (projectId) p.project_id = projectId;
    return p;
  }, [from, to, branchId, projectId]);

  const currency = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports/loss', { params });
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load loss report');
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
      <Typography variant="h4" mb={2}>Loss / Discard Report</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'end' }}>
          <TextField label="From (ISO)" placeholder="2026-04-01" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="To (ISO)" placeholder="2026-04-30" value={to} onChange={(e) => setTo(e.target.value)} />
          <TextField label="Branch ID" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          <TextField label="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
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
              <TableCell>Center</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Component</TableCell>
              <TableCell align="right">Damaged Qty</TableCell>
              <TableCell align="right">Loss Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={`${r.branch_id}-${r.project_id}-${r.component_id}-${idx}`}>
                <TableCell>{r.branch_name || '-'} {r.branch_id ? `(#${r.branch_id})` : ''}</TableCell>
                <TableCell>{r.project_name || '-'} {r.project_id ? `(#${r.project_id})` : ''}</TableCell>
                <TableCell>{r.component_name} (#{r.component_id})</TableCell>
                <TableCell align="right">{r.damaged_qty}</TableCell>
                <TableCell align="right">{currency(r.loss_value)}</TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={5}>No results</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LossReport;

