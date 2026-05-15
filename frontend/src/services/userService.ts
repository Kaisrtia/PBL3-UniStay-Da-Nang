import api from './api'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

export type ProfileUniversity = {
  id: string
  name: string
  streetName?: string
  houseNumber?: string
}

export type UserProfile = {
  id: string
  email: string
  fullName: string
  phone?: string | null
  dob?: string | null
  gender?: string | null
  avatarUrl?: string | null
  emailVerified?: boolean | null
  phoneVerified?: boolean | null
  status?: string | null
  roles?: string[]
  student?: {
    studentId: string
    totalPost?: number
    universityId?: string | null
    university?: ProfileUniversity | null
  } | null
  hosts?: Array<{
    hostId: string
    totalPost?: number
    isVerified?: boolean
    avgStar?: string | number
  }>
}

export type UpdateProfilePayload = {
  fullName?: string
  phone?: string
  dob?: string
  gender?: string
  avatarUrl?: string
  universityId?: string
}

export type SetupProfilePayload = UpdateProfilePayload & {
  role: 'STUDENT' | 'HOST'
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export const userService = {
  getMyProfile: async () => {
    const response = await api.get<ApiResponse<UserProfile>>('/users/me')
    return response.data.data
  },

  setupProfile: async (payload: SetupProfilePayload) => {
    const response = await api.patch<ApiResponse<UserProfile>>('/users/setup', payload)
    return response.data
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const response = await api.patch<ApiResponse<UserProfile>>('/users/update', payload)
    return response.data
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await api.patch<ApiResponse<null>>('/users/password', payload)
    return response.data
  }
}

export default userService
