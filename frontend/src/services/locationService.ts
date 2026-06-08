import api from './api'

export type Ward = {
  id: number
  name: string
}

export type University = {
  id: string
  name: string
  ward?: Ward | null
  latitude?: string | number | null
  longitude?: string | number | null
}

type ApiResponse<T> = {
  success?: boolean
  data?: T
}

export const locationService = {
  getWards: async () => {
    const response = await api.get<ApiResponse<Ward[]>>('/locations/wards')
    return response.data.data || []
  },

  getUniversities: async () => {
    const response = await api.get<ApiResponse<University[]>>('/locations/universities')
    return response.data.data || []
  }
}

export default locationService
