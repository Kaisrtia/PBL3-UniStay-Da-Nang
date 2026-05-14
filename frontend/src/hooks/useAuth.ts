import { useState } from 'react'

import axios from 'axios'

import authService, { type AuthResponse, type LoginPayload, type RegisterPayload } from '@/services/authService'

type AuthAction = 'login' | 'register'

export const getTokenFromAuthResponse = (response: AuthResponse) =>
  response.data?.accessToken || response.data?.token || response.accessToken || response.token

export const getUserFromAuthResponse = (response: AuthResponse) => response.data?.user || response.user

const getSuccessMessage = (action: AuthAction, response: AuthResponse) => {
  if (response.message) {
    return response.message
  }

  return action === 'login'
    ? 'Dang nhap thanh cong.'
    : 'Dang ky thanh cong. Vui long kiem tra email de xac thuc tai khoan.'
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return data?.error?.message || data?.message || 'Khong the ket noi den may chu. Vui long thu lai.'
  }

  return 'Da co loi xay ra. Vui long thu lai.'
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submitAuthRequest = async (action: AuthAction, payload: LoginPayload | RegisterPayload) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response =
        action === 'login'
          ? await authService.login(payload as LoginPayload)
          : await authService.register(payload as RegisterPayload)
      const token = getTokenFromAuthResponse(response)

      if (token) {
        localStorage.setItem('accessToken', token)
      }

      const user = getUserFromAuthResponse(response)
      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user))
      }

      setSuccess(getSuccessMessage(action, response))
      return response
    } catch (authError) {
      const message = getErrorMessage(authError)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = (payload: LoginPayload) => submitAuthRequest('login', payload)
  const register = (payload: RegisterPayload) => submitAuthRequest('register', payload)

  return {
    loading,
    error,
    success,
    login,
    register,
    setError,
    setSuccess
  }
}

export default useAuth
