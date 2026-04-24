import React from 'react'

import { background, dutPicture } from '@/assets/images'

import LoginForm from './components/LoginForm'

const LoginPage = () => (
  <div className='relative min-h-screen flex items-center justify-center p-4'>
    {/* Full-page Background Image Layer */}
    <div
      className='absolute inset-0 -z-10'
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
    </div>

    {/* Main Card */}
    <div className='bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl overflow-hidden min-h-[500px]'>
      {/* Left side: DUT Picture (Hidden on mobile) */}
      <div className='hidden md:block md:w-1/2'>
        <img src={dutPicture} alt='DUT Building' className='h-full w-full object-cover' />
      </div>

      {/* Right side: Login Form */}
      <div className='w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12'>
        <div className='mb-8'>
          <h2 className='text-3xl font-extrabold text-[#0a183d]'>CHÀO MỪNG QUAY LẠI</h2>
          <p className='text-gray-500 mt-2'>Hãy nhập thông tin đăng nhập của bạn!</p>
        </div>
        <LoginForm />
      </div>
    </div>
  </div>
)

export default LoginPage
