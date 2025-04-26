import axios from 'axios';
import { CustomerResponse, TrainingResponse, Customer, Training } from '../types';

/**
 * API configuration and endpoints
 */
export const API_BASE_URL = 'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';
const ENDPOINTS = {
  customers: `${API_BASE_URL}/customers`,
  trainings: `${API_BASE_URL}/trainings`,
  getTrainings: `${API_BASE_URL}/gettrainings`,
  reset: `${API_BASE_URL}/reset`
};

/**
 * Utility for handling API errors
 */
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Extract ID from a URL string
 */
export const extractIdFromUrl = (url?: string): string | null => {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1] || null;
};

/**
 * Get customer ID from customer object or links
 */
export const getCustomerId = (customer: Customer | string): string | null => {
  if (typeof customer === 'string') {
    return extractIdFromUrl(customer);
  }
  
  // Try to get ID from the self link first
  if (customer?.links?.self?.href) {
    return extractIdFromUrl(customer.links.self.href);
  }
  
  // Try to get ID from customer link
  if (customer?.links?.customer?.href) {
    return extractIdFromUrl(customer.links.customer.href);
  }
  
  return null;
};

/**
 * CUSTOMER API
 */

/**
 * Get all customers
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch(ENDPOINTS.customers);
    
    if (!response.ok) {
      throw new ApiError(`Failed to fetch customers: ${response.status}`, response.status);
    }
    
    const data: CustomerResponse = await response.json();
    
    if (!data?._embedded?.customers) {
      return [];
    }
    
    return data._embedded.customers.map((apiCustomer: any) => ({
      firstname: apiCustomer.firstname,
      lastname: apiCustomer.lastname,
      streetaddress: apiCustomer.streetaddress,
      postcode: apiCustomer.postcode,
      city: apiCustomer.city,
      email: apiCustomer.email,
      phone: apiCustomer.phone,
      links: {
        self: { href: apiCustomer._links?.self?.href || '' },
        customer: { href: apiCustomer._links?.customer?.href || '' },
        trainings: { href: apiCustomer._links?.trainings?.href || '' }
      }
    }));
  } catch (error) {
    // Return empty array instead of throwing to allow graceful UI recovery
    return [];
  }
};

/**
 * Add a new customer
 */
export const addCustomer = async (customer: Omit<Customer, 'links'>): Promise<boolean> => {
  try {
    const response = await fetch(ENDPOINTS.customers, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });

    return response.status === 201;
  } catch (error) {
    return false;
  }
};

/**
 * Find a customer by matching attributes
 */
export const findCustomerByData = async (customer: Customer): Promise<Customer | null> => {
  try {
    // Try to get the customer by ID if available
    const customerId = getCustomerId(customer);
    
    if (customerId) {
      try {
        const response = await fetch(`${ENDPOINTS.customers}/${customerId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Continue to fallback method if ID lookup fails
      }
    }
    
    // Fallback: find by matching properties
    const allCustomers = await getCustomers();
    
    const matchingCustomer = allCustomers.find(c => 
      c.firstname === customer.firstname && 
      c.lastname === customer.lastname && 
      c.email === customer.email
    );
    
    return matchingCustomer || null;
  } catch {
    return null;
  }
};

/**
 * Update an existing customer
 */
export const updateCustomer = async (customer: Customer): Promise<boolean> => {
  try {
    // Case 1: Customer has a self link
    if (customer.links?.self?.href) {
      const response = await fetch(customer.links.self.href, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      return response.ok;
    }
    
    // Case 2: Try to find the customer
    const customerId = getCustomerId(customer);
    if (customerId) {
      const response = await fetch(`${ENDPOINTS.customers}/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      return response.ok;
    }

    // Case 3: Find by matching data
    const matchingCustomer = await findCustomerByData(customer);
    if (matchingCustomer?.links?.self?.href) {
      const response = await fetch(matchingCustomer.links.self.href, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      return response.ok;
    }

    // Last resort: Add as new customer
    return addCustomer(customer);
  } catch {
    return false;
  }
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (customer: Customer | string): Promise<boolean> => {
  try {
    // Case 1: Handle string input (URL or ID)
    if (typeof customer === 'string') {
      // If it's a full URL
      if (customer.startsWith('http')) {
        const response = await fetch(customer, { method: 'DELETE' });
        return response.ok;
      }
      
      // If it's just an ID
      const response = await fetch(`${ENDPOINTS.customers}/${customer}`, { method: 'DELETE' });
      return response.ok;
    }
    
    // Case 2: Customer object with self link
    if (customer.links?.self?.href) {
      const response = await fetch(customer.links.self.href, { method: 'DELETE' });
      return response.ok;
    }

    // Case 3: Find customer by data
    const matchingCustomer = await findCustomerByData(customer);
    if (matchingCustomer?.links?.self?.href) {
      const response = await fetch(matchingCustomer.links.self.href, { method: 'DELETE' });
      return response.ok;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * TRAINING API
 */

/**
 * Get all trainings with customer data
 */
export const getTrainings = async (): Promise<Training[]> => {
  try {
    const response = await fetch(ENDPOINTS.getTrainings);
    
    if (!response.ok) {
      throw new ApiError('Failed to fetch trainings', response.status);
    }
    
    return await response.json();
  } catch {
    return [];
  }
};

/**
 * Add a new training
 */
export const addTraining = async (
  training: Omit<Training, 'links' | 'customer'> & { customer: string }
): Promise<boolean> => {
  try {
    // Ensure customer field is a full URL
    let customerUrl = training.customer;
    
    // If it's just an ID, construct the full URL
    if (!customerUrl.startsWith('http')) {
      customerUrl = `${ENDPOINTS.customers}/${training.customer}`;
    }
    
    const trainingPayload = {
      date: training.date,
      duration: training.duration,
      activity: training.activity,
      customer: customerUrl
    };
    
    const response = await fetch(ENDPOINTS.trainings, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingPayload),
    });

    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Update an existing training
 */
export const updateTraining = async (
  trainingId: string, 
  training: Omit<Training, 'links' | 'customer'> & { customer: string }
): Promise<boolean> => {
  try {
    // Ensure customer field is a full URL
    let customerUrl = training.customer;
    
    // If it's just an ID, construct the full URL
    if (!customerUrl.startsWith('http')) {
      customerUrl = `${ENDPOINTS.customers}/${training.customer}`;
    }
    
    const trainingPayload = {
      date: training.date,
      duration: training.duration,
      activity: training.activity,
      customer: customerUrl
    };
    
    const updateUrl = `${ENDPOINTS.trainings}/${trainingId}`;
    
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingPayload),
    });

    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Delete a training
 */
export const deleteTraining = async (training: Training | string): Promise<boolean> => {
  try {
    let deleteUrl: string;
    
    // Case 1: String input (URL or ID)
    if (typeof training === 'string') {
      deleteUrl = training.startsWith('http') 
        ? training 
        : `${ENDPOINTS.trainings}/${training}`;
    } 
    // Case 2: Training object with self link
    else if (training.links?.self?.href) {
      deleteUrl = training.links.self.href;
    }
    // Case 3: Training object with ID
    else if (training.id) {
      deleteUrl = `${ENDPOINTS.trainings}/${training.id}`;
    }
    // Case 4: Cannot determine URL
    else {
      return false;
    }
    
    const response = await fetch(deleteUrl, { method: 'DELETE' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Reset the database
 */
export const resetDatabase = async (): Promise<boolean> => {
  try {
    const response = await fetch(ENDPOINTS.reset, { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}; 