import api from './api'

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
