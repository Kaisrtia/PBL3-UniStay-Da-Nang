import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:6969/api/v1').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
