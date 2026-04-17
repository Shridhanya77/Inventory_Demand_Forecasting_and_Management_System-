import { useEffect, useState } from 'react';
import { Typography, Grid, Paper, List, ListItem, ListItemText, Box, Divider } from '@mui/material';
import api from '../../api/api';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    branchStock: [],
    lowStock: [],
    netWorthByBranch: [],
    componentRotationTop: [],
    componentLowUsage: [],
  });

  useEffect(() => {
    api.get('/admin/analytics').then((res) => setAnalytics(res.data)).catch(console.error);
  }, []);

  const currency = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Admin Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Stock by Branch</Typography>
            <List>
              {analytics.branchStock.map((branch) => (
                <ListItem key={branch.branch_id} divider>
                  <ListItemText primary={branch.branch_name} secondary={`Total stock: ${branch.total_stock}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Low Stock Alerts</Typography>
            <List>
              {analytics.lowStock.length ? analytics.lowStock.map((item, index) => (
                <ListItem key={index} divider>
                  <ListItemText primary={`${item.component_name}`} secondary={`${item.branch_name} — ${item.quantity} left`} />
                </ListItem>
              )) : <Typography>No low stock alerts</Typography>}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Net Worth by Center</Typography>
            <List>
              {analytics.netWorthByBranch.length ? analytics.netWorthByBranch.map((row) => (
                <ListItem key={row.branch_id} divider>
                  <ListItemText primary={row.branch_name} secondary={currency(row.net_worth)} />
                </ListItem>
              )) : <Typography>No data</Typography>}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Component Rotation (Top)</Typography>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {analytics.componentRotationTop.length ? analytics.componentRotationTop.map((row) => (
                <ListItem key={row.component_id} divider>
                  <ListItemText primary={row.component_name} secondary={`Issued: ${row.issued_qty}`} />
                </ListItem>
              )) : <Typography>No data</Typography>}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Low Usage Items</Typography>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {analytics.componentLowUsage.length ? analytics.componentLowUsage.map((row) => (
                <ListItem key={row.component_id} divider>
                  <ListItemText primary={row.component_name} secondary={`Issued: ${row.issued_qty}`} />
                </ListItem>
              )) : <Typography>No data</Typography>}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
