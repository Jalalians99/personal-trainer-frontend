import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { Box, TextField, Typography, Paper, Button, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import { CSVLink } from 'react-csv';
import { Training, Customer } from '../types';
import { getTrainings, deleteTraining, getCustomers, addTraining, updateTraining, extractIdFromUrl, API_BASE_URL } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import TrainingFormDialog from './TrainingFormDialog';
import ConfirmationDialog from './ConfirmationDialog';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const TrainingList = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Dialog states
  const [trainingFormOpen, setTrainingFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  const { showNotification } = useNotification();

  // Define columns for AG-Grid
  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      field: 'date', 
      headerName: 'Date', 
      sortable: true, 
      filter: true, 
      minWidth: 180,
      flex: 1.2,
      valueFormatter: (params) => formatDate(params.value)
    },
    { 
      field: 'duration', 
      headerName: 'Duration (min)', 
      sortable: true, 
      filter: true, 
      minWidth: 120,
      flex: 0.8
    },
    { 
      field: 'activity', 
      headerName: 'Activity', 
      sortable: true, 
      filter: true, 
      minWidth: 150,
      flex: 1
    },
    { 
      headerName: 'Customer', 
      sortable: true, 
      filter: true, 
      minWidth: 180,
      flex: 1.2,
      valueGetter: (params) => {
        const training = params.data as Training;
        if (training.customer && training.customer.firstname) {
          return `${training.customer.firstname} ${training.customer.lastname}`;
        }
        // If customer data isn't loaded yet, fetch it
        if (training.links?.customer) {
          fetchCustomerForTraining(training);
          return 'Loading...';
        }
        return 'No Customer';
      }
    },
    {
      headerName: 'Actions',
      minWidth: 180,
      flex: 1.2,
      cellRenderer: (params: any) => {
        const training = params.data as Training;
        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => handleEditTraining(training)}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleDeleteClick(training)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Stack>
        );
      }
    }
  ], []);
  
  // Add a function to fetch customer data for a training if it's not already loaded
  const fetchCustomerForTraining = useCallback(async (training: Training) => {
    if (!training.customer && training.links?.customer) {
      try {
        const response = await axios.get<Customer>(training.links.customer.href);
        // Update the training with customer data
        const updatedTrainings = trainings.map(t => 
          t.links?.self.href === training.links?.self.href 
            ? { ...t, customer: response.data } 
            : t
        );
        setTrainings(updatedTrainings);
      } catch (error) {
        console.error('Error fetching customer for training:', error);
      }
    }
  }, [trainings]);

  // Default column settings
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  // Fetch trainings and customers on component mount
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trainingsData, customersData] = await Promise.all([
        getTrainings(),
        getCustomers()
      ]);
      setTrainings(trainingsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter trainings based on search term
  const filteredTrainings = useMemo(() => {
    return trainings.filter((training) => {
      const customerName = training.customer 
        ? `${training.customer.firstname} ${training.customer.lastname}`.toLowerCase() 
        : '';
      
      const searchFields = [
        training.activity.toLowerCase(),
        customerName,
        formatDate(training.date).toLowerCase(),
      ];
      
      return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    });
  }, [trainings, searchTerm]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Grid ready event handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Handle add training button click
  const handleAddTraining = () => {
    setSelectedTraining(null);
    setTrainingFormOpen(true);
  };

  // Handle edit training button click
  const handleEditTraining = (training: Training) => {
    setSelectedTraining(training);
    setTrainingFormOpen(true);
  };

  // Handle delete training button click
  const handleDeleteClick = (training: Training) => {
    setSelectedTraining(training);
    setDeleteDialogOpen(true);
  };

  // Handle training form save
  const handleTrainingSave = async (trainingData: { date: string; duration: number; activity: string; customer: string }) => {
    try {
      let success = false;
      
      if (selectedTraining) {
        // We're editing an existing training
        // First try to use the id property directly (from /gettrainings endpoint)
        const trainingId = selectedTraining.id?.toString() || extractIdFromUrl(selectedTraining.links?.self?.href || '');
        
        if (trainingId) {
          success = await updateTraining(trainingId, trainingData);
        } else {
          console.error('Cannot update training - no valid ID available');
          showNotification('Cannot update training - no valid ID available', 'error');
          return;
        }
      } else {
        // Adding a new training
        success = await addTraining(trainingData);
      }
      
      if (success) {
        await fetchData();
        setTrainingFormOpen(false);
        showNotification(
          selectedTraining ? 'Training updated successfully' : 'Training added successfully', 
          'success'
        );
      } else {
        showNotification(
          selectedTraining ? 'Failed to update training' : 'Failed to add training', 
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving training:', error);
      showNotification('An error occurred while saving the training', 'error');
    }
  };

  // Handle training delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedTraining) {
      setDeleteDialogOpen(false);
      showNotification('No training selected to delete', 'warning');
      return;
    }
    
    let success = false;
    
    // First try to use the id property directly
    if (selectedTraining.id) {
      success = await fetch(`${API_BASE_URL}/trainings/${selectedTraining.id}`, {
        method: 'DELETE',
      }).then(response => response.ok);
    } 
    // Fall back to using links
    else if (selectedTraining.links?.self?.href) {
      success = await deleteTraining(selectedTraining);
    }
    
    if (success) {
      await fetchData();
      showNotification('Training deleted successfully', 'success');
    } else {
      showNotification('Failed to delete training', 'error');
    }
    
    setDeleteDialogOpen(false);
  };

  // Prepare data for CSV export
  const exportData = useMemo(() => {
    return trainings.map(training => {
      const customerName = training.customer 
        ? `${training.customer.firstname} ${training.customer.lastname}` 
        : 'No Customer';
      
      return {
        date: formatDate(training.date),
        duration: training.duration,
        activity: training.activity,
        customer: customerName
      };
    });
  }, [trainings]);

  // Define CSV headers
  const csvHeaders = [
    { label: 'Date & Time', key: 'date' },
    { label: 'Duration (min)', key: 'duration' },
    { label: 'Activity', key: 'activity' },
    { label: 'Customer', key: 'customer' }
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Trainings
        </Typography>
        <Stack direction="row" spacing={2}>
          <CSVLink 
            data={exportData}
            headers={csvHeaders}
            filename={"trainings.csv"}
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
            onClick={handleAddTraining}
          >
            Add Training
          </Button>
        </Stack>
      </Box>
      
      <TextField
        label="Search Trainings"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by activity, customer name, or date"
      />
      
      <Box className="ag-theme-material" sx={{ height: 600, width: '100%', mt: 2 }}>
        <AgGridReact
          rowData={filteredTrainings}
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

      {/* Training Form Dialog */}
      <TrainingFormDialog
        open={trainingFormOpen}
        customers={customers}
        selectedCustomer={selectedTraining?.customer || null}
        training={selectedTraining || undefined}
        onSave={handleTrainingSave}
        onCancel={() => setTrainingFormOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Training"
        message={`Are you sure you want to delete this training session?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Paper>
  );
};

export default TrainingList; 