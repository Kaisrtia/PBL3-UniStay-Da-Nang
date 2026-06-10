import api from './api'
import { type RoomType } from './postService'

export type DemandPriority = 'LOW' | 'MEDIUM' | 'HIGH'

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
  pricePriority?: DemandPriority
  locationPriority?: DemandPriority
  areaPriority?: DemandPriority
  roommatePriority?: DemandPriority
  roomTypePriority?: DemandPriority
  amenityPriority?: DemandPriority
}

export type SavedDemand = {
  studentId: string
  wardId?: number | null
  universityId?: string | null
  locationRadiusMeters: number
  minPrice: string | number
  maxPrice: string | number
  minArea?: string | number | null
  maxArea?: string | number | null
  roomType: RoomType
  isLookingForRoommate?: boolean
  roommateGender?: string | null
  rommateCriteria?: string | null
  pricePriority?: DemandPriority | null
  locationPriority?: DemandPriority | null
  areaPriority?: DemandPriority | null
  roommatePriority?: DemandPriority | null
  roomTypePriority?: DemandPriority | null
  amenityPriority?: DemandPriority | null
  student?: {
    demandAmenities?: Array<{
      amenityId: number
      amenity?: {
        id: number
        name: string
      }
    }>
  } | null
}

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

export const demandService = {
  getMyDemand: async () => {
    const response = await api.get<ApiResponse<SavedDemand>>('/demands/me')
    return response.data.data
  },

  createOrUpdateDemand: async (payload: DemandPayload) => {
    const response = await api.post<ApiResponse>('/demands', payload)
    return response.data
  }
}

export default demandService
