import { useEffect, useState } from 'react'

import { FaBolt, FaMapMarkerAlt, FaParking, FaRegHeart, FaShieldAlt, FaStar, FaWifi } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import postService, { type Post } from '@/services/postService'

type Listing = {
  id: string
  image?: string
  title: string
  location: string
  price: string
  meta: string[]
  purpose: string
  accent: string
}

type Area = {
  name: string
  count: string
  color: string
}

const fallbackListings: Listing[] = [
  {
    id: 'MAPTEST_DUT_ROOM_001',
    title: 'Can ho mini gan DUT, day du noi that',
    location: 'Lien Chieu, Da Nang',
    price: '3.000.000d/thang',
    meta: ['28m2', 'May giat', 'Ban cong'],
    purpose: 'Cho thue',
    accent: 'from-[#0D63C2] to-[#003566]'
  },
  {
    id: 'MAPTEST_DRAGON_APT_002',
    title: 'Phong tro yen tinh cho sinh vien',
    location: 'Hai Chau, Da Nang',
    price: '2.200.000d/thang',
    meta: ['22m2', 'Wifi', 'An ninh'],
    purpose: 'Moi dang',
    accent: 'from-[#003566] to-[#001D3D]'
  },
  {
    id: 'MAPTEST_ASIA_HOUSE_003',
    title: 'Tim nu o ghep gan truong Kinh te',
    location: 'Ngu Hanh Son, Da Nang',
    price: '1.500.000d/thang',
    meta: ['O ghep', 'Tu do', 'Gan truong'],
    purpose: 'O ghep',
    accent: 'from-[#FFD60A] to-[#FFC300]'
  }
]

const areas: Area[] = [
  { name: 'Hai Chau', count: 'Nhieu bai dang phu hop', color: '#0D63C2' },
  { name: 'Lien Chieu', count: 'Gan cac truong dai hoc', color: '#FFC300' },
  { name: 'Cam Le', count: 'Gia thue de tiep can', color: '#003566' },
  { name: 'Son Tra', count: 'Gan trung tam va bien', color: '#22C55E' }
]

const amenities = [
  { icon: FaWifi, label: 'Wifi manh' },
  { icon: FaParking, label: 'Cho de xe' },
  { icon: FaShieldAlt, label: 'An ninh tot' },
  { icon: FaBolt, label: 'Gio giac tu do' }
]

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const roomTypeLabel: Record<string, string> = {
  ROOM: 'Phong tro',
  APARTMENT: 'Can ho',
  HOUSE: 'Nha'
}

const getPriceLabel = (price: string | number) => {
  const value = Number(price)
  return Number.isFinite(value) ? `${currencyFormatter.format(value)}/thang` : `${price}`
}

const mapPostToListing = (post: Post, index: number): Listing => ({
  id: post.id,
  image: post.postImages?.[0]?.imageUrl,
  title: post.title,
  location: post.ward?.name || post.detailAddress,
  price: getPriceLabel(post.price),
  meta: [`${post.area}m2`, roomTypeLabel[String(post.roomType)] || String(post.roomType || 'Phong'), post.postPurpose || 'RENT'],
  purpose: post.purpose === 'FIND_ROOMMATE' ? 'O ghep' : 'Cho thue',
  accent: ['from-[#0D63C2] to-[#003566]', 'from-[#003566] to-[#001D3D]', 'from-[#FFD60A] to-[#FFC300]'][
    index % 3
  ]
})

const ListingCard = ({ listing }: { listing: Listing }) => (
  <Link
    to={`/posts/${listing.id}`}
    className='block overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-lg shadow-[#001D3D]/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#001D3D]/10'
  >
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${listing.accent}`}>
      {listing.image ? (
        <img src={listing.image} alt={listing.title} className='h-full w-full object-cover transition duration-300 hover:scale-105' />
      ) : (
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.32),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_34%)]' />
      )}
      <span className='absolute left-4 top-4 rounded-full bg-[#FFC300] px-4 py-1.5 text-xs font-extrabold text-[#001D3D]'>
        {listing.purpose}
      </span>
      <span className='absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#003566]'>
        <FaRegHeart />
      </span>
    </div>
    <div className='p-5'>
      <h3 className='min-h-[56px] text-xl font-extrabold leading-7 text-[#181A20]'>{listing.title}</h3>
      <p className='mt-3 flex items-center gap-2 text-sm font-medium text-gray-500'>
        <FaMapMarkerAlt className='text-[#FFC300]' />
        {listing.location}
      </p>
      <div className='mt-5 flex items-center justify-between'>
        <p className='text-xl font-extrabold text-[#003566]'>{listing.price}</p>
        <div className='flex items-center gap-1 text-sm font-bold text-[#FFC300]'>
          <FaStar />
          4.8
        </div>
      </div>
      <div className='mt-4 flex flex-wrap gap-2'>
        {listing.meta.map((item) => (
          <span key={item} className='rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-gray-600'>
            {item}
          </span>
        ))}
      </div>
    </div>
  </Link>
)

const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>(fallbackListings)

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        const result = await postService.getPosts({
          limit: 3,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })

        if (result.data.length > 0) {
          setFeaturedListings(result.data.map(mapPostToListing))
        }
      } catch {
        setFeaturedListings(fallbackListings)
      }
    }

    void loadFeaturedPosts()
  }, [])

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />

      <main>
        <section className='relative overflow-hidden bg-gradient-to-br from-[#000814] via-[#001D3D] to-[#0D63C2] px-8 py-16 text-white'>
          <div className='absolute right-24 top-12 h-72 w-72 rounded-full bg-[#FFC300]/20 blur-3xl' />
          <div className='absolute bottom-8 left-8 h-64 w-64 rounded-full bg-[#0D63C2]/30 blur-3xl' />
          <div className='relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]'>
            <div>
              <p className='text-sm font-extrabold tracking-[0.28em] text-[#FFD60A]'>UNISTAY DA NANG</p>
              <h1 className='mt-6 max-w-3xl text-5xl font-extrabold leading-tight'>
                Tim phong tro phu hop cho sinh vien trong vai phut
              </h1>
              <p className='mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-100'>
                Kham pha phong tro, can ho va ban cung phong quanh cac truong dai hoc tai Da Nang voi bo loc theo khu
                vuc, ngan sach va tien ich.
              </p>
              <div className='mt-8 flex flex-wrap gap-4'>
                <Link to='/posts/search' className='rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20'>
                  Tim phong ngay
                </Link>
                <Link to='/posts/create' className='rounded-full bg-white px-7 py-3 font-extrabold text-[#003566]'>
                  Dang tin moi
                </Link>
              </div>
            </div>

            <aside className='rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur'>
              <h2 className='text-2xl font-extrabold'>Tong quan hom nay</h2>
              <div className='mt-8 grid grid-cols-3 gap-5'>
                {[
                  ['Moi', 'du lieu tu API'],
                  ['Ward', 'vi tri hien tai'],
                  ['Map', 'toa do dong']
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className='text-3xl font-extrabold text-[#FFD60A]'>{value}</p>
                    <p className='mt-2 text-sm font-medium text-blue-100'>{label}</p>
                  </div>
                ))}
              </div>
              <div className='mt-8 border-t border-white/20 pt-6 text-sm leading-6 text-blue-100'>
                Cac bai dang noi bat lay truc tiep tu API bai dang da duyet.
              </div>
            </aside>
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 py-20'>
          <div className='flex items-end justify-between gap-6'>
            <div>
              <h2 className='text-4xl font-extrabold text-[#181A20]'>Bai dang noi bat</h2>
              <p className='mt-3 text-gray-500'>Cac phong da duoc duyet, co anh ro rang va thong tin gia minh bach.</p>
            </div>
            <Link to='/posts/search' className='rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white'>
              Xem tat ca
            </Link>
          </div>

          <div className='mt-10 grid gap-7 lg:grid-cols-3'>
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-20'>
          <div>
            <h2 className='text-4xl font-extrabold'>Khu vuc duoc tim kiem nhieu</h2>
            <p className='mt-3 text-gray-500'>Bat dau tu nhung khu vuc co nhieu lua chon phu hop voi sinh vien.</p>
          </div>
          <div className='mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {areas.map((area) => (
              <article
                key={area.name}
                className='rounded-2xl border border-[#E6EAF0] bg-white p-6 shadow-lg shadow-[#001D3D]/5'
              >
                <div className='h-1.5 w-16 rounded-full' style={{ backgroundColor: area.color }} />
                <h3 className='mt-8 text-2xl font-extrabold'>{area.name}</h3>
                <p className='mt-2 text-sm font-medium text-gray-500'>{area.count}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-24'>
          <div className='grid overflow-hidden rounded-3xl bg-[#001D3D] text-white lg:grid-cols-[1.1fr_0.9fr]'>
            <div className='p-10'>
              <h2 className='max-w-2xl text-4xl font-extrabold leading-tight'>
                Tao nhu cau thue tro de nhan goi y phu hop hon
              </h2>
              <p className='mt-5 max-w-2xl text-blue-100'>
                Luu ngan sach, khu vuc, truong hoc va tieu chi ban cung phong. UniStay se uu tien nhung bai dang khop
                nhat.
              </p>
              <Link to='/posts/search' className='mt-8 inline-block rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D]'>
                Xem goi y
              </Link>
            </div>
            <div className='grid gap-4 bg-[#003566] p-10 sm:grid-cols-2'>
              {amenities.map(({ icon: Icon, label }) => (
                <div key={label} className='rounded-2xl bg-white/10 p-5'>
                  <Icon className='text-2xl text-[#FFD60A]' />
                  <p className='mt-4 font-bold'>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default HomePage
