import axios from 'axios'
import { auth } from '../firebase/config'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_URL
});

axiosInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken(true) // force refresh
      config.headers.Authorization = `Bearer ${token}`
    } catch (e) {
      console.error('Token fetch failed', e)
    }
  }
  return config
})

export default axiosInstance