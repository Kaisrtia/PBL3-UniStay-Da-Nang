import { type FormEvent, useEffect, useState } from 'react'

import { FaArrowLeft, FaBolt, FaCheckCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import { defaultAmenityNames, defaultBenefitNames } from '@/constants/rentalFeatures'
import amenityService, { type Amenity } from '@/services/amenityService'
import demandService from '@/services/demandService'
import locationService, { type University } from '@/services/locationService'
import postService, { type Post, type RoomType } from '@/services/postService'

const fallbackAmenities: Amenity[] = defaultAmenityNames.map((name, index) => ({
  id: index + 1,
  name
}))

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const moneyInputFormatter = new Intl.NumberFormat('vi-VN')

const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, ''))

const formatMoneyInput = (value: string | number) => {
  const numericValue = typeof value === 'number' ? value : parseMoneyInput(value)
  return numericValue > 0 ? moneyInputFormatter.format(numericValue) : ''
}

const parseOptionalNumberInput = (value: FormDataEntryValue | null) => {
  const normalizedValue = String(value || '').trim().replace(',', '.')
  if (!normalizedValue) return undefined

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

const DemandPage = () => {
  const [universities, setUniversities] = useState<University[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>(fallbackAmenities)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([])
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [minPriceDisplay, setMinPriceDisplay] = useState(formatMoneyInput(1500000))
  const [maxPriceDisplay, setMaxPriceDisplay] = useState(formatMoneyInput(3500000))
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadInitialData = async () => {
      const [universityResult, amenityResult, recommendationResult] = await Promise.allSettled([
        locationService.getUniversities(),
        amenityService.getAmenities(),
        postService.getRecommendedPosts({ limit: 4 })
      ])

      if (universityResult.status === 'fulfilled') setUniversities(universityResult.value)
      if (amenityResult.status === 'fulfilled' && amenityResult.value.length > 0) setAmenities(amenityResult.value)
      if (recommendationResult.status === 'fulfilled') setRecommendedPosts(recommendationResult.value.data)
    }

    void loadInitialData()
  }, [])

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId) ? current.filter((id) => id !== amenityId) : [...current, amenityId]
    )
  }

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((current) =>
      current.includes(benefit) ? current.filter((item) => item !== benefit) : [...current, benefit]
    )
  }

  const handleMoneyInputChange = (value: string, setter: (nextValue: string) => void) => {
    setter(formatMoneyInput(value))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const selectedAmenityNames = amenities
      .filter((amenity) => selectedAmenityIds.includes(amenity.id))
      .map((amenity) => amenity.name)
    const criteria = [...selectedAmenityNames, ...selectedBenefits].join(', ')
    const universityId = String(formData.get('universityId') || '')
    const locationRadiusKm = parseOptionalNumberInput(formData.get('locationRadiusKm')) ?? 3
    const locationRadiusMeters = Math.round(locationRadiusKm * 1000)
    const minArea = parseOptionalNumberInput(formData.get('minArea'))
    const maxArea = parseOptionalNumberInput(formData.get('maxArea'))

    if (!universityId) {
      setErrorMessage('Hãy chọn trường đại học muốn ở gần.')
      return
    }

    if (locationRadiusMeters <= 0) {
      setErrorMessage('Bán kính quanh trường phải lớn hơn 0.')
      return
    }

    if (minArea !== undefined && maxArea !== undefined && minArea > maxArea) {
      setErrorMessage('Diện tích tối thiểu không được lớn hơn diện tích tối đa.')
      return
    }

    try {
      await demandService.createOrUpdateDemand({
        universityId,
        locationRadiusMeters,
        minPrice: parseMoneyInput(minPriceDisplay),
        maxPrice: parseMoneyInput(maxPriceDisplay),
        minArea,
        maxArea,
        roomType: String(formData.get('roomType')) as RoomType,
        isLookingForRoommate: formData.get('isLookingForRoommate') === 'on',
        roommateGender: String(formData.get('roommateGender') || 'ANY'),
        rommateCriteria: criteria || 'Không có tiêu chí thêm',
        amenityIds: selectedAmenityIds
      })

      const recommendations = await postService.getRecommendedPosts({ limit: 4 })
      setRecommendedPosts(recommendations.data)
      setMessage('Đã lưu nhu cầu thuê và cập nhật gợi ý phù hợp.')
    } catch {
      setErrorMessage('Không lưu được nhu cầu. Hãy đăng nhập bằng tài khoản sinh viên.')
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-7xl px-8 py-10'>
        <div>
          <Link
            to='/home'
            aria-label='Quay lại trang chủ'
            title='Quay lại trang chủ'
            className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
          >
            <FaArrowLeft />
          </Link>
          <p className='text-sm font-extrabold uppercase tracking-[0.24em] text-[#FFC300]'>UNISTAY</p>
          <h1 className='mt-3 text-4xl font-black'>Nhu cầu thuê phòng</h1>
          <p className='mt-3 max-w-2xl text-gray-500'>
            Lưu ngân sách, trường muốn ở gần, bán kính tìm kiếm, diện tích và tiện ích để hệ thống ưu tiên bài đăng phù hợp nhất.
          </p>
        </div>

        <section className='mt-8 grid gap-8 lg:grid-cols-[520px_minmax(0,1fr)]'>
          <form onSubmit={handleSubmit} className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'>
            <div className='grid gap-5'>
              <label className='grid gap-2 text-sm font-bold'>
                Gần trường đại học
                <select
                  name='universityId'
                  required
                  className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                >
                  <option value=''>Chọn trường</option>
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className='grid gap-2 text-sm font-bold'>
                Bán kính quanh trường (km)
                <input
                  name='locationRadiusKm'
                  type='number'
                  min='0.5'
                  step='0.5'
                  defaultValue='3'
                  required
                  className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                  placeholder='3'
                />
              </label>

              <div className='grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-2 text-sm font-bold'>
                  Giá tối thiểu
                  <input
                    name='minPrice'
                    type='text'
                    inputMode='numeric'
                    value={minPriceDisplay}
                    onChange={(event) => handleMoneyInputChange(event.target.value, setMinPriceDisplay)}
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                    placeholder='1.500.000'
                  />
                </label>
                <label className='grid gap-2 text-sm font-bold'>
                  Giá tối đa
                  <input
                    name='maxPrice'
                    type='text'
                    inputMode='numeric'
                    value={maxPriceDisplay}
                    onChange={(event) => handleMoneyInputChange(event.target.value, setMaxPriceDisplay)}
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                    placeholder='3.500.000'
                  />
                </label>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-2 text-sm font-bold'>
                  Diện tích tối thiểu (m²)
                  <input
                    name='minArea'
                    type='number'
                    inputMode='decimal'
                    min='1'
                    step='0.5'
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                    placeholder='18'
                  />
                </label>
                <label className='grid gap-2 text-sm font-bold'>
                  Diện tích tối đa (m²)
                  <input
                    name='maxArea'
                    type='number'
                    inputMode='decimal'
                    min='1'
                    step='0.5'
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                    placeholder='35'
                  />
                </label>
              </div>

              <label className='grid gap-2 text-sm font-bold'>
                Loại phòng
                <select
                  name='roomType'
                  className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                >
                  <option value='ROOM'>Phòng trọ</option>
                  <option value='APARTMENT'>Căn hộ</option>
                  <option value='HOUSE'>Nhà nguyên căn</option>
                </select>
              </label>

              <label className='flex items-center gap-3 rounded-xl bg-[#FFF7D6] px-4 py-3 text-sm font-bold'>
                <input name='isLookingForRoommate' type='checkbox' className='accent-[#FFC300]' />
                Tôi đang tìm bạn ở ghép
              </label>

              <section className='grid gap-3'>
                <h2 className='text-sm font-bold'>Tiện ích mong muốn</h2>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {amenities.map((amenity) => (
                    <label
                      key={amenity.id}
                      className='flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm font-bold'
                    >
                      <input
                        type='checkbox'
                        checked={selectedAmenityIds.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className='h-4 w-4 accent-[#001D3D]'
                      />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </section>

              <section className='grid gap-3'>
                <h2 className='text-sm font-bold'>Lợi ích ưu tiên</h2>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {defaultBenefitNames.map((benefit) => (
                    <label
                      key={benefit}
                      className='flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm font-bold'
                    >
                      <input
                        type='checkbox'
                        checked={selectedBenefits.includes(benefit)}
                        onChange={() => toggleBenefit(benefit)}
                        className='h-4 w-4 accent-[#001D3D]'
                      />
                      {benefit}
                    </label>
                  ))}
                </div>
              </section>

              <input name='roommateGender' type='hidden' value='ANY' />
              <button type='submit' className='rounded-xl bg-[#001D3D] px-5 py-4 text-sm font-extrabold text-white'>
                Lưu nhu cầu và xem gợi ý
              </button>
            </div>
            {message ? (
              <p className='mt-4 flex items-center gap-2 text-sm font-bold text-green-600'>
                <FaCheckCircle />
                {message}
              </p>
            ) : null}
            {errorMessage ? <p className='mt-4 text-sm font-bold text-red-600'>{errorMessage}</p> : null}
          </form>

          <section className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'>
            <div className='flex items-center justify-between gap-5'>
              <h2 className='text-2xl font-black'>Gợi ý phù hợp</h2>
              <FaBolt className='text-2xl text-[#FFC300]' />
            </div>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              {recommendedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className='block rounded-xl border border-gray-100 p-4 transition hover:-translate-y-0.5 hover:border-[#FFC300] hover:shadow-lg hover:shadow-[#001D3D]/10'
                >
                  <p className='text-xs font-extrabold uppercase text-[#FFC300]'>{post.roomType}</p>
                  <h3 className='mt-2 line-clamp-2 text-lg font-extrabold'>{post.title}</h3>
                  <p className='mt-2 text-sm text-gray-500'>{post.ward?.name || post.detailAddress}</p>
                  <p className='mt-3 font-black text-[#003566]'>{currencyFormatter.format(Number(post.price || 0))}</p>
                </Link>
              ))}
              {recommendedPosts.length === 0 ? (
                <p className='rounded-xl bg-gray-50 p-5 text-sm font-bold text-gray-500 sm:col-span-2'>
                  Chưa có gợi ý. Hãy lưu nhu cầu thuê trước.
                </p>
              ) : null}
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default DemandPage
