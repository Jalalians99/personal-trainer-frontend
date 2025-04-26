import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import { Customer } from '../types';

interface CustomerFormDialogProps {
  open: boolean;
  customer: Partial<Customer> | null;
  onSave: (customer: Omit<Customer, 'links'>, isUpdate: boolean) => void;
  onCancel: () => void;
}

interface CustomerFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  streetaddress: string;
  city: string;
  postcode: string;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({ open, customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    streetaddress: '',
    city: '',
    postcode: '',
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstname: customer.firstname || '',
        lastname: customer.lastname || '',
        email: customer.email || '',
        phone: customer.phone || '',
        streetaddress: customer.streetaddress || '',
        city: customer.city || '',
        postcode: customer.postcode || '',
      });
    } else {
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        streetaddress: '',
        city: '',
        postcode: '',
      });
    }
  }, [customer]);

  useEffect(() => {
    const isValid = 
      formData.firstname.trim() !== '' &&
      formData.lastname.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.streetaddress.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.postcode.trim() !== '';
    setIsValid(isValid);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isValid) {
      onSave(formData, !!customer);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                name="firstname"
                label="First Name"
                value={formData.firstname}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastname"
                label="Last Name"
                value={formData.lastname}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="streetaddress"
                label="Street Address"
                value={formData.streetaddress}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="postcode"
                label="Postcode"
                value={formData.postcode}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerFormDialog; 