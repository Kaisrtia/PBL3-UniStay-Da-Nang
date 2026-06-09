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
  fullName: string
  avatarUrl?: string | null
  role: string
  createdAt: string
  host?: {
    hostId?: string
    totalPost?: number
    isVerified?: boolean
    avgStar?: string | number
  } | null
  student?: {
    studentId: string
    totalPost?: number
    universityId?: string | null
    university?: ProfileUniversity | null
  } | null
  reviews?: HostReview[]
}

export type AuthenticatedUserProfile = Omit<UserProfile, 'role' | 'createdAt' | 'host'> & {
  email: string
  phone?: string | null
  dob?: string | null
  gender?: string | null
  avatarUrl?: string | null
  emailVerified?: boolean | null
  phoneVerified?: boolean | null
  provider?: string | null
  status?: string | null
  roles?: string[]
  hosts?: Array<{
    hostId: string
    totalPost?: number
    isVerified?: boolean
    avgStar?: string | number
  }>
  role?: string
  createdAt?: string
  host?: UserProfile['host']
}

export type HostReview = {
  id: string
  rating: number
  comment: string
  reviewerId: string
  hostId: string
  createdAt?: string
  updatedAt?: string | null
  reviewer?: {
    id: string
    fullName?: string
    avatarUrl?: string | null
  } | null
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

export type BlockedUserItem = {
  blockedUser: AuthenticatedUserProfile
  createdAt: string
}

export const userService = {
  getMyProfile: async () => {
    const response = await api.get<ApiResponse<AuthenticatedUserProfile>>('/users/me')
    return response.data.data
  },

  getUserProfile: async (userId: string) => {
    const response = await api.get<ApiResponse<UserProfile>>(`/users/${userId}`)
    return response.data.data
  },

  setupProfile: async (payload: SetupProfilePayload) => {
    const response = await api.patch<ApiResponse<AuthenticatedUserProfile>>('/users/setup', payload)
    return response.data
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const response = await api.patch<ApiResponse<AuthenticatedUserProfile>>('/users/update', payload)
    return response.data
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await api.patch<ApiResponse<null>>('/users/password', payload)
    return response.data
  },

  getBlockedUsers: async () => {
    const response = await api.get<ApiResponse<BlockedUserItem[]>>('/users/blocks')
    return response.data.data || []
  },

  blockUser: async (blockedId: string) => {
    const response = await api.post<ApiResponse>('/users/blocks', { blockedId })
    return response.data
  },

  unblockUser: async (blockedId: string) => {
    const response = await api.delete<ApiResponse>(`/users/blocks/${blockedId}`)
    return response.data
  },

  createHostReview: async (hostId: string, payload: { rating: number; comment: string }) => {
    const response = await api.post<ApiResponse<HostReview>>(`/users/${hostId}/reviews`, payload)
    return response.data
  }
}

export default userService
