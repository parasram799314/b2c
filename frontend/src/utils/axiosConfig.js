import axios from 'axios'
import { auth } from '../firebase/config'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_URL
});

axiosInstance.interceptors.request.use(async (config) => {
  let token = null;
  const user = auth.currentUser;
  
  if (user) {
    try {
      token = await user.getIdToken(true);
    } catch (e) {
      console.error('Token fetch failed', e);
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

export default axiosInstance