import {
  FaArrowLeft,
  FaBed,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaFlag,
  FaHeadset,
  FaHeart,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhone,
  FaRegCommentDots,
  FaRegUserCircle,
  FaRulerCombined,
  FaShare,
  FaTag
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { background, dutPicture } from '@/assets/images'
import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'

const amenities = ['Ban công rộng', 'Cửa sổ', 'Máy giặt', 'Gác xép', 'Ban công rộng', 'Cửa sổ', 'Máy giặt', 'Giường']

const benefits = ['Nuôi thú cưng', 'Giờ giấc tự do', 'An ninh tốt', 'An toàn PCCC', 'Nuôi thú cưng', 'Giờ giấc tự do']

const MapPreview = () => (
  <section
    id='post-detail-map'
    data-lat='16.047079'
    data-lng='108.20623'
    className='relative h-[306px] overflow-hidden rounded-2xl border border-[#DCE7D9] bg-[#E6F5EA] shadow-md shadow-[#001D3D]/10'
  >
    <div className='absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(13,99,194,0.12)_1px,transparent_1px),linear-gradient(rgba(13,99,194,0.12)_1px,transparent_1px)] [background-size:64px_64px]' />
    <div className='absolute left-[-10%] top-[20%] h-28 w-[125%] -rotate-12 rounded-full bg-white/80' />
    <div className='absolute left-[18%] top-0 h-[120%] w-16 rotate-[28deg] bg-white/70' />
    <div className='absolute bottom-10 right-8 h-24 w-24 rounded-full border-[16px] border-[#CDEAD4]' />
    <div className='absolute left-[48%] top-[45%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#0D63C2] text-white shadow-lg shadow-[#0D63C2]/30'>
      <FaMapMarkerAlt />
    </div>
    <div className='absolute left-6 top-5 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-[#003566] shadow-sm'>
      Hòa Xuân, Cẩm Lệ
    </div>
  </section>
)

const ContactCard = () => (
  <section className='rounded-2xl bg-[#FFF4D5] p-7 shadow-lg shadow-[#001D3D]/10'>
    <div className='flex items-center gap-4'>
      <FaRegUserCircle className='text-6xl text-[#181A20]' />
      <div>
        <div className='flex items-center gap-2'>
          <h2 className='text-2xl font-extrabold text-[#3B3B3B]'>Lê Minh Trí</h2>
          <span className='grid h-5 w-5 place-items-center rounded-full bg-[#5AC76B] text-xs text-white'>✓</span>
        </div>
        <p className='mt-1 text-sm font-medium text-[#3B3B3B]'>
          Môi giới <span className='mx-2'>|</span> Đánh giá: 4.5 sao
        </p>
      </div>
    </div>
    <div className='mt-6 grid gap-4 sm:grid-cols-2'>
      <button className='flex items-center justify-center gap-3 rounded-full bg-[#D7B750] px-4 py-3 font-extrabold text-[#4B4220] shadow-md shadow-[#D7B750]/25'>
        <FaPhone />
        0000.000.000
      </button>
      <button className='flex items-center justify-center gap-3 rounded-full bg-[#D7B750] px-4 py-3 font-extrabold text-[#4B4220] shadow-md shadow-[#D7B750]/25'>
        <span className='grid h-7 w-7 place-items-center rounded-full bg-[#4AA3FF] text-xs font-bold text-white'>Zalo</span>
        Liên hệ Zalo
      </button>
    </div>
  </section>
)

const CommentPanel = () => (
  <section className='overflow-hidden rounded-2xl bg-[#FFF4D5] shadow-lg shadow-[#001D3D]/10'>
    <h2 className='border-b border-[#E8D8A6] px-8 py-4 text-2xl font-extrabold text-[#4B4220]'>Bình luận</h2>
    <div className='flex h-72 items-center justify-center'>
      <FaRegCommentDots className='text-8xl text-[#C8B984]' />
    </div>
    <form className='m-5 flex h-11 items-center rounded-full bg-white px-5'>
      <input className='min-w-0 flex-1 text-sm outline-none placeholder:text-gray-400' placeholder='Bình luận' />
      <button type='button' className='text-[#181A20]'>
        <FaPaperPlane />
      </button>
    </form>
  </section>
)

const InfoRow = ({ icon: Icon, label, value }: { icon: typeof FaBed; label: string; value: string }) => (
  <div className='grid grid-cols-[28px_190px_1fr] items-center gap-2 text-base'>
    <Icon className='text-[#4B5563]' />
    <span className='font-extrabold'>{label}</span>
    <span>{value}</span>
  </div>
)

const PostDetailPage = () => {
  return (
    <div className='min-h-screen bg-white text-[#181A20]'>
      <SiteHeader />

      <div className='border-b border-[#E6EAF0] bg-white'>
        <div className='mx-auto flex h-16 max-w-[1440px] items-center justify-between px-12'>
          <Link to='/home' className='grid h-10 w-10 place-items-center text-3xl'>
            <FaArrowLeft />
          </Link>
          <div className='flex items-center gap-8 text-3xl'>
            <button>
              <FaFlag />
            </button>
            <button>
              <FaHeadset />
            </button>
          </div>
        </div>
      </div>

      <main className='mx-auto grid max-w-[1320px] gap-8 px-8 py-10 lg:grid-cols-[740px_1fr]'>
        <section>
          <div className='relative overflow-hidden rounded-2xl shadow-lg shadow-[#001D3D]/10'>
            <img src={background} alt='Căn hộ cao cấp' className='h-[485px] w-full object-cover' />
            <button className='absolute left-7 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#D8C77A]/90 text-[#181A20]'>
              <FaChevronLeft />
            </button>
            <button className='absolute right-7 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#D8C77A]/90 text-[#181A20]'>
              <FaChevronRight />
            </button>
          </div>

          <div className='mt-4 grid grid-cols-5 gap-3'>
            {[0, 1, 2, 3, 4].map((item) => (
              <button key={item} className='relative overflow-hidden rounded-xl shadow-sm'>
                <img src={dutPicture} alt='Ảnh phòng' className='h-[82px] w-full object-cover' />
                {item === 4 && (
                  <span className='absolute inset-0 grid place-items-center bg-[#D8C77A]/70 text-xl text-[#181A20]'>
                    <FaChevronRight />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className='mt-5 flex items-start justify-between gap-6'>
            <div>
              <h1 className='max-w-2xl text-4xl font-extrabold leading-tight'>
                Căn hộ cao cấp giá học sinh sinh viên, view biển
              </h1>
              <p className='mt-4 text-4xl font-extrabold text-[#D9725E] drop-shadow-sm'>3.000.000 triệu/tháng</p>
            </div>
            <div className='mt-20 flex gap-5 text-4xl'>
              <button>
                <FaHeart />
              </button>
              <button>
                <FaShare />
              </button>
            </div>
          </div>

          <div className='mt-5 flex items-start gap-3'>
            <FaMapMarkerAlt className='mt-1 text-4xl' />
            <div>
              <p className='text-xl font-extrabold'>123 Văn Tiến Dũng</p>
              <p className='text-sm text-gray-600'>p. Hòa Xuân, q. Cẩm Lệ, tp. Đà Nẵng</p>
            </div>
          </div>

          <section className='mt-8 border-t border-[#6B7280] pt-5'>
            <h2 className='text-2xl font-extrabold'>Thông tin</h2>
            <div className='mt-4 grid gap-3'>
              <InfoRow icon={FaBed} label='Loại phòng:' value='Nhà trọ' />
              <InfoRow icon={FaTag} label='Tình trạng nội thất:' value='Mới' />
              <InfoRow icon={FaRulerCombined} label='Diện tích:' value='100' />
            </div>
          </section>

          <section className='mt-8 border-t border-[#6B7280] pt-5'>
            <h2 className='text-2xl font-extrabold'>Các tiện ích</h2>
            <div className='mt-4 grid grid-cols-2 gap-x-20 gap-y-3'>
              {amenities.map((item, index) => (
                <p key={`${item}-${index}`} className='flex items-center gap-4'>
                  <FaCheck className='text-sm' />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className='mt-8 border-t border-[#6B7280] pt-5'>
            <h2 className='text-2xl font-extrabold'>Các lợi ích</h2>
            <div className='mt-4 grid grid-cols-2 gap-x-20 gap-y-3'>
              {benefits.map((item, index) => (
                <p key={`${item}-${index}`} className='flex items-center gap-4'>
                  <FaCheck className='text-sm' />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className='mt-8 border-t border-[#6B7280] pt-5'>
            <h2 className='text-2xl font-extrabold'>Mô tả</h2>
            <p className='mt-4 max-w-[690px] text-lg leading-9'>
              &quot;Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.&quot;
            </p>
          </section>
        </section>

        <aside className='space-y-4'>
          <ContactCard />
          <MapPreview />
          <CommentPanel />
        </aside>
      </main>

      <SiteFooter />
    </div>
  )
}

export default PostDetailPage
