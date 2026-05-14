import { useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaHeart,
  FaHome,
  FaListAlt,
  FaPlusCircle,
  FaSearch,
  FaSlidersH,
  FaSignOutAlt,
  FaTimes,
  FaUsers
} from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'

import { logo } from '@/assets/images'
import { type AuthUser } from '@/services/authService'

type SiteHeaderProps = {
  accountLabel?: string
}

type FilterSelectProps = {
  label: string
  options?: string[]
}

type FilterChipProps = {
  children: ReactNode
  selected?: boolean
}

type HeaderUser = AuthUser & {
  fullName?: string
  email?: string
  roles?: string[]
}

const filterOptions = {
  districts: ['Tất cả', 'Hải Châu', 'Liên Chiểu', 'Cẩm Lệ', 'Sơn Trà', 'Ngũ Hành Sơn'],
  wards: ['Tất cả', 'Hòa Khánh Bắc', 'Hòa Xuân', 'An Hải Bắc', 'Mỹ An'],
  roomTypes: ['Tất cả', 'Trọ', 'Nhà nguyên căn', 'Chung cư'],
  listingTypes: ['Tất cả', 'Cho thuê', 'Cho ở ghép'],
  posters: ['Tất cả', 'Chủ trọ', 'Môi giới', 'Sinh viên'],
  furnishing: ['Không giới hạn', 'Mới', 'Đầy đủ nội thất', 'Cơ bản', 'Trống'],
  sources: ['Tất cả', 'Tin đã duyệt', 'Tin mới', 'Tin gần trường'],
  sorts: ['Tin mới nhất', 'Giá thấp đến cao', 'Giá cao đến thấp', 'Đánh giá cao']
}

const amenities = ['Ban công', 'Cửa sổ', 'Máy giặt', 'Gác xép', 'Wifi', 'Chỗ để xe']
const benefits = ['Nuôi thú cưng', 'Giờ giấc tự do', 'An ninh tốt', 'An toàn PCCC']
const universities = ['DUT', 'DUE', 'VKU', 'UED', 'DNU']

const parseStoredUser = (): HeaderUser | null => {
  const rawUser = localStorage.getItem('authUser')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as HeaderUser
  } catch {
    localStorage.removeItem('authUser')
    return null
  }
}

const getInitials = (name?: string, email?: string) => {
  const source = name || email || 'U'
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const FilterSelect = ({ label, options = ['Tất cả'] }: FilterSelectProps) => (
  <label className='block'>
    <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>{label}</span>
    <span className='relative mt-2 block'>
      <select className='h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-[#181A20] outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FaChevronDown className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400' />
    </span>
  </label>
)

const FilterChip = ({ children, selected = false }: FilterChipProps) => (
  <button
    type='button'
    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
      selected
        ? 'border-[#FFC300] bg-[#FFF1B8] text-[#6F5616]'
        : 'border-gray-200 bg-white text-gray-600 hover:border-[#FFC300] hover:text-[#6F5616]'
    }`}
  >
    {children}
  </button>
)

const AdvancedFilterPanel = ({ onClose }: { onClose: () => void }) => (
  <div className='absolute left-1/2 top-16 z-50 w-[min(92vw,760px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
    <div className='flex h-14 items-center justify-between border-b border-gray-100 px-5'>
      <button type='button' onClick={onClose} className='grid h-9 w-9 place-items-center rounded-full hover:bg-gray-100'>
        <FaTimes className='text-sm' />
      </button>
      <h2 className='text-lg font-extrabold'>Bộ lọc</h2>
      <span className='h-9 w-9' />
    </div>

    <div className='max-h-[72vh] overflow-y-auto px-6 py-5'>
      <section>
        <p className='text-sm font-extrabold'>Đã chọn</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <FilterChip selected>Đà Nẵng</FilterChip>
          <FilterChip selected>2 - 4 triệu</FilterChip>
          <FilterChip selected>Gần trường</FilterChip>
        </div>
      </section>

      <section className='mt-6 border-t border-gray-100 pt-6'>
        <h3 className='text-base font-extrabold'>Khu vực</h3>
        <div className='mt-4 grid gap-4 md:grid-cols-3'>
          <FilterSelect label='Tỉnh / Thành' options={['Đà Nẵng']} />
          <FilterSelect label='Quận / Huyện' options={filterOptions.districts} />
          <FilterSelect label='Phường / Xã' options={filterOptions.wards} />
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <FilterSelect label='Trường học' options={['Tất cả', ...universities]} />
          <label className='block'>
            <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Bán kính</span>
            <input
              type='range'
              min='1'
              max='10'
              defaultValue='5'
              className='mt-4 h-1 w-full accent-[#FFC300]'
            />
          </label>
        </div>
      </section>

      <section className='mt-6 border-t border-gray-100 pt-6'>
        <h3 className='text-base font-extrabold'>Loại tin</h3>
        <div className='mt-4 grid gap-4 md:grid-cols-3'>
          <FilterSelect label='Loại phòng' options={filterOptions.roomTypes} />
          <FilterSelect label='Loại tin' options={filterOptions.listingTypes} />
          <FilterSelect label='Người đăng' options={filterOptions.posters} />
        </div>
      </section>

      <section className='mt-6 border-t border-gray-100 pt-6'>
        <h3 className='text-base font-extrabold'>Giá thuê và đặc điểm</h3>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <label className='block'>
            <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Tối thiểu</span>
            <input
              className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
              placeholder='0đ'
            />
          </label>
          <label className='block'>
            <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Tối đa</span>
            <input
              className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
              placeholder='Không giới hạn'
            />
          </label>
          <label className='block'>
            <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Diện tích từ</span>
            <input
              className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
              placeholder='m²'
            />
          </label>
          <FilterSelect label='Tình trạng nội thất' options={filterOptions.furnishing} />
        </div>
      </section>

      <section className='mt-6 border-t border-gray-100 pt-6'>
        <h3 className='text-base font-extrabold'>Tiện ích</h3>
        <div className='mt-3 flex flex-wrap gap-2'>
          {amenities.map((item, index) => (
            <FilterChip key={item} selected={index < 2}>
              {item}
            </FilterChip>
          ))}
        </div>
        <h3 className='mt-5 text-base font-extrabold'>Lợi ích</h3>
        <div className='mt-3 flex flex-wrap gap-2'>
          {benefits.map((item, index) => (
            <FilterChip key={item} selected={index === 1}>
              {item}
            </FilterChip>
          ))}
        </div>
      </section>

      <section className='mt-6 border-t border-gray-100 pt-6'>
        <h3 className='text-base font-extrabold'>Tìm theo từ khóa</h3>
        <div className='relative mt-3'>
          <FaSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            className='h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
            placeholder='Nhập từ khóa tìm kiếm...'
          />
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <FilterSelect label='Nguồn tin' options={filterOptions.sources} />
          <FilterSelect label='Sắp xếp' options={filterOptions.sorts} />
        </div>
      </section>
    </div>

    <div className='sticky bottom-0 mt-6 flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4'>
      <button type='button' className='text-sm font-extrabold text-[#181A20] underline underline-offset-4'>
        Xóa tất cả
      </button>
      <Link
        to='/posts/search'
        onClick={onClose}
        className='flex items-center gap-2 rounded-xl bg-[#181A20] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#181A20]/20'
      >
        <FaSearch />
        Tìm kiếm
      </Link>
    </div>
  </div>
)

export const SiteHeader = ({ accountLabel = 'Đăng nhập' }: SiteHeaderProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isFavoriteOpen, setIsFavoriteOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [user, setUser] = useState<HeaderUser | null>(() => parseStoredUser())
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('accessToken')))
  const navigate = useNavigate()

  const isAuthenticated = hasToken || Boolean(user)
  const displayName = user?.fullName || user?.email || 'Tài khoản'
  const primaryRole = user?.roles?.find((role) => role !== 'USER') || user?.roles?.[0] || 'USER'
  const initials = useMemo(() => getInitials(user?.fullName, user?.email), [user?.email, user?.fullName])

  useEffect(() => {
    const syncAuthState = () => {
      setUser(parseStoredUser())
      setHasToken(Boolean(localStorage.getItem('accessToken')))
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('focus', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('focus', syncAuthState)
    }
  }, [])

  const closeHeaderMenus = () => {
    setIsAccountOpen(false)
    setIsFavoriteOpen(false)
    setIsNotificationOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('token')
    localStorage.removeItem('authUser')
    setUser(null)
    setHasToken(false)
    closeHeaderMenus()
    navigate('/login')
  }

  return (
    <header className='sticky top-0 z-30 bg-gradient-to-r from-[#000814] via-[#001D3D] to-[#003566] shadow-lg shadow-[#001D3D]/20'>
      <div className='mx-auto flex h-24 max-w-[1440px] items-center px-8'>
        <Link to='/home' className='mr-8 flex w-56 items-center'>
          <img src={logo} alt='UniStay' className='h-20 w-32 object-contain' />
        </Link>

        <button className='mr-5 grid h-11 w-11 place-items-center rounded-full bg-[#FFC300] text-[#001D3D] shadow-md'>
          <FaBars />
        </button>

        <div className='relative flex h-12 flex-1 max-w-[560px] items-center rounded-full border border-[#FFD60A]/20 bg-white px-5 shadow-sm'>
          <FaHome className='mr-3 text-[#001D3D]' />
          <input
            className='min-w-0 flex-1 border-none bg-transparent text-sm text-[#181A20] outline-none placeholder:text-gray-400'
            placeholder='Nhập vào từ khóa tìm kiếm'
          />
          <button
            type='button'
            onClick={() => setIsFilterOpen((current) => !current)}
            className='ml-4 flex items-center gap-2 text-sm font-bold text-[#181A20]'
          >
            <FaSlidersH className='text-[#001D3D]' />
            Nâng cao
          </button>
          <Link to='/posts/search' className='ml-4 grid h-9 w-9 place-items-center rounded-full bg-[#FFC300] text-white'>
            <FaSearch />
          </Link>

          {isFilterOpen && <AdvancedFilterPanel onClose={() => setIsFilterOpen(false)} />}
        </div>

        <div className='ml-5 flex items-center gap-4'>
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setIsFavoriteOpen((current) => !current)
                setIsNotificationOpen(false)
                setIsAccountOpen(false)
              }}
              className='grid h-11 w-11 place-items-center rounded-full bg-[#FFC300] text-white shadow-md'
              aria-label='Mở danh sách yêu thích'
            >
              <FaHeart />
            </button>

            {isFavoriteOpen && (
              <div className='absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                <div className='border-b border-gray-100 px-5 py-4'>
                  <p className='text-sm font-extrabold'>Bài đăng yêu thích</p>
                  <p className='mt-1 text-xs font-medium text-gray-500'>
                    {isAuthenticated
                      ? 'Các phòng đã lưu sẽ được đồng bộ với tài khoản của bạn.'
                      : 'Đăng nhập để lưu và quản lý phòng yêu thích.'}
                  </p>
                </div>
                <div className='p-3'>
                  <Link
                    to={isAuthenticated ? '/posts/search' : '/login'}
                    onClick={() => setIsFavoriteOpen(false)}
                    className='block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    {isAuthenticated ? 'Xem phòng phù hợp' : 'Đăng nhập để xem'}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setIsNotificationOpen((current) => !current)
                setIsFavoriteOpen(false)
                setIsAccountOpen(false)
              }}
              className='grid h-11 w-11 place-items-center rounded-full text-[#FFC300]'
              aria-label='Mở thông báo'
            >
              <FaBell className='text-3xl' />
            </button>

            {isNotificationOpen && (
              <div className='absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                <div className='border-b border-gray-100 px-5 py-4'>
                  <p className='text-sm font-extrabold'>Thông báo</p>
                  <p className='mt-1 text-xs font-medium text-gray-500'>
                    {isAuthenticated
                      ? 'Thông báo từ bài đăng, bình luận và yêu cầu thuê phòng sẽ hiện tại đây.'
                      : 'Đăng nhập để nhận thông báo theo tài khoản.'}
                  </p>
                </div>
                <div className='p-3 text-sm text-gray-500'>Chưa có thông báo mới.</div>
              </div>
            )}
          </div>

          <div className='relative'>
            {isAuthenticated ? (
              <button
                type='button'
                onClick={() => {
                  setIsAccountOpen((current) => !current)
                  setIsFavoriteOpen(false)
                  setIsNotificationOpen(false)
                }}
                className='flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/5 pl-1.5 pr-4 text-sm font-bold text-white transition hover:bg-white/10'
                aria-expanded={isAccountOpen}
              >
                <span className='grid h-9 w-9 place-items-center rounded-full bg-[#FFC300] text-xs font-extrabold text-[#001D3D]'>
                  {initials}
                </span>
                <span className='max-w-28 truncate'>{displayName}</span>
                <FaChevronDown className={`text-xs transition ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <Link to='/login' className='rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white'>
                {accountLabel}
              </Link>
            )}

            {isAuthenticated && isAccountOpen && (
              <div className='absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                <div className='bg-gradient-to-br from-[#001D3D] to-[#003566] px-5 py-5 text-white'>
                  <div className='flex items-center gap-3'>
                    <span className='grid h-12 w-12 place-items-center rounded-full bg-[#FFC300] text-sm font-extrabold text-[#001D3D]'>
                      {initials}
                    </span>
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-extrabold'>{displayName}</span>
                      <span className='mt-1 block text-xs font-semibold uppercase tracking-wide text-[#FFD60A]'>
                        {primaryRole}
                      </span>
                    </span>
                  </div>
                </div>

                <div className='grid p-3'>
                  <Link
                    to='/posts/create'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaPlusCircle className='text-[#FFC300]' />
                    Đăng tin mới
                  </Link>
                  <Link
                    to='/posts/me'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaListAlt className='text-[#003566]' />
                    Bài đăng của tôi
                  </Link>
                  <Link
                    to='/demands'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaSlidersH className='text-[#003566]' />
                    Nhu cầu và gợi ý
                  </Link>
                  {user?.roles?.includes('ADMIN') ? (
                    <Link
                      to='/admin/overview'
                      onClick={() => setIsAccountOpen(false)}
                      className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                    >
                      <FaUsers className='text-[#FFC300]' />
                      Trang quản trị
                    </Link>
                  ) : null}
                  <Link
                    to='/posts/search'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaHeart className='text-[#FFC300]' />
                    Yêu thích
                  </Link>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='mt-2 flex items-center gap-3 rounded-xl border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50'
                  >
                    <FaSignOutAlt />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export const SiteFooter = () => (
  <footer className='bg-gradient-to-b from-[#0D63C2] to-[#000814] px-8 py-12 text-white'>
    <div className='mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]'>
      <div>
        <div className='flex items-center gap-4'>
          <img src={logo} alt='UniStay' className='h-20 w-24 object-contain' />
          <span className='text-3xl font-extrabold text-[#FFD60A]'>UNISTAY</span>
        </div>
        <p className='mt-4 max-w-md text-sm leading-6 text-blue-100'>
          Website kết nối sinh viên và chủ trọ tại Đà Nẵng. Tìm kiếm phòng trọ, so sánh thông tin và kết nối bạn cùng
          phòng một cách minh bạch.
        </p>
      </div>
      <div>
        <h4 className='mb-4 text-lg font-bold text-[#FFD60A]'>Liên hệ</h4>
        <p className='text-sm leading-7 text-blue-100'>unistay.danang@gmail.com</p>
        <p className='text-sm leading-7 text-blue-100'>0123 456 789</p>
        <p className='text-sm leading-7 text-blue-100'>Đà Nẵng, Việt Nam</p>
      </div>
      <div>
        <h4 className='mb-4 text-lg font-bold text-[#FFD60A]'>Điều hướng</h4>
        <div className='grid gap-2 text-sm text-blue-100'>
          <Link to='/home'>Trang chủ</Link>
          <Link to='/home'>Bài đăng</Link>
          <Link to='/home'>Tìm bạn ở ghép</Link>
          <Link to='/home'>Hỗ trợ</Link>
        </div>
      </div>
    </div>
    <div className='mx-auto mt-10 max-w-6xl border-t border-white/10 pt-5 text-xs text-blue-100'>
      © {new Date().getFullYear()} UNISTAY Đà Nẵng. All rights reserved.
    </div>
  </footer>
)
