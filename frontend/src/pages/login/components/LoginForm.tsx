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

    alert('Dang nhap that bai. Vui long kiem tra lai thong tin.')
  }

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Email</label>
        <input
          name='email'
          type='email'
          placeholder='Enter your email'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Mat khau</label>
        <input
          name='password'
          type='password'
          placeholder='********'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>
      <div className='mb-2 flex items-center justify-between text-xs'>
        <label className='flex cursor-pointer items-center gap-1'>
          <input type='checkbox' className='accent-yellow-400' />
          <span className='text-gray-600'>Ghi nho dang nhap</span>
        </label>
        <Link to='/forgot-password' replace className='text-gray-500 hover:underline'>
          Quen mat khau
        </Link>
      </div>
      <button
        type='submit'
        disabled={loading}
        className='mt-1 rounded-lg bg-yellow-400 px-3 py-2.5 font-bold text-white shadow-md transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70'
      >
        {loading ? 'Dang dang nhap...' : 'Dang nhap'}
      </button>
      <button
        type='button'
        className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 font-semibold transition hover:bg-gray-50'
      >
        <FaGoogle className='text-red-500' /> Dang nhap voi Google
      </button>
      <div className='mt-4 text-center text-xs text-gray-500'>
        Chua co tai khoan?{' '}
        <Link to='/register' className='font-bold text-orange-500 hover:underline'>
          Dang ky ngay!
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
