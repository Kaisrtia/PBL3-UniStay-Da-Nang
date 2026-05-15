import api from './api'
import { type PaginatedPosts } from './postService'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  error?: {
    code?: number
    message?: string
  }
}

export const engagementService = {
  getFavouritePosts: async (params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<PaginatedPosts>>(`/posts/favourites${query ? `?${query}` : ''}`)
    return response.data.data || { data: [] }
  },

  addFavouritePost: async (postId: string) => {
    const response = await api.post<ApiResponse>('/posts/favourites', { postId })
    return response.data
  },

  removeFavouritePost: async (postId: string) => {
    const response = await api.delete<ApiResponse>(`/posts/favourites/${postId}`)
    return response.data
  },

  createAccommodationRequest: async (postId: string) => {
    const response = await api.post<ApiResponse>('/posts/accommodation-requests', { postId })
    return response.data
  },

  createComment: async (postId: string, content: string) => {
    const response = await api.post<ApiResponse>('/comments', { postId, content })
    return response.data
  },

  createReport: async (postId: string, reason: string) => {
    const response = await api.post<ApiResponse>('/reports', { postId, reason })
    return response.data
  }
}

export default engagementService
