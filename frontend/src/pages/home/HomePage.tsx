import {
  FaBolt,
  FaChevronDown,
  FaMapMarkerAlt,
  FaParking,
  FaRegHeart,
  FaShieldAlt,
  FaStar,
  FaWifi
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'

type Listing = {
  title: string
  location: string
  price: string
  meta: string[]
  purpose: string
  accent: string
}

type Area = {
  name: string
  count: string
  color: string
}

const listings: Listing[] = [
  {
    title: 'Căn hộ mini gần DUT, đầy đủ nội thất',
    location: 'Liên Chiểu, Đà Nẵng',
    price: '3.000.000đ/tháng',
    meta: ['28m²', 'Máy giặt', 'Ban công'],
    purpose: 'Đã duyệt',
    accent: 'from-[#0D63C2] to-[#003566]'
  },
  {
    title: 'Phòng trọ yên tĩnh cho sinh viên',
    location: 'Hải Châu, Đà Nẵng',
    price: '2.200.000đ/tháng',
    meta: ['22m²', 'Wifi', 'An ninh'],
    purpose: 'Mới đăng',
    accent: 'from-[#003566] to-[#001D3D]'
  },
  {
    title: 'Tìm nữ ở ghép gần trường Kinh tế',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    price: '1.500.000đ/tháng',
    meta: ['Ở ghép', 'Tự do', 'Gần trường'],
    purpose: 'Ở ghép',
    accent: 'from-[#FFD60A] to-[#FFC300]'
  }
]

const areas: Area[] = [
  { name: 'Hải Châu', count: '312 bài đăng phù hợp', color: '#0D63C2' },
  { name: 'Liên Chiểu', count: '286 bài đăng phù hợp', color: '#FFC300' },
  { name: 'Cẩm Lệ', count: '154 bài đăng phù hợp', color: '#003566' },
  { name: 'Sơn Trà', count: '129 bài đăng phù hợp', color: '#22C55E' }
]

const amenities = [
  { icon: FaWifi, label: 'Wifi mạnh' },
  { icon: FaParking, label: 'Chỗ để xe' },
  { icon: FaShieldAlt, label: 'An ninh tốt' },
  { icon: FaBolt, label: 'Giờ giấc tự do' }
]

const ListingCard = ({ listing }: { listing: Listing }) => (
  <Link
    to='/posts/MAPTEST_DUT_ROOM_001'
    className='block overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-lg shadow-[#001D3D]/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#001D3D]/10'
  >
    <div className={`relative h-48 bg-gradient-to-br ${listing.accent}`}>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.32),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_34%)]' />
      <span className='absolute left-4 top-4 rounded-full bg-[#FFC300] px-4 py-1.5 text-xs font-extrabold text-[#001D3D]'>
        {listing.purpose}
      </span>
      <span className='absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#003566]'>
        <FaRegHeart />
      </span>
    </div>
    <div className='p-5'>
      <h3 className='min-h-[56px] text-xl font-extrabold leading-7 text-[#181A20]'>{listing.title}</h3>
      <p className='mt-3 flex items-center gap-2 text-sm font-medium text-gray-500'>
        <FaMapMarkerAlt className='text-[#FFC300]' />
        {listing.location}
      </p>
      <div className='mt-5 flex items-center justify-between'>
        <p className='text-xl font-extrabold text-[#003566]'>{listing.price}</p>
        <div className='flex items-center gap-1 text-sm font-bold text-[#FFC300]'>
          <FaStar />
          4.8
        </div>
      </div>
      <div className='mt-4 flex flex-wrap gap-2'>
        {listing.meta.map((item) => (
          <span key={item} className='rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-gray-600'>
            {item}
          </span>
        ))}
      </div>
    </div>
  </Link>
)

const HomePage = () => {
  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />

      <main>
        <section className='relative overflow-hidden bg-gradient-to-br from-[#000814] via-[#001D3D] to-[#0D63C2] px-8 pb-28 pt-16 text-white'>
          <div className='absolute right-24 top-12 h-72 w-72 rounded-full bg-[#FFC300]/20 blur-3xl' />
          <div className='absolute bottom-8 left-8 h-64 w-64 rounded-full bg-[#0D63C2]/30 blur-3xl' />
          <div className='relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]'>
            <div>
              <p className='text-sm font-extrabold tracking-[0.28em] text-[#FFD60A]'>UNISTAY ĐÀ NẴNG</p>
              <h1 className='mt-6 max-w-3xl text-5xl font-extrabold leading-tight'>
                Tìm phòng trọ phù hợp cho sinh viên trong vài phút
              </h1>
              <p className='mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-100'>
                Khám phá phòng trọ, căn hộ và bạn cùng phòng quanh các trường đại học tại Đà Nẵng với bộ lọc theo khu
                vực, ngân sách và tiện ích.
              </p>
              <div className='mt-8 flex flex-wrap gap-4'>
                <button className='rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20'>
                  Tìm phòng ngay
                </button>
                <Link to='/posts/create' className='rounded-full bg-white px-7 py-3 font-extrabold text-[#003566]'>
                  Đăng tin mới
                </Link>
              </div>
            </div>

            <aside className='rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur'>
              <h2 className='text-2xl font-extrabold'>Tổng quan hôm nay</h2>
              <div className='mt-8 grid grid-cols-3 gap-5'>
                {[
                  ['1,240+', 'phòng hiển thị'],
                  ['18', 'khu vực'],
                  ['4.8/5', 'đánh giá']
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className='text-3xl font-extrabold text-[#FFD60A]'>{value}</p>
                    <p className='mt-2 text-sm font-medium text-blue-100'>{label}</p>
                  </div>
                ))}
              </div>
              <div className='mt-8 border-t border-white/20 pt-6 text-sm leading-6 text-blue-100'>
                Gợi ý được ưu tiên theo trường học, mức giá và tiện ích bạn thường tìm.
              </div>
            </aside>
          </div>
        </section>

        <section className='relative z-10 mx-auto -mt-16 max-w-7xl px-8'>
          <div className='grid gap-4 rounded-3xl border border-[#E6EAF0] bg-white p-6 shadow-2xl shadow-[#001D3D]/10 md:grid-cols-[1.3fr_0.9fr_0.9fr_0.75fr_auto]'>
            {[
              ['Từ khóa', 'Gần Đại học Bách Khoa'],
              ['Khu vực', 'Hải Châu'],
              ['Giá thuê', '2 - 4 triệu'],
              ['Loại phòng', 'Phòng trọ']
            ].map(([label, value]) => (
              <button
                key={label}
                className='flex min-h-[76px] items-center justify-between rounded-2xl border border-[#E6EAF0] px-5 text-left'
              >
                <span>
                  <span className='block text-xs font-bold text-gray-500'>{label}</span>
                  <span className='mt-1 block font-extrabold text-[#181A20]'>{value}</span>
                </span>
                <FaChevronDown className='text-[#FFC300]' />
              </button>
            ))}
            <button className='min-h-[76px] rounded-2xl bg-[#FFC300] px-8 font-extrabold text-[#001D3D]'>Tìm kiếm</button>
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 py-20'>
          <div className='flex items-end justify-between gap-6'>
            <div>
              <h2 className='text-4xl font-extrabold text-[#181A20]'>Bài đăng nổi bật</h2>
              <p className='mt-3 text-gray-500'>Các phòng đã được duyệt, có ảnh rõ ràng và thông tin giá minh bạch.</p>
            </div>
            <button className='rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white'>Xem tất cả</button>
          </div>

          <div className='mt-10 grid gap-7 lg:grid-cols-3'>
            {listings.map((listing) => (
              <ListingCard key={listing.title} listing={listing} />
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-20'>
          <div>
            <h2 className='text-4xl font-extrabold'>Khu vực được tìm kiếm nhiều</h2>
            <p className='mt-3 text-gray-500'>Bắt đầu từ những quận có nhiều lựa chọn phù hợp với sinh viên.</p>
          </div>
          <div className='mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {areas.map((area) => (
              <article
                key={area.name}
                className='rounded-2xl border border-[#E6EAF0] bg-white p-6 shadow-lg shadow-[#001D3D]/5'
              >
                <div className='h-1.5 w-16 rounded-full' style={{ backgroundColor: area.color }} />
                <h3 className='mt-8 text-2xl font-extrabold'>{area.name}</h3>
                <p className='mt-2 text-sm font-medium text-gray-500'>{area.count}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-24'>
          <div className='grid overflow-hidden rounded-3xl bg-[#001D3D] text-white lg:grid-cols-[1.1fr_0.9fr]'>
            <div className='p-10'>
              <h2 className='max-w-2xl text-4xl font-extrabold leading-tight'>
                Tạo nhu cầu thuê trọ để nhận gợi ý phù hợp hơn
              </h2>
              <p className='mt-5 max-w-2xl text-blue-100'>
                Lưu ngân sách, khu vực, trường học và tiêu chí bạn cùng phòng. UniStay sẽ ưu tiên những bài đăng khớp
                nhất.
              </p>
              <button className='mt-8 rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D]'>Tạo nhu cầu</button>
            </div>
            <div className='grid gap-4 bg-[#003566] p-10 sm:grid-cols-2'>
              {amenities.map(({ icon: Icon, label }) => (
                <div key={label} className='rounded-2xl bg-white/10 p-5'>
                  <Icon className='text-2xl text-[#FFD60A]' />
                  <p className='mt-4 font-bold'>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default HomePage
