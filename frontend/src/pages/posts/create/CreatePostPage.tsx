import { type FormEvent, type ReactNode } from 'react'

import { FaChevronDown, FaImage } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'

const stayTypes = ['Trọ', 'Nhà nguyên căn', 'Chung cư']
const listingPurposes = ['Cho thuê', 'Cho ở ghép']

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

const PillButton = ({ children }: { children: ReactNode }) => (
  <button
    type='button'
    className='min-w-36 rounded-full bg-[#E2E1DD] px-8 py-3 text-sm font-extrabold text-[#111111] transition hover:bg-[#F7DE8B]'
  >
    {children}
  </button>
)

const SelectField = ({ label }: { label: string }) => (
  <label className='flex items-center gap-3'>
    <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>
    <span className='relative flex-1'>
      <select className='h-11 w-full appearance-none rounded-full border border-[#001D3D] bg-white px-5 pr-11 text-sm font-semibold text-[#111111] outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'>
        <option>Chọn {label.toLowerCase()}</option>
      </select>
      <FaChevronDown className='pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-[#111111]' />
    </span>
  </label>
)

const TextField = ({ label, placeholder }: { label?: string; placeholder?: string }) => (
  <label className={label ? 'flex items-center gap-3' : 'block'}>
    {label && <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>}
    <input
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

const CreatePostPage = () => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
                  <PillButton key={type}>{type}</PillButton>
                ))}
              </div>

              <div>
                <h3 className='text-2xl font-extrabold text-[#111111]'>Tôi muốn</h3>
                <div className='mt-4 flex flex-wrap gap-5 pl-8'>
                  {listingPurposes.map((purpose) => (
                    <PillButton key={purpose}>{purpose}</PillButton>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title='Vị trí'>
            <div className='grid gap-5 px-8'>
              <div className='grid gap-6 md:grid-cols-2'>
                <SelectField label='Quận/Huyện' />
                <SelectField label='Xã/Phường' />
              </div>
              <TextField label='Địa chỉ' />
            </div>
          </FormSection>

          <FormSection title='Đặc điểm'>
            <div className='grid gap-6 px-8 md:grid-cols-2'>
              <TextField label='Diện tích' />
              <SelectField label='Tình trạng nội thất' />
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

              <TextField placeholder='Tiêu đề' />
              <TextField placeholder='Giá thuê' />
              <textarea
                className='min-h-52 resize-none rounded-2xl border border-[#001D3D] bg-white px-6 py-5 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='Mô tả'
              />
            </div>
          </FormSection>

          <FormSection title='Tiện ích'>
            <CheckboxGrid items={amenities} />
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
