import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import {
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaHome,
  FaIdCard,
  FaPhoneAlt,
  FaSave,
  FaUniversity,
  FaUser,
  FaUserGraduate
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import { uploadAvatarImage } from '@/services/cloudinaryService'
import locationService from '@/services/locationService'
import userService, { type UserProfile } from '@/services/userService'

type ProfileFormState = {
  fullName: string
  phone: string
  dob: string
  gender: string
  avatarUrl: string
  universityId: string
}

type SetupRole = '' | 'STUDENT' | 'HOST'

const emptyForm: ProfileFormState = {
  fullName: '',
  phone: '',
  dob: '',
  gender: '',
  avatarUrl: '',
  universityId: ''
}

const roleLabels: Record<string, string> = {
  USER: 'Người dùng',
  STUDENT: 'Sinh viên',
  HOST: 'Chủ trọ',
  ADMIN: 'Quản trị viên'
}

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác'
}

const formatDateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([])
  const [isEditing, setIsEditing] = useState(false)
  const [setupRole, setSetupRole] = useState<SetupRole>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isStudent = Boolean(profile?.roles?.includes('STUDENT'))
  const isHost = Boolean(profile?.roles?.includes('HOST'))
  const needsProfileSetup = Boolean(
    profile && (profile.status === 'SET_UP' || (!isStudent && !isHost && !profile.roles?.includes('ADMIN')))
  )
  const isStudentForm = isStudent || setupRole === 'STUDENT'
  const hostInfo = profile?.hosts?.[0]

  const roleText = useMemo(
    () => profile?.roles?.map((role) => roleLabels[role] || role).join(', ') || 'Người dùng',
    [profile?.roles]
  )
  const avatarPreview = form.avatarUrl || profile?.avatarUrl || ''

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const [currentProfile, universityOptions] = await Promise.all([
          userService.getMyProfile(),
          locationService.getUniversities()
        ])

        if (currentProfile) {
          setProfile(currentProfile)
          const existingRole = currentProfile.roles?.includes('STUDENT')
            ? 'STUDENT'
            : currentProfile.roles?.includes('HOST')
              ? 'HOST'
              : ''
          setSetupRole(existingRole)
          if (currentProfile.status === 'SET_UP' || (!existingRole && !currentProfile.roles?.includes('ADMIN'))) {
            setIsEditing(true)
          }
          setForm({
            fullName: currentProfile.fullName || '',
            phone: currentProfile.phone || '',
            dob: formatDateInput(currentProfile.dob),
            gender: currentProfile.gender || '',
            avatarUrl: currentProfile.avatarUrl || '',
            universityId: currentProfile.student?.universityId || ''
          })
        }

        setUniversities(universityOptions)
      } catch {
        setError('Không tải được thông tin cá nhân. Vui lòng đăng nhập lại.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (needsProfileSetup) {
        if (!setupRole) {
          setError('Vui lòng chọn vai trò Sinh viên hoặc Chủ trọ để hoàn tất hồ sơ.')
          setSaving(false)
          return
        }

        await userService.setupProfile({
          role: setupRole,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          dob: form.dob,
          gender: form.gender,
          avatarUrl: form.avatarUrl.trim(),
          universityId: setupRole === 'STUDENT' ? form.universityId : undefined
        })
      } else {
        await userService.updateProfile({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          dob: form.dob,
          gender: form.gender,
          avatarUrl: form.avatarUrl.trim(),
          universityId: isStudent ? form.universityId : undefined
        })
      }

      const refreshedProfile = await userService.getMyProfile()
      if (refreshedProfile) {
        setProfile(refreshedProfile)
        localStorage.setItem(
          'authUser',
          JSON.stringify({
            id: refreshedProfile.id,
            email: refreshedProfile.email,
            fullName: refreshedProfile.fullName,
            phone: refreshedProfile.phone,
            avatarUrl: refreshedProfile.avatarUrl,
            roles: refreshedProfile.roles
          })
        )
        window.dispatchEvent(new Event('auth-user-updated'))
      }

      setIsEditing(false)
      setMessage(needsProfileSetup ? 'Đã hoàn tất hồ sơ. Bạn có thể sử dụng các chức năng theo vai trò đã chọn.' : 'Đã cập nhật thông tin cá nhân.')
    } catch {
      setError('Không thể cập nhật thông tin. Vui lòng kiểm tra lại các trường đã nhập.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError('')
    setMessage('')

    try {
      const avatarUrl = await uploadAvatarImage(file)
      setForm((current) => ({ ...current, avatarUrl }))
      setMessage('Đã tải ảnh đại diện lên. Bấm lưu để cập nhật hồ sơ.')
    } catch {
      setError('Không thể tải ảnh đại diện lên Cloudinary. Vui lòng kiểm tra cấu hình upload và thử lại.')
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-6xl px-8 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <div>
            <Link
              to='/home'
              className='inline-flex rounded-full border border-[#003566] px-5 py-2 text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
            >
              Quay lại trang chủ
            </Link>
            <p className='mt-6 text-sm font-extrabold uppercase tracking-[0.24em] text-[#FFC300]'>UNISTAY</p>
            <h1 className='mt-3 text-4xl font-black'>Thông tin cá nhân</h1>
            <p className='mt-3 max-w-2xl text-gray-500'>
              Quản lý thông tin liên hệ và hồ sơ hiển thị khi bạn tương tác với bài đăng.
            </p>
          </div>
          <button
            type='button'
            onClick={() => setIsEditing((current) => !current)}
            className='inline-flex items-center gap-3 rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition hover:bg-[#FFD60A]'
          >
            <FaEdit />
            {needsProfileSetup ? 'Hoàn tất hồ sơ' : isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
          </button>
        </div>

        {needsProfileSetup ? (
          <section className='mt-6 rounded-2xl border border-[#FFC300]/60 bg-[#FFF7D6] px-6 py-5 shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <h2 className='text-xl font-black text-[#001D3D]'>Hoàn tất hồ sơ Google</h2>
                <p className='mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6F5616]'>
                  Tài khoản Google mới cần chọn vai trò để hệ thống cấp quyền sử dụng các chức năng như lưu bài, gửi yêu cầu thuê hoặc đăng tin.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <button
                  type='button'
                  onClick={() => setSetupRole('STUDENT')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition ${
                    setupRole === 'STUDENT'
                      ? 'bg-[#001D3D] text-white'
                      : 'bg-white text-[#001D3D] hover:bg-[#001D3D] hover:text-white'
                  }`}
                >
                  <FaUserGraduate />
                  Sinh viên
                </button>
                <button
                  type='button'
                  onClick={() => setSetupRole('HOST')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition ${
                    setupRole === 'HOST'
                      ? 'bg-[#001D3D] text-white'
                      : 'bg-white text-[#001D3D] hover:bg-[#001D3D] hover:text-white'
                  }`}
                >
                  <FaHome />
                  Chủ trọ
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
        {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

        {loading ? (
          <section className='mt-8 rounded-2xl bg-white p-10 text-center shadow-lg shadow-[#001D3D]/5'>
            <p className='font-bold text-gray-500'>Đang tải thông tin cá nhân...</p>
          </section>
        ) : profile ? (
          <section className='mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]'>
            <aside className='rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
              <div className='flex flex-col items-center text-center'>
                <div className='grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[#001D3D] text-3xl font-black text-[#FFC300]'>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={profile.fullName} className='h-full w-full object-cover' />
                  ) : (
                    profile.fullName?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <h2 className='mt-4 text-2xl font-black'>{profile.fullName}</h2>
                <p className='mt-1 text-sm font-bold text-gray-500'>{roleText}</p>
                {isHost && hostInfo?.isVerified ? (
                  <span className='mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-extrabold text-green-700'>
                    <FaCheckCircle />
                    Chủ trọ đã xác minh
                  </span>
                ) : null}
              </div>

              <div className='mt-6 grid gap-3 text-sm'>
                <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                  <FaEnvelope className='text-[#003566]' />
                  <span className='min-w-0 truncate font-bold'>{profile.email}</span>
                </div>
                <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                  <FaPhoneAlt className='text-[#003566]' />
                  <span className='font-bold'>{profile.phone || 'Chưa cập nhật số điện thoại'}</span>
                </div>
                {isStudentForm ? (
                  <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                    <FaUniversity className='text-[#003566]' />
                    <span className='font-bold'>{profile.student?.university?.name || 'Chưa chọn trường học'}</span>
                  </div>
                ) : null}
                {isHost ? (
                  <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                    <FaIdCard className='text-[#003566]' />
                    <span className='font-bold'>Tổng bài đăng: {hostInfo?.totalPost || 0}</span>
                  </div>
                ) : null}
              </div>
            </aside>

            <form onSubmit={handleSubmit} className='min-w-0 rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
              <div className='grid min-w-0 gap-5 md:grid-cols-2'>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Họ và tên
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Email
                  <input
                    value={profile.email}
                    disabled
                    className='w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none'
                  />
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Số điện thoại
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Ngày sinh
                  <input
                    type='date'
                    value={form.dob}
                    onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Giới tính
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  >
                    <option value=''>Chưa cập nhật</option>
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {isStudentForm ? (
                  <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                    Trường học
                    <select
                      value={form.universityId}
                      onChange={(event) => setForm((current) => ({ ...current, universityId: event.target.value }))}
                      disabled={!isEditing}
                      className='w-full min-w-0 truncate rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                    >
                      <option value=''>Chọn trường học</option>
                      {universities.map((university) => (
                        <option key={university.id} value={university.id}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className='grid min-w-0 gap-2 text-sm font-extrabold md:col-span-2'>
                  Ảnh đại diện
                  <div className='flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4'>
                    <input
                      id='avatar-upload'
                      type='file'
                      accept='image/*'
                      onChange={(event) => void handleAvatarFileChange(event)}
                      disabled={!isEditing || uploadingAvatar}
                      className='hidden'
                    />
                    <label
                      htmlFor='avatar-upload'
                      className={`inline-flex cursor-pointer rounded-full px-5 py-2 text-sm font-extrabold transition ${
                        isEditing && !uploadingAvatar
                          ? 'bg-[#FFC300] text-[#001D3D] hover:bg-[#FFD60A]'
                          : 'cursor-not-allowed bg-gray-200 text-gray-500'
                      }`}
                    >
                      {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                    </label>
                    <span className='min-w-0 flex-1 truncate text-sm font-bold text-gray-500'>
                      {form.avatarUrl ? 'Ảnh đại diện đã sẵn sàng để lưu.' : 'Chọn ảnh JPG, PNG hoặc WebP.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5'>
                <span className='inline-flex items-center gap-2 text-sm font-bold text-gray-500'>
                  <FaUser className='text-[#FFC300]' />
                  Thông tin này được dùng khi liên hệ thuê phòng hoặc quản lý bài đăng.
                </span>
                <button
                  type='submit'
                  disabled={!isEditing || saving}
                  className='inline-flex items-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
                >
                  <FaSave />
                  {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}

export default ProfilePage
