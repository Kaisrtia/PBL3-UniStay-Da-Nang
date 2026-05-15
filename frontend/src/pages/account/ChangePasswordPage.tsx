import { type FormEvent, useState } from 'react'

import axios from 'axios'
import { FaKey, FaLock, FaSave } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import userService from '@/services/userService'

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return data?.error?.message || data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
  }

  return 'Không thể đổi mật khẩu. Vui lòng thử lại.'
}

const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const currentPassword = String(formData.get('currentPassword') || '')
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp.')
      setMessage('')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await userService.changePassword({ currentPassword, newPassword })
      setMessage(response.message || 'Đã cập nhật mật khẩu.')
      event.currentTarget.reset()
    } catch (changePasswordError) {
      setError(getErrorMessage(changePasswordError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-3xl px-8 py-10'>
        <Link
          to='/account/profile'
          className='inline-flex rounded-full border border-[#003566] px-5 py-2 text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
        >
          Quay lại hồ sơ
        </Link>

        <section className='mt-6 rounded-2xl bg-white p-8 shadow-lg shadow-[#001D3D]/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-full bg-[#FFC300] text-[#001D3D]'>
              <FaKey />
            </span>
            <div>
              <h1 className='text-3xl font-black'>Đổi mật khẩu</h1>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản UniStay của bạn.
              </p>
            </div>
          </div>

          {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
          {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

          <form onSubmit={handleSubmit} className='mt-8 grid gap-5'>
            {[
              ['currentPassword', 'Mật khẩu hiện tại'],
              ['newPassword', 'Mật khẩu mới'],
              ['confirmPassword', 'Xác nhận mật khẩu mới']
            ].map(([name, label]) => (
              <label key={name} className='grid gap-2 text-sm font-extrabold'>
                {label}
                <span className='relative block'>
                  <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-[#003566]' />
                  <input
                    name={name}
                    type='password'
                    className='h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 font-bold outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                    placeholder='Nhập mật khẩu'
                  />
                </span>
              </label>
            ))}

            <button
              type='submit'
              disabled={loading}
              className='mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <FaSave />
              {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default ChangePasswordPage
