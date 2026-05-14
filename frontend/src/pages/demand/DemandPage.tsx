import { type FormEvent, useEffect, useState } from 'react'

import { FaBolt, FaCheckCircle } from 'react-icons/fa'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import demandService from '@/services/demandService'
import locationService, { type Ward } from '@/services/locationService'
import postService, { type Post, type RoomType } from '@/services/postService'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const DemandPage = () => {
  const [wards, setWards] = useState<Ward[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadInitialData = async () => {
      const [wardResult, recommendationResult] = await Promise.allSettled([
        locationService.getWards(),
        postService.getRecommendedPosts({ limit: 4 })
      ])

      if (wardResult.status === 'fulfilled') setWards(wardResult.value)
      if (recommendationResult.status === 'fulfilled') setRecommendedPosts(recommendationResult.value.data)
    }

    void loadInitialData()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      await demandService.createOrUpdateDemand({
        wardId: Number(formData.get('wardId')),
        minPrice: Number(formData.get('minPrice')),
        maxPrice: Number(formData.get('maxPrice')),
        roomType: String(formData.get('roomType')) as RoomType,
        isLookingForRoommate: formData.get('isLookingForRoommate') === 'on',
        roommateGender: String(formData.get('roommateGender') || 'ANY'),
        rommateCriteria: String(formData.get('rommateCriteria') || 'Gần trường, an ninh tốt')
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
          <p className='text-sm font-extrabold uppercase tracking-[0.24em] text-[#FFC300]'>UNISTAY</p>
          <h1 className='mt-3 text-4xl font-black'>Nhu cầu thuê phòng</h1>
          <p className='mt-3 max-w-2xl text-gray-500'>
            Lưu ngân sách, khu vực và loại phòng để hệ thống ưu tiên các bài đăng phù hợp nhất.
          </p>
        </div>

        <section className='mt-8 grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)]'>
          <form onSubmit={handleSubmit} className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'>
            <div className='grid gap-5'>
              <label className='grid gap-2 text-sm font-bold'>
                Khu vực theo ward
                <select name='wardId' required className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'>
                  <option value=''>Chọn ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className='grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-2 text-sm font-bold'>
                  Giá tối thiểu
                  <input name='minPrice' type='number' defaultValue={1500000} className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]' />
                </label>
                <label className='grid gap-2 text-sm font-bold'>
                  Giá tối đa
                  <input name='maxPrice' type='number' defaultValue={3500000} className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]' />
                </label>
              </div>
              <label className='grid gap-2 text-sm font-bold'>
                Loại phòng
                <select name='roomType' className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'>
                  <option value='ROOM'>Phòng trọ</option>
                  <option value='APARTMENT'>Căn hộ</option>
                  <option value='HOUSE'>Nhà nguyên căn</option>
                </select>
              </label>
              <label className='flex items-center gap-3 rounded-xl bg-[#FFF7D6] px-4 py-3 text-sm font-bold'>
                <input name='isLookingForRoommate' type='checkbox' className='accent-[#FFC300]' />
                Tôi đang tìm bạn ở ghép
              </label>
              <label className='grid gap-2 text-sm font-bold'>
                Tiêu chí thêm
                <textarea
                  name='rommateCriteria'
                  defaultValue='Gần trường, an ninh tốt, giờ giấc tự do'
                  className='min-h-28 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFC300]'
                />
              </label>
              <input name='roommateGender' type='hidden' value='ANY' />
              <button type='submit' className='rounded-xl bg-[#001D3D] px-5 py-4 text-sm font-extrabold text-white'>
                Lưu nhu cầu và xem gợi ý
              </button>
            </div>
            {message ? <p className='mt-4 flex items-center gap-2 text-sm font-bold text-green-600'><FaCheckCircle />{message}</p> : null}
            {errorMessage ? <p className='mt-4 text-sm font-bold text-red-600'>{errorMessage}</p> : null}
          </form>

          <section className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'>
            <div className='flex items-center justify-between gap-5'>
              <h2 className='text-2xl font-black'>Gợi ý phù hợp</h2>
              <FaBolt className='text-2xl text-[#FFC300]' />
            </div>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              {recommendedPosts.map((post) => (
                <article key={post.id} className='rounded-xl border border-gray-100 p-4'>
                  <p className='text-xs font-extrabold uppercase text-[#FFC300]'>{post.roomType}</p>
                  <h3 className='mt-2 line-clamp-2 text-lg font-extrabold'>{post.title}</h3>
                  <p className='mt-2 text-sm text-gray-500'>{post.ward?.name || post.detailAddress}</p>
                  <p className='mt-3 font-black text-[#003566]'>{currencyFormatter.format(Number(post.price || 0))}</p>
                </article>
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
