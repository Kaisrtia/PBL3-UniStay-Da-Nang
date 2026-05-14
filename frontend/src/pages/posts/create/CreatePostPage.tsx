import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from 'react'

import axios from 'axios'
import { FaChevronDown, FaImage } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import amenityService, { type Amenity } from '@/services/amenityService'
import locationService, { type Ward } from '@/services/locationService'
import postService, { type PostPurpose, type RoomType } from '@/services/postService'

const stayTypes: { label: string; value: RoomType }[] = [
  { label: 'Trọ', value: 'ROOM' },
  { label: 'Nhà nguyên căn', value: 'HOUSE' },
  { label: 'Chung cư', value: 'APARTMENT' }
]
const listingPurposes: { label: string; value: PostPurpose }[] = [
  { label: 'Cho thuê', value: 'RENT' },
  { label: 'Cho ở ghép', value: 'FIND_ROOMMATE' }
]

const amenities = [
  'Ban công rộng',
  'Cửa sổ',
  'Máy giặt',
  'Gác xép',
  'Ban công rộng',
  'Cửa sổ',
  'Máy giặt',
  'Gác xép',
  'Ban công rộng',
  'Cửa sổ',
  'Máy giặt',
  'Gác xép'
]

const fallbackAmenities: Amenity[] = amenities.slice(0, 5).map((name, index) => ({
  id: index + 1,
  name
}))

const benefits = [
  'Nuôi thú cưng',
  'Giờ giấc tự do',
  'An ninh tốt',
  'An toàn PCCC',
  'Nuôi thú cưng',
  'Giờ giấc tự do',
  'An ninh tốt',
  'An toàn PCCC',
  'Nuôi thú cưng',
  'Giờ giấc tự do',
  'An ninh tốt',
  'An toàn PCCC'
]

type FormSectionProps = {
  children: ReactNode
  title: string
}

const FormSection = ({ children, title }: FormSectionProps) => (
  <section className='rounded-2xl border border-[#F6D983] bg-white px-8 py-5 shadow-sm'>
    <h2 className='text-2xl font-extrabold text-[#111111]'>{title}</h2>
    <div className='mt-4'>{children}</div>
  </section>
)

const PillButton = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button
    type='button'
    onClick={onClick}
    className='min-w-36 rounded-full bg-[#E2E1DD] px-8 py-3 text-sm font-extrabold text-[#111111] transition hover:bg-[#F7DE8B]'
  >
    {children}
  </button>
)

type SelectOption = {
  label: string
  value: string | number
}

type SelectFieldProps = {
  label: string
  name?: string
  value?: string
  options?: SelectOption[]
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

const SelectField = ({ label, name, value, options = [], onChange }: SelectFieldProps) => (
  <label className='flex items-center gap-3'>
    <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>
    <span className='relative flex-1'>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className='h-11 w-full appearance-none rounded-full border border-[#001D3D] bg-white px-5 pr-11 text-sm font-semibold text-[#111111] outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
      >
        <option value=''>Chọn {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaChevronDown className='pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-[#111111]' />
    </span>
  </label>
)

const TextField = ({
  label,
  name,
  placeholder,
  type = 'text'
}: {
  label?: string
  name?: string
  placeholder?: string
  type?: string
}) => (
  <label className={label ? 'flex items-center gap-3' : 'block'}>
    {label && <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>}
    <input
      name={name}
      type={type}
      className='h-11 w-full rounded-full border border-[#001D3D] bg-white px-6 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
      placeholder={placeholder}
    />
  </label>
)

const CheckboxGrid = ({ items }: { items: string[] }) => (
  <div className='grid gap-x-20 gap-y-2 px-8 text-base text-[#111111] md:grid-cols-2'>
    {items.map((item, index) => (
      <label key={`${item}-${index}`} className='flex items-center gap-1'>
        <input type='checkbox' defaultChecked className='h-4 w-4 accent-[#001D3D]' />
        <span>{item}</span>
      </label>
    ))}
  </div>
)

const AmenityCheckboxGrid = ({
  items,
  selectedIds,
  onToggle
}: {
  items: Amenity[]
  selectedIds: number[]
  onToggle: (amenityId: number) => void
}) => (
  <div className='grid gap-x-20 gap-y-2 px-8 text-base text-[#111111] md:grid-cols-2'>
    {items.map((item) => (
      <label key={item.id} className='flex items-center gap-2'>
        <input
          type='checkbox'
          checked={selectedIds.includes(item.id)}
          onChange={() => onToggle(item.id)}
          className='h-4 w-4 accent-[#001D3D]'
        />
        <span>{item.name}</span>
      </label>
    ))}
  </div>
)

const CreatePostPage = () => {
  const navigate = useNavigate()
  const [roomType, setRoomType] = useState<RoomType>('ROOM')
  const [postPurpose, setPostPurpose] = useState<PostPurpose>('RENT')
  const [wardId, setWardId] = useState('')
  const [wardOptions, setWardOptions] = useState<Ward[]>([])
  const [amenityOptions, setAmenityOptions] = useState<Amenity[]>(fallbackAmenities)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const [wards, amenitiesData] = await Promise.all([
          locationService.getWards(),
          amenityService.getAmenities()
        ])
        setWardOptions(wards)
        setAmenityOptions(amenitiesData.length > 0 ? amenitiesData : fallbackAmenities)
      } catch {
        alert('Không tải được danh sách xã/phường hoặc tiện ích.')
      }
    }

    loadFormOptions()
  }, [])

  const handleToggleAmenity = (amenityId: number) => {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId) ? current.filter((id) => id !== amenityId) : [...current, amenityId]
    )
  }

  const getBackendErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
      return data?.error?.message || data?.message || 'Tạo bài đăng thất bại.'
    }

    return 'Tạo bài đăng thất bại.'
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)

    if (!wardId) {
      alert('Vui lòng chọn xã/phường.')
      return
    }

    setLoading(true)

    try {
      const response = await postService.createPost({
        title: String(formData.get('title') || ''),
        wardId: Number(wardId),
        purpose: postPurpose,
        detailAddress: String(formData.get('detailAddress') || ''),
        area: Number(formData.get('area') || 0),
        price: Number(formData.get('price') || 0),
        deposit: Number(formData.get('deposit') || 0),
        roomType,
        postPurpose,
        description: String(formData.get('description') || ''),
        latitude: Number(formData.get('latitude') || 0),
        longitude: Number(formData.get('longitude') || 0),
        postAmenities: selectedAmenityIds.map((amenityId) => ({
          amenityId,
          currentCondition: 'GOOD'
        }))
      })

      alert(response.message || 'Tạo bài đăng thành công.')
      navigate('/home')
    } catch (error) {
      alert(getBackendErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F6F7F9] text-[#111111]'>
      <SiteHeader accountLabel='Host' />

      <main className='px-6 py-10'>
        <h1 className='text-center text-4xl font-extrabold tracking-wide text-[#6F5616]'>ĐĂNG TIN</h1>

        <form onSubmit={handleSubmit} className='mx-auto mt-5 grid max-w-[1000px] gap-6'>
          <FormSection title='Loại trọ'>
            <div className='grid gap-4'>
              <div className='flex flex-wrap gap-5 pl-8'>
                {stayTypes.map((type) => (
                  <PillButton key={type.value} onClick={() => setRoomType(type.value)}>
                    {type.label}
                  </PillButton>
                ))}
              </div>

              <div>
                <h3 className='text-2xl font-extrabold text-[#111111]'>Tôi muốn</h3>
                <div className='mt-4 flex flex-wrap gap-5 pl-8'>
                  {listingPurposes.map((purpose) => (
                    <PillButton key={purpose.value} onClick={() => setPostPurpose(purpose.value)}>
                      {purpose.label}
                    </PillButton>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title='Vị trí'>
            <div className='grid gap-5 px-8'>
              <div className='grid gap-6'>
                <SelectField
                  label='Xã/Phường'
                  name='wardId'
                  value={wardId}
                  onChange={(event) => setWardId(event.target.value)}
                  options={wardOptions.map((ward) => ({ label: ward.name, value: ward.id }))}
                />
              </div>
              <TextField label='Địa chỉ' name='detailAddress' />
            </div>
          </FormSection>

          <FormSection title='Đặc điểm'>
            <div className='grid gap-6 px-8 md:grid-cols-2'>
              <TextField label='Diện tích' name='area' type='number' />
              <SelectField label='Tình trạng nội thất' />
              <TextField label='Tiền cọc' name='deposit' type='number' />
              <TextField label='Vĩ độ' name='latitude' type='number' />
              <TextField label='Kinh độ' name='longitude' type='number' />
            </div>
          </FormSection>

          <FormSection title='Nội dung'>
            <div className='grid gap-5 px-8'>
              <label
                htmlFor='post-media-upload'
                className='flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl bg-[#FFE9A6] text-[#6F5616] shadow-md shadow-[#001D3D]/20 transition hover:bg-[#F7DE8B]'
              >
                <span className='grid h-12 w-12 place-items-center rounded-xl bg-white text-2xl text-[#FFC300]'>
                  <FaImage />
                </span>
                <span className='mt-2 text-sm font-bold'>Thêm ảnh/video</span>
                <input id='post-media-upload' type='file' multiple accept='image/*,video/*' className='sr-only' />
              </label>

              <TextField name='title' placeholder='Tiêu đề' />
              <TextField name='price' type='number' placeholder='Giá thuê' />
              <textarea
                name='description'
                className='min-h-52 resize-none rounded-2xl border border-[#001D3D] bg-white px-6 py-5 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='Mô tả'
              />
            </div>
          </FormSection>

          <FormSection title='Tiện ích'>
            <AmenityCheckboxGrid
              items={amenityOptions}
              selectedIds={selectedAmenityIds}
              onToggle={handleToggleAmenity}
            />
          </FormSection>

          <FormSection title='Lợi ích'>
            <CheckboxGrid items={benefits} />
          </FormSection>

          <div className='mx-auto grid w-full max-w-[720px] gap-8 pt-4 md:grid-cols-2'>
            <Link
              to='/home'
              className='rounded-2xl bg-white px-8 py-5 text-center text-2xl font-extrabold text-[#111111] shadow-md shadow-[#001D3D]/15 transition hover:-translate-y-0.5'
            >
              THOÁT
            </Link>
            <button
              type='submit'
              disabled={loading}
              className='rounded-2xl bg-[#FFE9A6] px-8 py-5 text-2xl font-extrabold text-[#111111] shadow-md shadow-[#001D3D]/15 transition hover:-translate-y-0.5 hover:bg-[#F7DE8B]'
            >
              ĐĂNG BÀI
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  )
}

export default CreatePostPage
