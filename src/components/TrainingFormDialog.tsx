import { useState, useEffect, FC, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { Customer, Training } from '../types';
import { getCustomerId, extractIdFromUrl } from '../services/api';

// Available activities list
const ACTIVITIES = [
  'Gym training', 
  'Fitness', 
  'Zumba', 
  'Jogging', 
  'Spinning', 
  'Pilates', 
  'Yoga',
  'Running',
  'Swimming'
];

// Form data interface
interface TrainingFormData {
  date: Dayjs;
  duration: number;
  activity: string;
  customerId: string;
}

// Default form values
const DEFAULT_FORM_DATA: TrainingFormData = {
  date: dayjs(),
  duration: 60,
  activity: 'Gym training',
  customerId: '',
};

interface TrainingFormDialogProps {
  open: boolean;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSave: (training: { date: string; duration: number; activity: string; customer: string }) => void;
  onCancel: () => void;
  training?: Training; // Optional training for edit mode
}

/**
 * Activity selector component
 */
const ActivitySelector: FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ value, onChange }) => (
  <TextField
    name="activity"
    label="Activity"
    select
    value={value}
    onChange={onChange}
    fullWidth
    required
  >
    {ACTIVITIES.map((activity) => (
      <MenuItem key={activity} value={activity}>
        {activity}
      </MenuItem>
    ))}
  </TextField>
);

/**
 * Customer selector component
 */
const CustomerSelector: FC<{
  value: string;
  onChange: (e: SelectChangeEvent<string>) => void;
  customers: Customer[];
  disabled?: boolean;
}> = ({ value, onChange, customers, disabled = false }) => (
  <FormControl fullWidth disabled={disabled}>
    <InputLabel id="customer-select-label">Customer</InputLabel>
    <Select
      labelId="customer-select-label"
      value={value}
      onChange={onChange}
      label="Customer"
      required
    >
      {customers.map((customer) => {
        const customerId = getCustomerId(customer) || '';
        return (
          <MenuItem key={customerId} value={customerId}>
            {`${customer.firstname} ${customer.lastname}`}
          </MenuItem>
        );
      })}
    </Select>
  </FormControl>
);

/**
 * Training form dialog component
 * Handles both adding new trainings and editing existing ones
 */
const TrainingFormDialog: FC<TrainingFormDialogProps> = ({
  open,
  customers,
  selectedCustomer,
  onSave,
  onCancel,
  training
}) => {
  // Training form state
  const [formData, setFormData] = useState<TrainingFormData>(DEFAULT_FORM_DATA);

  // Determine if we're in edit mode
  const isEditMode = Boolean(training);
  
  /**
   * Get customer ID from training or selected customer
   */
  const getCustomerIdFromProps = useCallback((
    trainingObj?: Training, 
    customerObj?: Customer | null
  ): string => {
    // Case 1: Get ID from training
    if (trainingObj?.customer) {
      // Try standard method first
      const customerId = getCustomerId(trainingObj.customer);
      if (customerId) return customerId;
      
      // Try direct ID access
      if ('id' in trainingObj.customer && trainingObj.customer.id) {
        return String(trainingObj.customer.id);
      }
      
      // Try links
      if (trainingObj.customer.links?.self?.href) {
        const idFromLink = extractIdFromUrl(trainingObj.customer.links.self.href);
        if (idFromLink) return idFromLink;
      }
      
      // Last resort - customer link in training
      if (trainingObj.links?.customer?.href) {
        return trainingObj.links.customer.href;
      }
    }
    
    // Case 2: Get ID from selected customer
    if (customerObj) {
      const customerId = getCustomerId(customerObj);
      if (customerId) return customerId;
      
      if (customerObj.links?.self?.href) {
        return customerObj.links.self.href;
      }
    }
    
    return '';
  }, []);
  
  // Update form when training or selectedCustomer changes
  useEffect(() => {
    if (training) {
      // Edit mode - populate form with training data
      setFormData({
        date: dayjs(training.date),
        duration: training.duration,
        activity: training.activity,
        customerId: getCustomerIdFromProps(training),
      });
    } else if (selectedCustomer) {
      // Add mode with preselected customer
      setFormData({
        ...DEFAULT_FORM_DATA,
        customerId: getCustomerIdFromProps(undefined, selectedCustomer),
      });
    } else {
      // Reset form
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [training, selectedCustomer, getCustomerIdFromProps]);

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle customer selection change
   */
  const handleCustomerChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      customerId: e.target.value,
    }));
  };

  /**
   * Handle date change
   */
  const handleDateChange = (newDate: Dayjs | null) => {
    if (newDate) {
      setFormData(prev => ({
        ...prev,
        date: newDate,
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      date: formData.date.toISOString(),
      duration: formData.duration,
      activity: formData.activity,
      customer: formData.customerId
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {isEditMode ? 'Edit Training' : 'Add Training'}
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Date and Time"
                  value={formData.date}
                  onChange={handleDateChange}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <ActivitySelector 
                value={formData.activity} 
                onChange={handleChange} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <CustomerSelector 
                value={formData.customerId}
                onChange={handleCustomerChange}
                customers={customers}
                disabled={isEditMode} // Disable customer selection in edit mode
              />
              {isEditMode && (
                <Typography variant="caption" color="text.secondary">
                  Customer cannot be changed when editing a training
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onCancel} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!formData.customerId}
          >
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TrainingFormDialog; 