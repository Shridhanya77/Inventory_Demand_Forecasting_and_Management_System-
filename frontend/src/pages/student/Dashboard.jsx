import { useEffect, useState } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import api from '../../api/api';

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem('inventory_user') || '{}');
  const studentId = user.id || user.student_id || 101;
  const [qr, setQr] = useState('');
  const [name, setName] = useState(user.name || 'Student');
  const [history, setHistory] = useState([]);
  const downloadQr = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.href = qr;
    link.download = `student-${studentId}-qr.png`;
    link.click();
  };

  useEffect(() => {
    api.get(`/student/qr?student_id=${studentId}`).then((res) => {
      setQr(res.data.qr_code || '');
      setName(res.data.name || name);
    }).catch(console.error);
    api.get(`/student/history?student_id=${studentId}`).then((res) => setHistory(res.data)).catch(console.error);
  }, [studentId]);

  return (
    <Box>
      <Typography variant="h4" mb={2}>Student Dashboard</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Student</Typography>
        <Typography>{name} (ID: {studentId})</Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" mb={1}>Your QR</Typography>
        {qr ? (
          <>
            <img src={qr} alt="Student QR" style={{ width: 220, height: 220, display: 'block', marginBottom: 12 }} />
            <Button variant="outlined" onClick={downloadQr}>Download QR</Button>
          </>
        ) : <Typography>No QR available</Typography>}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={1}>Transaction History</Typography>
        <List>
          {history.length ? history.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={`${item.type.toUpperCase()} - ${item.component_name}`}
                secondary={`Qty: ${item.quantity} | ${new Date(item.date).toLocaleString()}`}
              />
            </ListItem>
          )) : <Typography>No transactions found</Typography>}
        </List>
      </Paper>
    </Box>
  );
};

export default StudentDashboard;
