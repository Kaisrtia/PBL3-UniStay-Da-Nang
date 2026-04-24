import React from 'react'

import { FaGoogle } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export const RegisterForm = () => {
  // Logic xử lý khi nhấn Đăng ký
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý logic đăng ký tại đây
    console.log("Đang đăng ký...");
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2 w-full'> 
      {/* 1. Họ và tên */}
      <div>
        <label className='block text-xs font-semibold mb-1 text-gray-700'>Họ và tên</label>
        <input
          type='text'
          placeholder='Nhập họ và tên của bạn'
          className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>

      {/* 2. Email */}
      <div>
        <label className='block text-xs font-semibold mb-1 text-gray-700'>Email</label>
        <input
          type='email'
          placeholder='Nhập địa chỉ email'
          className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>

      {/* 3. Mật khẩu */}
      <div>
        <label className='block text-xs font-semibold mb-1 text-gray-700'>Mật khẩu</label>
        <input
          type='password'
          placeholder='********'
          className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>

      {/* 4. Xác nhận mật khẩu */}
      <div>
        <label className='block text-xs font-semibold mb-1 text-gray-700'>Xác nhận mật khẩu</label>
        <input
          type='password'
          placeholder='********'
          className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>

      {/* Nút Đăng ký */}
      <button
        type='submit'
        className='bg-yellow-400 text-white font-bold rounded-lg px-3 py-2 mt-2 hover:bg-yellow-500 transition shadow-md text-sm'
      >
        Đăng ký
      </button>

      {/* Nút Google */}
      <button
        type='button'
        className='flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 font-semibold hover:bg-gray-50 transition text-sm'
      >
        <FaGoogle className='text-red-500' /> Đăng ký với Google
      </button>

      {/* Link về Đăng nhập */}
      <div className='text-[11px] text-center mt-2 text-gray-500'>
        Đã có tài khoản?{' '}
        <Link to='/login' className='text-orange-500 hover:underline font-bold'>
          Đăng nhập ngay!
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;