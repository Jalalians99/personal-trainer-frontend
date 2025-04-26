import { useState, useEffect, useCallback, useRef, FC, useMemo } from 'react';
import { Paper, Typography, Box, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import { getTrainings, extractIdFromUrl, API_BASE_URL } from '../services/api';
import { Training } from '../types';

// Type definitions
type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
interface ActivityColor {
  [key: string]: string;
}

/**
 * Activity color mapping for visual distinction
 */
const ACTIVITY_COLORS: ActivityColor = {
  'Gym training': '#3788d8',
  'Fitness': '#9c27b0',
  'Spinning': '#f44336',
  'Zumba': '#4caf50',
  'Running': '#ff9800',
  'Yoga': '#e91e63',
  'Swimming': '#00bcd4',
  'Pilates': '#9e9e9e',
  // Default color is handled with fallback in getColorForActivity
};

/**
 * View selector component for the calendar
 */
const ViewSelector: FC<{
  view: CalendarViewType;
  onChange: (view: CalendarViewType) => void;
}> = ({ view, onChange }) => (
  <ToggleButtonGroup
    value={view}
    exclusive
    onChange={(_, newView) => newView && onChange(newView)}
    aria-label="calendar view"
  >
    <ToggleButton value="dayGridMonth" aria-label="month view">
      Month
    </ToggleButton>
    <ToggleButton value="timeGridWeek" aria-label="week view">
      Week
    </ToggleButton>
    <ToggleButton value="timeGridDay" aria-label="day view">
      Day
    </ToggleButton>
  </ToggleButtonGroup>
);

/**
 * Training Calendar Component
 * Displays trainings in a calendar format with various view options
 */
const TrainingCalendar: FC = () => {
  // State
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarViewType>('dayGridMonth');
  
  // Refs
  const calendarRef = useRef<FullCalendar | null>(null);

  /**
   * Fetch trainings from API
   */
  const fetchTrainings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTrainings();
      setTrainings(data);
    } catch (error) {
      // Error handling is silent but we log in the API service
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load and periodic refresh
  useEffect(() => {
    fetchTrainings();
    
    // Re-fetch trainings periodically to ensure they stay updated
    const intervalId = setInterval(() => {
      fetchTrainings();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId); // Clean up on unmount
  }, [fetchTrainings]);

  // Update calendar view when calendarView state changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(calendarView);
    }
  }, [calendarView]);

  /**
   * Get color for an activity type
   */
  const getColorForActivity = (activity: string): string => {
    return ACTIVITY_COLORS[activity] || '#3788d8'; // Default blue if activity not found
  };

  /**
   * Convert trainings to calendar events
   */
  const events: EventInput[] = useMemo(() => {
    return trainings
      .filter(training => Boolean(training.date)) // Filter out trainings with invalid dates
      .map(training => {
        const customerName = training.customer 
          ? `${training.customer.firstname} ${training.customer.lastname}`
          : 'No Customer';
        
        // Generate a unique ID
        let eventId: string;
        
        if (training.id) {
          eventId = training.id.toString();
          
          // If we have an ID but no links, create synthetic links
          if (!training.links?.self?.href) {
            training.links = {
              self: { href: `${API_BASE_URL}/trainings/${training.id}` },
              training: { href: `${API_BASE_URL}/trainings/${training.id}` },
              customer: { href: training.customer?.id ? `${API_BASE_URL}/customers/${training.customer.id}` : '' }
            };
          }
        } else if (training.links?.self?.href) {
          eventId = extractIdFromUrl(training.links.self.href) || '';
        } else {
          // Last resort - generate a random ID
          eventId = `training-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Parse the date safely
        const startDate = new Date(training.date);
        // Calculate end time (duration in minutes)
        const endDate = new Date(startDate.getTime() + (training.duration || 60) * 60000);
        
        return {
          id: eventId,
          title: `${training.activity} - ${customerName}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: getColorForActivity(training.activity),
          extendedProps: {
            training: training
          }
        };
      });
  }, [trainings]);

  /**
   * Handle calendar view change
   */
  const handleViewChange = (newView: CalendarViewType) => {
    setCalendarView(newView);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        width: '100%',
        position: 'relative' 
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" gutterBottom>
          Training Calendar
        </Typography>
        <ViewSelector view={calendarView} onChange={handleViewChange} />
      </Box>

      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '50%',
            padding: 2
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ height: 700, width: '100%' }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          nowIndicator={true}
          allDaySlot={false}
          height="100%"
        />
      </Box>
    </Paper>
  );
};

export default TrainingCalendar;
