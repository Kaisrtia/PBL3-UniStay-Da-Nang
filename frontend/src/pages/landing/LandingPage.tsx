import { useState } from 'react'

import { FaClock, FaHome, FaSearch, FaUserFriends } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'

import { background, logo } from '@/assets/images'
import { type PostPurpose } from '@/services/postService'

type SearchMode = 'all' | PostPurpose

const LandingPage = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('all')

  const getModeClass = (mode: SearchMode) =>
    `px-3 py-1 rounded text-xs font-semibold ${searchMode === mode ? 'bg-gray-200' : 'hover:bg-gray-100'}`

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (searchMode !== 'all') params.set('purpose', searchMode)

    navigate(params.toString() ? `/posts/search?${params.toString()}` : '/posts/search')
  }

  return (
    <div className='relative overflow-x-hidden'>
      <img src={background} alt='Background' className='absolute inset-0 -z-10 h-full w-full object-cover' />
      <div className='inset-0 -z-10 bg-gradient-to-b from-[#0D63C2] to-[#000814]' />
      <header className='flex flex-wrap items-center justify-between gap-4 bg-transparent px-5 py-5 md:px-8 md:py-6'>
        <div className='flex items-center gap-2'>
          <img src={logo} alt='Unistay Logo' className='h-16 w-28 object-contain' />
          <span className='text-white font-bold text-xl font-serif'>UNISTAY</span>
        </div>
        <nav className='flex flex-wrap items-center gap-3 text-sm text-white md:gap-6'>
          <a href='#info-section' className='hover:text-yellow-400 px-4 py-2'>
            Giới thiệu
          </a>
          <a href='#feature-section' className='hover:text-yellow-400 px-4 py-2'>
            Lợi ích
          </a>
          <a href='#footer' className='hover:text-yellow-400 px-4 py-2'>
            Thông tin
          </a>
          <Link
            to='/login'
            className='bg-white text-[#0a183d] px-4 py-2 rounded-md font-bold hover:bg-yellow-400 hover:text-white transition inline-block'
          >
            Đăng nhập / Đăng ký
          </Link>
        </nav>
      </header>

      <section className='flex flex-col items-center justify-center px-4 pb-24 pt-16 text-center md:pb-32 md:pt-20'>
        <h2 className='text-white text-lg tracking-widest mb-2 font-brand font-semibold'>
          TÌM KIẾM NHÀ TRỌ VÀ KẾT NỐI SINH VIÊN
        </h2>
        <h1 className='text-5xl font-bold text-yellow-400 mb-2 font-serif'>UNISTAY</h1>
        <h3 className='text-white text-xl mb-8 font-brand font-semibold'>TẠI ĐÀ NẴNG</h3>
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-white p-2 shadow-lg sm:flex-row sm:items-center'>
          <div className='flex shrink-0 gap-2 sm:mr-2'>
            <button type='button' onClick={() => setSearchMode('all')} className={getModeClass('all')}>
              Tất cả
            </button>
            <button type='button' onClick={() => setSearchMode('RENT')} className={getModeClass('RENT')}>
              Môi giới
            </button>
            <button
              type='button'
              onClick={() => setSearchMode('FIND_ROOMMATE')}
              className={getModeClass('FIND_ROOMMATE')}
            >
              Sinh viên
            </button>
          </div>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            className='min-w-0 flex-1 px-4 py-2 text-sm outline-none'
            placeholder='Nhập vào từ khoá tìm kiếm'
          />
          <button
            type='button'
            onClick={() => navigate('/posts/search')}
            className='flex shrink-0 items-center justify-center gap-1 rounded bg-gray-100 px-3 py-2 text-xs font-semibold sm:mr-2'
          >
            <FaSearch className='text-gray-500' />
            Nâng cao
          </button>
          <button type='button' onClick={handleSearch} className='rounded bg-yellow-400 p-2 text-white'>
            <FaSearch />
          </button>
        </div>
      </section>

      <section id='info-section' className='scroll-mt-20 py-16 bg-white'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-2xl font-bold mb-4 text-[#0a183d]'>TÌM KIẾM PHÒNG TRỌ PHÙ HỢP NHẤT</h2>
          <p className='text-gray-600 mb-6'>
            Unistay giúp sinh viên dễ dàng tìm kiếm, so sánh và lựa chọn phòng trọ phù hợp tại Đà Nẵng.
            <br />
            Chúng tôi kết nối bạn với chủ trọ uy tín, cập nhật thông tin và hỗ trợ tận tình trong quá trình tìm kiếm.
          </p>
          <ul className='mb-6 space-y-2 text-left inline-block'>
            <li className='flex items-center gap-2'>
              <span className='text-yellow-400 text-lg'>•</span> Nhiều lựa chọn phòng trọ đa dạng, giá cả công khai
            </li>
            <li className='flex items-center gap-2'>
              <span className='text-yellow-400 text-lg'>•</span> Kết nối bạn cùng phòng, hỗ trợ nhanh chóng
            </li>
            <li className='flex items-center gap-2'>
              <span className='text-yellow-400 text-lg'>•</span> Đăng tin miễn phí, quản lý thông tin dễ dàng
            </li>
          </ul>
        </div>
      </section>

      <section id='feature-section' className='scroll-mt-20 bg-white py-16'>
        <div className='max-w-4xl mx-auto text-center mb-12'>
          <h2 className='text-2xl font-bold mb-2'>UNISTAY CÓ THỂ GIÚP BẠN</h2>
          <p className='text-gray-500 text-sm'>Lợi ích khi sử dụng Unistay</p>
        </div>
        <div className='flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto'>
          <div className='flex-1 bg-gray-50 rounded-lg p-8 flex flex-col items-center shadow hover:shadow-lg transition'>
            <FaHome className='text-4xl text-yellow-400 mb-4' />
            <h3 className='font-semibold mb-2'>Giá cả công khai</h3>
            <p className='text-gray-500 text-sm mb-4'>
              Giá cả hoàn toàn được công khai, từ bảng giá đến chi phí phát sinh, giúp bạn dễ dàng so sánh và lựa chọn
              phù hợp.
            </p>
          </div>
          <div className='flex-1 bg-white border-2 border-yellow-400 rounded-lg p-8 flex flex-col items-center shadow-lg'>
            <FaUserFriends className='text-4xl text-yellow-400 mb-4' />
            <h3 className='font-semibold mb-2'>Tìm kiếm nhanh chóng</h3>
            <p className='text-gray-500 text-sm mb-4'>
              Tìm kiếm phòng trọ, bạn cùng phòng, hoặc đăng tin dễ dàng chỉ với vài thao tác.
            </p>
            <Link
              to='/home'
              className='bg-[#0a183d] text-white px-4 py-2 rounded text-sm hover:bg-yellow-400 hover:text-white transition font-semibold'
            >
              Đi đến trang chủ
            </Link>
          </div>
          <div className='flex-1 bg-gray-50 rounded-lg p-8 flex flex-col items-center shadow hover:shadow-lg transition'>
            <FaClock className='text-4xl text-yellow-400 mb-4' />
            <h3 className='font-semibold mb-2'>Cập nhật thời gian thực</h3>
            <p className='text-gray-500 text-sm mb-4'>
              Cập nhật thời gian thực giúp bạn không bỏ lỡ thông tin mới nhất về phòng trọ và bạn cùng phòng.
            </p>
          </div>
        </div>
      </section>

      <footer
        id='footer'
        className='scroll-mt-20 b-gradient-to-bg from-[#0D63C2] via-[#063970] to-[#000814] text-white py-10'
      >
        <div className='max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-8'>
          <div className='flex-1 mb-6 md:mb-0'>
            <div className='flex items-center gap-3 mb-4'>
              <img src={logo} alt='Unistay Logo' className='w-20 h-20' />
              <span className='text-2xl font-bold font-serif'>UNISTAY</span>
            </div>
            <div className='text-sm text-gray-300'>
              <p>Website kết nối sinh viên và chủ trọ tại Đà Nẵng.</p>
              <p className='mt-2'>
                <span className='font-semibold'>Liên hệ:</span> unistay.danang@gmail.com
              </p>
              <p>
                <span className='font-semibold'>Hotline:</span> 0123 456 789
              </p>
            </div>
          </div>
          <div className='flex-1'>
            <h4 className='text-lg font-semibold mb-3 text-[#FFD60A]'>Thành viên phát triển</h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <span className='font-semibold text-white'>Ngô Quốc Hoàng Trung</span> - 102240172@sv1.udn.vn
              </li>
              <li>
                <span className='font-semibold text-white'>Lê Minh Trí</span> - 102240170@sv1.udn.vn
              </li>
              <li>
                <span className='font-semibold text-white'>Trần Thị Hạnh Nguyên</span> - 102240154@sv1.udn.vn
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-8 border-t border-[#001D3D] pt-4 text-center text-xs text-gray-400'>
          © {new Date().getFullYear()} UNISTAY Đà Nẵng. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
