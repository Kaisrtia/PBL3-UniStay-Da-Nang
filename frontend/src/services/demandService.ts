import api from './api'
import { type RoomType } from './postService'

export type DemandPayload = {
  wardId?: number
  universityId: string
  locationRadiusMeters: number
  minPrice: number
  maxPrice: number
  minArea?: number
  maxArea?: number
  roomType: RoomType
  isLookingForRoommate?: boolean
  roommateGender?: string
  rommateCriteria?: string
  amenityIds?: number[]
}

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

export const demandService = {
  createOrUpdateDemand: async (payload: DemandPayload) => {
    const response = await api.post<ApiResponse>('/demands', payload)
    return response.data
  }
}

export default demandService
