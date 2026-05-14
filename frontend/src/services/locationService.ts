import api from './api'

export type Ward = {
  id: number
  name: string
}

type University = {
  id: string
  name: string
  ward?: Ward | null
}

type ApiResponse<T> = {
  success?: boolean
  data?: T
}

export const locationService = {
  getWards: async () => {
    const response = await api.get<ApiResponse<University[]>>('/locations/universities')
    const universities = response.data.data || []
    const wards = new Map<number, Ward>()

    universities.forEach((university) => {
      if (university.ward) {
        wards.set(university.ward.id, university.ward)
      }
    })

    return Array.from(wards.values())
  }
}

export default locationService
