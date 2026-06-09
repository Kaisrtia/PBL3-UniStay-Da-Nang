import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:6969/api/v1').replace(/\/$/, '')

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let refreshSessionRequest: Promise<string> | null = null

const clearStoredAuthSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('token')
  localStorage.removeItem('authUser')
  window.dispatchEvent(new Event('auth-user-updated'))
}

const shouldSkipRefresh = (config?: RetryableRequestConfig) => {
  const url = config?.url || ''

  return (
    Boolean(config?._skipAuthRefresh) ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/sessions/refresh') ||
    url.includes('/auth/email-verification') ||
    url.includes('/auth/forgot-password')
  )
}

const refreshSession = async () => {
  const response = await axios.post<{ data?: { accessToken?: string }; accessToken?: string }>(
    `${API_BASE_URL}/auth/sessions/refresh`,
    null,
    { withCredentials: true }
  )
  const accessToken = response.data.data?.accessToken || response.data.accessToken

  if (!accessToken) {
    throw new Error('Refresh response did not include an access token')
  }

  localStorage.setItem('accessToken', accessToken)
  window.dispatchEvent(new Event('auth-user-updated'))
  return accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshSessionRequest = refreshSessionRequest || refreshSession()
      const accessToken = await refreshSessionRequest
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      clearStoredAuthSession()
      return Promise.reject(refreshError)
    } finally {
      refreshSessionRequest = null
    }
  }
)

export default api
