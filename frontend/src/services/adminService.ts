import api from './api'
import { type PaginatedPosts, type Post, type PostStatus } from './postService'

export type AdminStatsPeriod = 'day' | 'week' | 'month'

export type AdminPostStatistic = {
  totalPosts?: number
  byStatus?: {
    status: PostStatus | string
    count: number
  }[]
  byRoomType?: {
    roomType: string
    count: number
  }[]
  byPurpose?: {
    purpose: string
    count: number
  }[]
  period?: AdminStatsPeriod
  since?: string
}

export type AdminUser = {
  id: string
  email: string
  fullName: string
  phone?: string | null
  avatarUrl?: string | null
  status?: string
  roles?: string[]
  createdAt?: string
}

export type PaginatedUsers = {
  data: AdminUser[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export type HostVerificationCandidate = {
  hostId: string
  totalPost?: number
  isVerified?: boolean
  avgStar?: string | number
  user?: {
    id: string
    email: string
    fullName: string
    phone?: string | null
    avatarUrl?: string | null
  } | null
}

export type PaginatedHostVerificationCandidates = {
  data: HostVerificationCandidate[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export type TackleReportPayload = {
  status: 'RESOLVED' | 'REJECTED'
  adminNote?: string
}

export type AdminReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED' | 'HIDDEN'

export type AdminReport = {
  id: string
  userId: string
  adminId?: string | null
  postId?: string | null
  commentId?: string | null
  reportedUserId: string
  reason: string
  status: AdminReportStatus
  adminNote?: string | null
  createdAt?: string
  tackledAt?: string | null
  user?: Pick<AdminUser, 'id' | 'email' | 'fullName' | 'avatarUrl'> | null
  reportedUser?: Pick<AdminUser, 'id' | 'email' | 'fullName' | 'avatarUrl' | 'status'> | null
  admin?: Pick<AdminUser, 'id' | 'email' | 'fullName'> | null
  post?: Pick<Post, 'id' | 'title' | 'status'> | null
  comment?: {
    id: string
    content: string
    status?: string
  } | null
}

export type PaginatedReports = {
  data: AdminReport[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export const adminService = {
  getPostStatistics: async (period: AdminStatsPeriod = 'day') => {
    const response = await api.get<ApiResponse<AdminPostStatistic>>(`/posts/admin/statistics?period=${period}`)
    return response.data.data || {}
  },

  getAdminPosts: async (params?: { status?: PostStatus | string; page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.status) search.set('status', params.status)
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<PaginatedPosts>>(`/posts/admin/all${query ? `?${query}` : ''}`)
    return response.data.data || { data: [] }
  },

  censorPost: async (postId: string, payload: { status: PostStatus | string; rejectionReason?: string }) => {
    const response = await api.patch<ApiResponse<Post>>(`/posts/${postId}/censor`, payload)
    return response.data
  },

  getUsers: async (params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<PaginatedUsers>>(`/users${query ? `?${query}` : ''}`)
    return response.data.data || { data: [] }
  },

  banUser: async (userId: string) => {
    const response = await api.patch<ApiResponse<null>>('/users/ban', { userId })
    return response.data
  },

  unbanUser: async (userId: string) => {
    const response = await api.patch<ApiResponse<null>>('/users/unban', { userId })
    return response.data
  },

  getReports: async (params?: { status?: AdminReportStatus | 'ALL'; page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.status && params.status !== 'ALL') search.set('status', params.status)
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<PaginatedReports>>(`/reports${query ? `?${query}` : ''}`)
    return response.data.data || { data: [] }
  },

  getHostVerificationCandidates: async (params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<PaginatedHostVerificationCandidates>>(
      `/users/hosts/verification-candidates${query ? `?${query}` : ''}`
    )
    return response.data.data || { data: [] }
  },

  verifyHost: async (hostId: string) => {
    const response = await api.patch<ApiResponse<HostVerificationCandidate>>('/users/hosts/verify', { hostId })
    return response.data
  },

  tackleReport: async (reportId: string, payload: TackleReportPayload) => {
    const response = await api.patch<ApiResponse<unknown>>(`/reports/${reportId}/tackle`, payload)
    return response.data
  }
}

export default adminService
