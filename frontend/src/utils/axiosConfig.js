import axios from 'axios'
import { auth } from '../firebase/config'

// Use environment variable if set, otherwise default to empty string for relative paths in production
// On local dev, setupProxy.js will handle /api calls.
const API_URL = process.env.REACT_APP_API_URL || '';

const axiosInstance = axios.create({
  baseURL: API_URL
});

console.log('[Axios] Base URL set to:', API_URL || '(relative)');

axiosInstance.interceptors.request.use(async (config) => {
  let token = null;
  const user = auth.currentUser;
  
  if (user) {
    try {
      token = await user.getIdToken(true);
    } catch (e) {
      console.error('[Axios] Token fetch failed', e);
    }
  } else {
    // Fallback to localStorage token if Firebase user is not loaded yet
    token = localStorage.getItem('fb_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Axios] API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance