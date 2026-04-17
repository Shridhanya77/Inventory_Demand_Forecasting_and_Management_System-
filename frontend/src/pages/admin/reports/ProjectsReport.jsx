import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../../../api/api';

const ProjectsReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('');

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branch_id = branchId;
    if (status) p.status = status;
    return p;
  }, [branchId, status]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports/projects', { params });
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load projects report');
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
      <Typography variant="h4" mb={2}>Project-wise Report</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'end' }}>
          <TextField label="Branch ID" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          <TextField label="Status (active/closed)" value={status} onChange={(e) => setStatus(e.target.value)} />
          <Button variant="contained" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Apply Filters'}
          </Button>
        </Box>
        {error ? <Typography color="error" mt={2}>{error}</Typography> : null}
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Center</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Issued</TableCell>
              <TableCell align="right">Returned</TableCell>
              <TableCell align="right">Damaged</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.project_id}>
                <TableCell>{r.project_name} {r.project_code ? `(${r.project_code})` : ''} (#{r.project_id})</TableCell>
                <TableCell>{r.branch_name} (#{r.branch_id})</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell align="right">{r.issued_qty}</TableCell>
                <TableCell align="right">{r.returned_qty}</TableCell>
                <TableCell align="right">{r.damaged_qty}</TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={6}>No results</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProjectsReport;

