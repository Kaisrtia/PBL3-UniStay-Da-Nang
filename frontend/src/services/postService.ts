import api from './api'

export type RoomType = 'ROOM' | 'APARTMENT' | 'HOUSE'
export type PostPurpose = 'RENT' | 'FIND_ROOMMATE'
export type AmenityCondition = 'NEW' | 'GOOD' | 'OLD'
export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPDATED' | 'HIDDEN'

export type PostImage = {
  id: number
  postId: string
  imageUrl: string
}

export type PostAmenity = {
  postId?: string
  amenityId: number
  currentCondition?: AmenityCondition
  amenity?: {
    id: number
    name: string
  }
}

export type Ward = {
  id: number
  name: string
}

export type HostInfo = {
  isVerified?: boolean
}

export type PostOwner = {
  id: string
  fullName?: string
  phone?: string | null
  avatarUrl?: string | null
  hosts?: HostInfo[]
  roles?: string[]
}

export type Post = {
  id: string
  title: string
  userId?: string
  wardId?: number
  purpose?: PostPurpose | string
  detailAddress: string
  exactAddress?: string | null
  city?: string | null
  area: string | number
  price: string | number
  deposit?: string | number
  roomType?: RoomType | string
  postPurpose?: PostPurpose | string
  description?: string
  latitude?: string | number
  longitude?: string | number
  status?: PostStatus | string
  createdAt?: string
  updatedAt?: string | null
  postImages?: PostImage[]
  postAmenities?: PostAmenity[]
  ward?: Ward
  user?: PostOwner
  _count?: {
    comments?: number
    reports?: number
  }
}

export type PostFilters = {
  userId?: string
  purpose?: PostPurpose
  wardId?: number
  keyword?: string
  minArea?: number
  maxArea?: number
  minPrice?: number
  maxPrice?: number
  roomType?: RoomType
  verifiedHost?: boolean
  amenities?: number[]
  hasMedia?: boolean
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'price' | 'area' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
}

export type PaginatedPosts = {
  data: Post[]
  meta?: {
    totalItems?: number
    itemCount?: number
    itemsPerPage?: number
    currentPage?: number
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export type NearbyPost = Post & {
  distanceKm: number
}

export type NearbyPostFilters = {
  lat: number
  lng: number
  radiusKm: number
  limit?: number
}

export type NearbyPostsResponse = {
  data: NearbyPost[]
  meta?: {
    total?: number
    limit?: number
    radiusKm?: number
    origin?: {
      latitude?: number
      longitude?: number
    }
  }
}

export type RoutePathFilters = {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}

export type RoutePath = {
  distanceKm: number
  durationMinutes: number
  geometry: [number, number][]
}

export type CreatePostPayload = {
  title: string
  wardId: number
  purpose: PostPurpose
  detailAddress: string
  exactAddress?: string
  city?: string
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

const buildPostQuery = (filters: Record<string, unknown> = {}) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','))
      }
      return
    }

    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}

export const postService = {
  getPosts: async (filters?: PostFilters) => {
    const response = await api.get<PostResponse<PaginatedPosts>>(`/posts${buildPostQuery(filters)}`)
    return response.data.data || { data: [] }
  },

  getPostDetail: async (postId: string) => {
    const response = await api.get<PostResponse<Post>>(`/posts/${postId}`)
    return response.data.data
  },

  getRecommendedPosts: async (filters?: Pick<PostFilters, 'page' | 'limit'>) => {
    const response = await api.get<PostResponse<PaginatedPosts>>(`/posts/recommendations${buildPostQuery(filters)}`)
    return response.data.data || { data: [] }
  },

  getNearbyPosts: async (filters: NearbyPostFilters) => {
    const response = await api.get<PostResponse<NearbyPostsResponse>>(`/posts/nearby${buildPostQuery(filters)}`)
    return response.data.data || { data: [] }
  },

  getRoutePath: async (filters: RoutePathFilters) => {
    const response = await api.get<PostResponse<RoutePath>>(`/posts/route${buildPostQuery(filters)}`)
    return response.data.data
  },

  getMyPosts: async (filters?: Pick<PostFilters, 'page' | 'limit'>) => {
    const response = await api.get<PostResponse<PaginatedPosts>>(`/posts/me${buildPostQuery(filters)}`)
    return response.data.data || { data: [] }
  },

  createPost: async (payload: CreatePostPayload) => {
    const response = await api.post<PostResponse>('/posts', payload)
    return response.data
  },

  updatePost: async (postId: string, payload: Partial<CreatePostPayload>) => {
    const response = await api.patch<PostResponse<Post>>(`/posts/${postId}`, payload)
    return response.data
  },

  hidePost: async (postId: string) => {
    const response = await api.patch<PostResponse<Post>>(`/posts/${postId}/hide`)
    return response.data
  },

  deletePost: async (postId: string) => {
    const response = await api.delete<PostResponse>(`/posts/${postId}`)
    return response.data
  }
}

export default postService
