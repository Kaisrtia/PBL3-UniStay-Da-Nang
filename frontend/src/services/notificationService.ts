import api, { API_BASE_URL } from './api'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

export type AppNotification = {
  id: number
  userId: string
  title: string
  content?: string | null
  type: 'CENSOR_POST' | 'COMMENT' | 'ACCOMODATION_REQUEST' | 'REPORT' | 'SYSTEM'
  isRead: boolean
  metaData?: {
    postId?: string
    commentId?: string
    parentId?: string
    [key: string]: unknown
  } | null
  createdAt: string
  updatedAt?: string | null
}

export type NotificationListResponse = {
  data: AppNotification[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export const notificationService = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))

    const query = search.toString()
    const response = await api.get<ApiResponse<NotificationListResponse>>(
      `/notifications${query ? `?${query}` : ''}`
    )

    return response.data.data || { data: [] }
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.patch<ApiResponse<AppNotification>>(`/notifications/${notificationId}/read`)
    return response.data.data
  },

  markAllAsRead: async () => {
    const response = await api.patch<ApiResponse>('/notifications/read-all')
    return response.data
  },

  subscribe: (onNotification: (notification: AppNotification) => void, onError?: () => void) => {
    const token = localStorage.getItem('accessToken')

    if (!token || typeof EventSource === 'undefined') {
      return null
    }

    const stream = new EventSource(`${API_BASE_URL}/notifications/sse?token=${encodeURIComponent(token)}`)

    stream.onmessage = (event) => {
      try {
        onNotification(JSON.parse(event.data) as AppNotification)
      } catch {
        // Ignore malformed events so the stream can keep running.
      }
    }

    stream.onerror = () => {
      onError?.()
    }

    return stream
  }
}

export default notificationService
