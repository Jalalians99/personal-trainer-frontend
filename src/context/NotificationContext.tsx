import { createContext, useContext, useRef, ReactNode } from 'react';
import NotificationSnackbar, { NotificationSnackbarRef } from '../components/NotificationSnackbar';
import { AlertColor } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const snackbarRef = useRef<NotificationSnackbarRef>(null);

  const showNotification = (message: string, severity: AlertColor = 'success') => {
    snackbarRef.current?.showNotification(message, severity);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationSnackbar ref={snackbarRef} />
    </NotificationContext.Provider>
  );
}; 