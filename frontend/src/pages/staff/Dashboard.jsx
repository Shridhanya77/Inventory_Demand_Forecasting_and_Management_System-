import { useEffect, useState } from 'react';
import { Typography, Grid, Paper, List, ListItem, ListItemText, Box } from '@mui/material';
import api from '../../api/api';
import { getRoleApiBase } from '../../api/rolePath';

const Dashboard = () => {
  const [stats, setStats] = useState({ stock: [], lowStock: [] });

  useEffect(() => {
    api.get(`${getRoleApiBase()}/dashboard`).then((res) => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={2}>Staff Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Current Stock</Typography>
            <List>
              {stats.stock.map((item) => (
                <ListItem key={item.component_id} divider>
                  <ListItemText primary={item.name} secondary={`Quantity: ${item.quantity}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Low Stock</Typography>
            {stats.lowStock.length ? (
              <List>
                {stats.lowStock.map((item) => (
                  <ListItem key={item.component_id} divider>
                    <ListItemText primary={item.name} secondary={`Quantity: ${item.quantity}`} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No low stock items</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
