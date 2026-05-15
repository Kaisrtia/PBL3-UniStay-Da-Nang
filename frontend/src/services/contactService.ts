import api from './api'
import { type Post } from './postService'
import { type UserProfile } from './userService'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

export type AccommodationRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | string

export type ReceivedContactRequest = {
  postId: string
  userId: string
  status: AccommodationRequestStatus
  createdAt: string
  updatedAt?: string | null
  post: Post
  user: UserProfile
}

export type SentContactRequest = {
  postId: string
  userId: string
  status: AccommodationRequestStatus
  createdAt: string
  updatedAt?: string | null
  post: Post & {
    user?: UserProfile
  }
}

type Paginated<T> = {
  data: T[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

const buildQuery = (params?: { page?: number; limit?: number }) => {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.limit) search.set('limit', String(params.limit))
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const contactService = {
  getReceivedRequests: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<Paginated<ReceivedContactRequest>>>(
      `/posts/accommodation-requests/received${buildQuery(params)}`
    )
    return response.data.data || { data: [] }
  },

  getSentRequests: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<Paginated<SentContactRequest>>>(
      `/posts/accommodation-requests/sent${buildQuery(params)}`
    )
    return response.data.data || { data: [] }
  }
}

export default contactService
