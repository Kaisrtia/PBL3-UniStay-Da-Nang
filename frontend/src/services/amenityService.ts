import api from './api'

export type Amenity = {
  id: number
  name: string
}

type ApiResponse<T> = {
  success?: boolean
  data?: T
}

export const amenityService = {
  getAmenities: async () => {
    const response = await api.get<ApiResponse<Amenity[]>>('/amenities')
    return response.data.data || []
  }
}

export default amenityService
