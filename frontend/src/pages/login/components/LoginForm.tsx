import { type FormEvent } from 'react'

import { FaGoogle } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'

import useAuth from '@/hooks/useAuth'

const LoginForm = () => {
  const navigate = useNavigate()
  const { loading, login } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const response = await login({
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || '')
    })

    if (response) {
      navigate('/home')
      return
    }

    if (!response) {
      alert('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
      <div>
        <label className='block text-sm font-semibold mb-1 text-gray-700'>Email</label>
        <input
          name='email'
          type='email'
          placeholder='Enter your email'
          className='w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>
      <div>
        <label className='block text-sm font-semibold mb-1 text-gray-700'>Mật khẩu</label>
        <input
          name='password'
          type='password'
          placeholder='********'
          className='w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 transition'
        />
      </div>
      <div className='flex items-center justify-between text-xs mb-2'>
        <label className='flex items-center gap-1 cursor-pointer'>
          <input type='checkbox' className='accent-yellow-400' />
          <span className='text-gray-600'>Ghi nhớ đăng nhập</span>
        </label>
        <Link to='/forgot-password' replace className='text-gray-500 hover:underline'>
          Quên mật khẩu
        </Link>
      </div>
      <button
        type='submit'
        className='bg-yellow-400 text-white font-bold rounded-lg px-3 py-2.5 mt-1 hover:bg-yellow-500 transition shadow-md'
      >
        Đăng nhập
      </button>
      <button
        type='button'
        className='flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 font-semibold hover:bg-gray-50 transition'
      >
        <FaGoogle className='text-red-500' /> Đăng nhập với Google
      </button>
      <div className='text-xs text-center mt-4 text-gray-500'>
        Chưa có tài khoản?{' '}
        <Link to='/register' className='text-orange-500 hover:underline font-bold'>
          Đăng ký ngay!
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
