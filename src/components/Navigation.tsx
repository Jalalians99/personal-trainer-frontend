import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, IconButton, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { resetDatabase } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmationDialog from './ConfirmationDialog';

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  const { showNotification } = useNotification();
  
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleResetDatabase = async () => {
    setResetDialogOpen(false);
    try {
      const success = await resetDatabase();
      if (success) {
        showNotification('Database reset successful. Please refresh the page to see the changes.', 'success');
      } else {
        showNotification('Database reset failed.', 'error');
      }
    } catch (error) {
      showNotification('Database reset failed.', 'error');
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Personal Trainer
          </Typography>
          
          <Box sx={{ flexGrow: 1 }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              textColor="inherit" 
              indicatorColor="secondary"
            >
              <Tab label="Customers" value="/" component={RouterLink} to="/" />
              <Tab label="Trainings" value="/trainings" component={RouterLink} to="/trainings" />
              <Tab label="Calendar" value="/calendar" component={RouterLink} to="/calendar" />
              <Tab label="Statistics" value="/statistics" component={RouterLink} to="/statistics" />
            </Tabs>
          </Box>
          
          <Button
            color="inherit"
            onClick={() => setResetDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Reset Database
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer for mobile ... */}
      
      {/* Reset Database Confirmation Dialog */}
      <ConfirmationDialog
        open={resetDialogOpen}
        title="Reset Database"
        message="Are you sure you want to reset the database? This will remove all custom data and restore the default data."
        onConfirm={handleResetDatabase}
        onCancel={() => setResetDialogOpen(false)}
      />
    </Box>
  );
};

export default Navigation; 