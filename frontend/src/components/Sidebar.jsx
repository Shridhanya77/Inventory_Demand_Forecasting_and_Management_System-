import { Link } from 'react-router-dom';
import { Drawer, List, ListItemButton, ListItemText, Toolbar, Typography, Box, Button } from '@mui/material';

const Sidebar = ({ user, menuItems, onLogout }) => {
  return (
    <Drawer variant="permanent" open sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' } }}>
      <Toolbar sx={{ minHeight: 80, px: 2 }}>
        <Box>
          <Typography variant="h6">IoT Inventory</Typography>
          <Typography variant="body2" color="text.secondary">{user.name} • {user.role}</Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.path} component={Link} to={item.path}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button variant="contained" color="secondary" fullWidth onClick={onLogout}>
          Logout
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
