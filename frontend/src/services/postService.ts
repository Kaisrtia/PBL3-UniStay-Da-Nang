import api from './api'

export type RoomType = 'ROOM' | 'APARTMENT' | 'HOUSE'
export type PostPurpose = 'RENT' | 'FIND_ROOMMATE'
export type AmenityCondition = 'NEW' | 'GOOD' | 'OLD'

export type CreatePostPayload = {
  title: string
  wardId: number
  purpose: PostPurpose
  detailAddress: string
  area: number
  price: number
  deposit: number
  roomType: RoomType
  postPurpose: PostPurpose
  description: string
  latitude: number
  longitude: number
  postImages?: string[]
  postAmenities?: {
    amenityId: number
    currentCondition?: AmenityCondition
  }[]
}

export type PostResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  error?: {
    code?: number
    message?: string
  }
}

export const postService = {
  createPost: async (payload: CreatePostPayload) => {
    const response = await api.post<PostResponse>('/api/v1/posts', payload)
    return response.data
  }
}

export default postService
