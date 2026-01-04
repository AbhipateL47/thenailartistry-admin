import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.thenailartistry.store';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: This sends cookies with ALL requests
});

// Ensure credentials are sent with ALL requests (double-check)
apiClient.defaults.withCredentials = true;

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login if needed
      // The cookie will be cleared by the server
    }
    return Promise.reject(error);
  }
);

export default apiClient;

