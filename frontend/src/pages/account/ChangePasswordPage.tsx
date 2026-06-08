import { type FormEvent, useState } from 'react'

import axios from 'axios'
import { FaKey, FaLock, FaSave } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import userService from '@/services/userService'

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return data?.error?.message || data?.message || 'KhÃ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lÃ²ng thá»­ láº¡i.'
  }

  return 'KhÃ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lÃ²ng thá»­ láº¡i.'
}

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const passwordPolicyMessage = 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 8 kÃ½ tá»±, gá»“m chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘ vÃ  kÃ½ tá»± Ä‘áº·c biá»‡t.'

const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const newPasswordError = form.newPassword && !strongPasswordRegex.test(form.newPassword) ? passwordPolicyMessage : ''
  const confirmPasswordError =
    form.confirmPassword && form.newPassword !== form.confirmPassword ? 'Máº­t kháº©u má»›i vÃ  máº­t kháº©u xÃ¡c nháº­n khÃ´ng khá»›p.' : ''
  const isSubmitDisabled =
    loading || !form.currentPassword || !form.newPassword || !form.confirmPassword || Boolean(newPasswordError || confirmPasswordError)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await userService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setMessage(response.message || 'ÄÃ£ cáº­p nháº­t máº­t kháº©u.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
          Quay láº¡i há»“ sÆ¡
        </Link>

        <section className='mt-6 rounded-2xl bg-white p-8 shadow-lg shadow-[#001D3D]/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-full bg-[#FFC300] text-[#001D3D]'>
              <FaKey />
            </span>
            <div>
              <h1 className='text-3xl font-black'>Äá»•i máº­t kháº©u</h1>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Cáº­p nháº­t máº­t kháº©u Ä‘á»‹nh ká»³ Ä‘á»ƒ báº£o vá»‡ tÃ i khoáº£n UniStay cá»§a báº¡n.
              </p>
            </div>
          </div>

          {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
          {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

          <form onSubmit={handleSubmit} className='mt-8 grid gap-5'>
            {[
              ['currentPassword', 'Máº­t kháº©u hiá»‡n táº¡i', ''],
              ['newPassword', 'Máº­t kháº©u má»›i', newPasswordError],
              ['confirmPassword', 'XÃ¡c nháº­n máº­t kháº©u má»›i', confirmPasswordError]
            ].map(([name, label, fieldError]) => (
              <label key={name} className='grid gap-2 text-sm font-extrabold'>
                {label}
                <span className='relative block'>
                  <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-[#003566]' />
                  <input
                    name={name}
                    type='password'
                    value={form[name as keyof typeof form]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value
                      }))
                    }
                    className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 font-bold outline-none transition focus:ring-2 ${
                      fieldError
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-[#FFC300] focus:ring-[#FFC300]/30'
                    }`}
                    placeholder='Nháº­p máº­t kháº©u'
                  />
                </span>
                {fieldError ? <span className='text-xs font-bold text-red-600'>{fieldError}</span> : null}
              </label>
            ))}

            <button
              type='submit'
              disabled={isSubmitDisabled}
              className='mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <FaSave />
              {loading ? 'Äang cáº­p nháº­t...' : 'LÆ°u máº­t kháº©u má»›i'}
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default ChangePasswordPage
