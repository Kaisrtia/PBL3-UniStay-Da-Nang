import { useEffect, useState } from 'react'

import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import authService from '@/services/authService'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Đang xác thực email...')

  useEffect(() => {
    const verifyEmail = async () => {
      const email = searchParams.get('email') || ''
      const code = searchParams.get('code') || searchParams.get('token') || ''

      if (!email || !code) {
        setStatus('Xác thực thất bại hoặc token không hợp lệ.')
        return
      }

      try {
        await authService.verifyEmail({ email, code })
        setStatus('Xác thực thành công.')

        window.setTimeout(() => {
          navigate('/login')
        }, 1500)
      } catch {
        setStatus('Xác thực thất bại hoặc token không hợp lệ.')
      }
    }

    verifyEmail()
  }, [navigate, searchParams])

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-[#0a183d]'>{status}</h1>
        <Link
          to='/login'
          className='mt-5 inline-flex rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#FFD60A]'
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmailPage
