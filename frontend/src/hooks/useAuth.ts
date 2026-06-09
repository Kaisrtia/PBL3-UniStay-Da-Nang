import { useRef, useState } from 'react'

import axios from 'axios'

import authService, {
  type AuthResponse,
  type GoogleLoginPayload,
  type LoginPayload,
  type RegisterPayload
} from '@/services/authService'
import { translateAuthMessage } from '@/utils/authMessages'

type AuthAction = 'login' | 'register' | 'google'

export const getTokenFromAuthResponse = (response: AuthResponse) =>
  response.data?.accessToken || response.data?.token || response.accessToken || response.token

export const getUserFromAuthResponse = (response: AuthResponse) => response.data?.user || response.user

const getSuccessMessage = (action: AuthAction, response: AuthResponse) => {
  if (response.message) {
    return translateAuthMessage(response.message)
  }

  if (action === 'register') {
    return 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
  }

  return 'Đăng nhập thành công.'
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return translateAuthMessage(data?.error?.message || data?.message) || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
  }

  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const lastErrorRef = useRef('')

  const submitAuthRequest = async (action: AuthAction, payload: LoginPayload | RegisterPayload | GoogleLoginPayload) => {
    setLoading(true)
    setError('')
    setSuccess('')
    lastErrorRef.current = ''

    try {
      const response =
        action === 'login'
          ? await authService.login(payload as LoginPayload)
          : action === 'register'
            ? await authService.register(payload as RegisterPayload)
            : await authService.googleLogin(payload as GoogleLoginPayload)
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
      lastErrorRef.current = message
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = (payload: LoginPayload) => submitAuthRequest('login', payload)
  const register = (payload: RegisterPayload) => submitAuthRequest('register', payload)
  const loginWithGoogle = (payload: GoogleLoginPayload) => submitAuthRequest('google', payload)

  return {
    loading,
    error,
    success,
    login,
    register,
    loginWithGoogle,
    setError,
    setSuccess,
    getLastError: () => lastErrorRef.current
  }
}

export default useAuth
