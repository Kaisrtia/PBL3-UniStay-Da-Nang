import api from './api'

export type District = {
  id: number
  name: string
}

type ApiResponse<T> = {
  success?: boolean
  data?: T
}

export const locationService = {
  getDistricts: async () => {
    const response = await api.get<ApiResponse<District[]>>('/api/v1/locations/districts')
    return response.data.data || []
  }
}

export default locationService
