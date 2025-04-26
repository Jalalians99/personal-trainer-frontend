import dayjs from 'dayjs';

// Format date to dd.mm.yyyy hh:mm format
export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('DD.MM.YYYY HH:mm');
};

// Format date for API requests
export const formatDateForAPI = (date: Date): string => {
  return dayjs(date).toISOString();
}; 