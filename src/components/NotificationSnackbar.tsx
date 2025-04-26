import { useState, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface NotificationSnackbarRef {
  showNotification: (message: string, severity?: AlertColor) => void;
}

const NotificationSnackbar = forwardRef<NotificationSnackbarRef, {}>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');

  const showNotification = useCallback((message: string, severity: AlertColor = 'success') => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({
    showNotification,
  }));

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  // Auto-close after 5 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        variant="filled" 
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
});

export default NotificationSnackbar; 