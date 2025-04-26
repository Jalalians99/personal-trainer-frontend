import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { Box, TextField, Typography, Paper, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { CSVLink } from 'react-csv';
import { Customer } from '../types';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, addTraining } from '../services/api';
import CustomerFormDialog from './CustomerFormDialog';
import TrainingFormDialog from './TrainingFormDialog';
import ConfirmationDialog from './ConfirmationDialog';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useNotification } from '../context/NotificationContext';

// Import API base URL
const API_BASE_URL = 'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Dialog states
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [trainingFormOpen, setTrainingFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { showNotification } = useNotification();

  // Define columns for AG-Grid
  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'firstname', headerName: 'First Name', sortable: true, filter: true, minWidth: 120, flex: 1 },
    { field: 'lastname', headerName: 'Last Name', sortable: true, filter: true, minWidth: 120, flex: 1 },
    { field: 'streetaddress', headerName: 'Street Address', sortable: true, filter: true, minWidth: 150, flex: 1.5 },
    { field: 'postcode', headerName: 'Postcode', sortable: true, filter: true, minWidth: 100, flex: 0.8 },
    { field: 'city', headerName: 'City', sortable: true, filter: true, minWidth: 120, flex: 1 },
    { field: 'email', headerName: 'Email', sortable: true, filter: true, minWidth: 150, flex: 1.5 },
    { field: 'phone', headerName: 'Phone', sortable: true, filter: true, minWidth: 120, flex: 1 },
    {
      headerName: 'Actions',
      minWidth: 300,
      flex: 1.5,
      cellRenderer: (params: any) => {
        const customer = params.data as Customer;
        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => handleEditCustomer(customer)}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleDeleteClick(customer)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
            <Button
              size="small"
              color="success"
              onClick={() => handleAddTraining(customer)}
              startIcon={<FitnessCenterIcon />}
            >
              Add Training
            </Button>
          </Stack>
        );
      }
    }
  ], []);
  
  // Default column settings
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  // Fetch customers on component mount
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchFields = [
        customer.firstname,
        customer.lastname,
        customer.city,
        customer.email,
        customer.phone,
      ].map(field => field?.toLowerCase() || '');
      
      return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    });
  }, [customers, searchTerm]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Grid ready event handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Handle add customer button click
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setCustomerFormOpen(true);
  };

  // Handle edit customer button click
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerFormOpen(true);
  };

  // Handle add training button click
  const handleAddTraining = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTrainingFormOpen(true);
  };

  // Handle delete customer button click
  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  // Handle customer form save (add or update)
  const handleCustomerSave = async (customerData: Omit<Customer, 'id' | 'links'>, isUpdate: boolean = false) => {
    try {
      if (isUpdate && selectedCustomer) {
        // Update existing customer
        const updatedCustomer = {
          ...selectedCustomer,
          ...customerData
        };
        const success = await updateCustomer(updatedCustomer);
        if (success) {
          await fetchCustomers();
          setCustomerFormOpen(false);
          showNotification('Customer updated successfully', 'success');
        } else {
          setCustomerFormOpen(false);
          showNotification('Failed to update customer - the customer has been added as a new entry', 'warning');
        }
      } else {
        // Add new customer
        const success = await addCustomer(customerData);
        if (success) {
          await fetchCustomers();
          setCustomerFormOpen(false);
          showNotification('Customer added successfully', 'success');
        } else {
          showNotification('Failed to add customer', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showNotification('An error occurred. Please try again.', 'error');
    }
  };

  // Handle customer delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      if (selectedCustomer) {
        const success = await deleteCustomer(selectedCustomer);
        
        if (success) {
          await fetchCustomers();
          showNotification('Customer deleted successfully', 'success');
          setDeleteDialogOpen(false);
        } else {
          showNotification('Failed to delete customer - customer ID could not be determined', 'error');
          setDeleteDialogOpen(false);
        }
      } else {
        showNotification('Cannot delete customer - no customer selected', 'warning');
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      showNotification('An error occurred while deleting the customer', 'error');
      setDeleteDialogOpen(false);
    }
  };

  // Handle training form save
  const handleTrainingSave = async (trainingData: { date: string; duration: number; activity: string; customer: string }) => {
    try {
      const success = await addTraining(trainingData);
      if (success) {
        setTrainingFormOpen(false);
        showNotification('Training added successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving training:', error);
      showNotification('Failed to add training', 'error');
    }
  };

  // Prepare data for CSV export - filter out links and other non-essential data
  const exportData = useMemo(() => {
    return customers.map(customer => ({
      firstname: customer.firstname,
      lastname: customer.lastname,
      streetaddress: customer.streetaddress,
      postcode: customer.postcode,
      city: customer.city,
      email: customer.email,
      phone: customer.phone
    }));
  }, [customers]);

  // Define CSV headers
  const csvHeaders = [
    { label: 'First Name', key: 'firstname' },
    { label: 'Last Name', key: 'lastname' },
    { label: 'Street Address', key: 'streetaddress' },
    { label: 'Postcode', key: 'postcode' },
    { label: 'City', key: 'city' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' }
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Customers
        </Typography>
        <Stack direction="row" spacing={2}>
          <CSVLink 
            data={exportData}
            headers={csvHeaders}
            filename={"customers.csv"}
            className="button-link"
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="contained"
              color="secondary"
              startIcon={<FileDownloadIcon />}
            >
              Export CSV
            </Button>
          </CSVLink>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        </Stack>
      </Box>
      
      <TextField
        label="Search Customers"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by name, city, email, or phone"
      />
      
      <Box className="ag-theme-material" sx={{ height: 600, width: '100%', mt: 2 }}>
        <AgGridReact
          rowData={filteredCustomers}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="single"
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 25, 50]}
          onGridReady={onGridReady}
          domLayout="autoHeight"
        />
      </Box>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={customerFormOpen}
        customer={selectedCustomer}
        onSave={handleCustomerSave}
        onCancel={() => setCustomerFormOpen(false)}
      />

      {/* Training Form Dialog */}
      <TrainingFormDialog
        open={trainingFormOpen}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSave={handleTrainingSave}
        onCancel={() => setTrainingFormOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.firstname} ${selectedCustomer?.lastname}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Paper>
  );
};

export default CustomerList; 