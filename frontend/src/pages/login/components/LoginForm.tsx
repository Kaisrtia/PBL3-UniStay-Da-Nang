import { type FormEvent } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import GoogleCredentialButton from '@/components/auth/GoogleCredentialButton'
import useAuth, { getUserFromAuthResponse } from '@/hooks/useAuth'

const shouldCompleteProfile = (response: unknown) => {
  const user = getUserFromAuthResponse(response as Parameters<typeof getUserFromAuthResponse>[0])
  const roles = user?.roles || []
  return user?.status === 'SET_UP' || (!roles.includes('STUDENT') && !roles.includes('HOST') && !roles.includes('ADMIN'))
}

const LoginForm = () => {
  const navigate = useNavigate()
  const { loading, login, loginWithGoogle } = useAuth()

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
      navigate(shouldCompleteProfile(response) ? '/account/profile' : '/home')
      return
    }

    alert('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
  }

  const handleGoogleCredential = async (idToken: string) => {
    if (loading) {
      return
    }

    const response = await loginWithGoogle({ idToken })

    if (response) {
      navigate(shouldCompleteProfile(response) ? '/account/profile' : '/home')
      return
    }

    alert('Đăng nhập Google thất bại. Vui lòng thử lại.')
  }

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Email</label>
        <input
          name='email'
          type='email'
          placeholder='Nhập email của bạn'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Mật khẩu</label>
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
          <span className='text-gray-600'>Ghi nhớ đăng nhập</span>
        </label>
        <Link to='/forgot-password' replace className='text-gray-500 hover:underline'>
          Quên mật khẩu
        </Link>
      </div>
      <button
        type='submit'
        disabled={loading}
        className='mt-1 rounded-lg bg-yellow-400 px-3 py-2.5 font-bold text-white shadow-md transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70'
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
      <GoogleCredentialButton
        disabled={loading}
        text='signin_with'
        onCredential={(idToken) => void handleGoogleCredential(idToken)}
        onError={(message) => alert(message)}
      />
      <div className='mt-4 text-center text-xs text-gray-500'>
        Chưa có tài khoản?{' '}
        <Link to='/register' className='font-bold text-orange-500 hover:underline'>
          Đăng ký ngay
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
