import { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import api from '../../api/api';

const ManagerTransactions = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/manager/transactions').then((res) => setRows(res.data)).catch(console.error);
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={2}>Center Transactions</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Component</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.student_id}</TableCell>
                <TableCell>{item.component_name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManagerTransactions;
