import api from './api'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
  fullName: string
}

export type VerifyEmailPayload = {
  email: string
  code: string
}

export type SendEmailVerificationPayload = {
  email: string
}

export type GoogleLoginPayload = {
  idToken: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  newPassword: string
}

export type AuthUser = {
  id?: string
  email?: string
  fullName?: string
  roles?: string[]
  [key: string]: unknown
}

export type AuthResponse = {
  success?: boolean
  message?: string
  data?: {
    accessToken?: string
    token?: string
    user?: AuthUser
    [key: string]: unknown
  } | null
  accessToken?: string
  token?: string
  user?: AuthUser
  [key: string]: unknown
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login', payload)
    return response.data
  },

  googleLogin: async (payload: GoogleLoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login/google', payload)
    return response.data
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post<AuthResponse>('/auth/register', payload)
    return response.data
  },

  verifyEmail: async (payload: VerifyEmailPayload) => {
    const response = await api.patch<AuthResponse>('/auth/email-verification', payload)
    return response.data
  },

  sendEmailVerification: async (payload: SendEmailVerificationPayload) => {
    const response = await api.post<AuthResponse>('/auth/email-verification', payload)
    return response.data
  },

  sendForgotPassword: async (payload: ForgotPasswordPayload) => {
    const response = await api.post<AuthResponse>('/auth/forgot-password', payload)
    return response.data
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await api.patch<AuthResponse>('/auth/forgot-password', payload)
    return response.data
  }
}

export default authService
