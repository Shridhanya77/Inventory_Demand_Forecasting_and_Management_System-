import { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import api from '../../api/api';

const TransferApproval = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/admin/transfer-requests').then((res) => setRequests(res.data)).catch(console.error);
  }, []);

  const handleAction = async (id, action) => {
    const url = `/admin/transfer-requests/${id}/${action}`;
    await api.patch(url, action === 'reject' ? { reason: 'Rejected by admin' } : {});
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item)));
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Transfer Approval</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Component</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.from_branch}</TableCell>
                <TableCell>{request.to_branch}</TableCell>
                <TableCell>{request.component_name}</TableCell>
                <TableCell>{request.quantity}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <>
                      <Button onClick={() => handleAction(request.id, 'approve')} size="small" sx={{ mr: 1 }}>Approve</Button>
                      <Button onClick={() => handleAction(request.id, 'reject')} size="small">Reject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransferApproval;
