import axios from 'axios'
import { auth } from '../firebase/config'

axios.interceptors.request.use(async (config) => {
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

export default axios