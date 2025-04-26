import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Navigation from './components/Navigation';
import CustomerList from './components/CustomerList';
import TrainingList from './components/TrainingList';
import TrainingCalendar from './components/Calendar';
import Statistics from './components/Statistics';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <NotificationProvider>
          <ErrorBoundary>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '100vh', 
                width: '100%'
              }}
            >
              <Navigation />
              <Container 
                component="main" 
                sx={{ 
                  mt: 4, 
                  mb: 4, 
                  flexGrow: 1, 
                  maxWidth: '100% !important', 
                  px: 2
                }}
              >
                <Routes>
                  <Route path="/" element={<CustomerList />} />
                  <Route path="/trainings" element={<TrainingList />} />
                  <Route path="/calendar" element={<TrainingCalendar />} />
                  <Route path="/statistics" element={<Statistics />} />
                </Routes>
              </Container>
              <Box 
                component="footer" 
                sx={{ 
                  py: 3, 
                  px: 2, 
                  mt: 'auto', 
                  backgroundColor: (theme) => theme.palette.grey[200]
                }}
              >
                <Container maxWidth="xl">
                  <Box textAlign="center">
                    <Typography variant="body2" color="textSecondary">
                      © {new Date().getFullYear()} Personal Trainer App
                    </Typography>
                  </Box>
                </Container>
              </Box>
            </Box>
          </ErrorBoundary>
        </NotificationProvider>
      </LocalizationProvider>
    </Router>
  );
}

export default App;
