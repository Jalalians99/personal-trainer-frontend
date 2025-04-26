import { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper, Typography, Box, CircularProgress, Grid } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getTrainings } from '../services/api';
import { groupBy, sumBy } from 'lodash';
import { Training } from '../types';

const Statistics = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch trainings on component mount
  const fetchTrainings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTrainings();
      setTrainings(data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // Group and sum minutes by activity using lodash
  const activityStats = useMemo(() => {
    // Group trainings by activity
    const groupedByActivity = groupBy(trainings, 'activity');
    
    // Calculate total minutes for each activity
    return Object.entries(groupedByActivity).map(([activity, trainings]) => ({
      activity,
      minutes: sumBy(trainings, 'duration')
    }));
  }, [trainings]);

  // Get colors for each activity
  const getActivityColor = (activity: string): string => {
    const activityMap: { [key: string]: string } = {
      'Gym training': '#3788d8',
      'Fitness': '#9c27b0',
      'Spinning': '#f44336',
      'Zumba': '#4caf50',
      'Running': '#ff9800',
    };

    return activityMap[activity] || '#3788d8'; // Default blue if activity not found
  };

  // Calculate total minutes across all activities
  const totalMinutes = useMemo(() => {
    return sumBy(activityStats, 'minutes');
  }, [activityStats]);

  // Get COLORS array for pie chart
  const COLORS = useMemo(() => {
    return activityStats.map(stat => getActivityColor(stat.activity));
  }, [activityStats]);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px' 
        }}>
          <p style={{ margin: 0 }}><strong>{data.activity}</strong></p>
          <p style={{ margin: 0 }}>{`${data.minutes} minutes`}</p>
          <p style={{ margin: 0 }}>{`${(data.minutes / totalMinutes * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Activity Statistics
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Bar Chart */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Minutes by Activity
              </Typography>
              
              <Box sx={{ height: 500, width: '100%', mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityStats}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="activity" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      interval={0} 
                    />
                    <YAxis 
                      label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip formatter={(value) => [`${value} minutes`, 'Total']} />
                    <Legend />
                    <Bar 
                      dataKey="minutes" 
                      name="Minutes" 
                      fill="#8884d8"
                      radius={[5, 5, 0, 0]} 
                      // Dynamic colors based on activity
                      isAnimationActive={true}
                      animationDuration={1500}
                    >
                      {activityStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getActivityColor(entry.activity)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* Pie Chart */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Activity Distribution
              </Typography>
              
              <Box sx={{ height: 500, width: '100%', mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="minutes"
                      nameKey="activity"
                      label={(entry) => entry.activity}
                      animationDuration={1500}
                    >
                      {activityStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body1">
                Total training time: <strong>{totalMinutes} minutes</strong> ({(totalMinutes / 60).toFixed(1)} hours)
              </Typography>
              <Typography variant="body1">
                Number of different activities: <strong>{activityStats.length}</strong>
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default Statistics;
