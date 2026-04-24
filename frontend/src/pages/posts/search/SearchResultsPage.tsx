import { useMemo, useState } from 'react'

import { FaBath, FaBed, FaBolt, FaMapMarkerAlt, FaRulerCombined } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'

type PosterType = 'broker' | 'personal'
type ResultTab = 'all' | PosterType

type SearchResult = {
  address: string
  baths: number
  beds: number
  featured?: boolean
  id: string
  image: string
  posterType: PosterType
  price: string
  size: string
  title: string
}

const tabs: { label: string; value: ResultTab }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Môi giới', value: 'broker' },
  { label: 'Cá nhân', value: 'personal' }
]

const results: SearchResult[] = [
  {
    id: 'luxury-family-home',
    title: 'Căn hộ mini gần DUT',
    address: '12 Green Ave, Liên Chiểu',
    price: '3.800.000đ',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=640&q=80',
    posterType: 'broker',
    beds: 2,
    baths: 1,
    size: '32m²'
  },
  {
    id: 'gorgeous-villa-bay',
    title: 'Nhà nguyên căn Hòa Xuân',
    address: '18 Gratton St, Cẩm Lệ',
    price: '6.500.000đ',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=80',
    posterType: 'broker',
    beds: 3,
    baths: 2,
    size: '80m²'
  },
  {
    id: 'skyper-pool-apartment',
    title: 'Phòng studio đầy đủ nội thất',
    address: '151 Tonkins Ave, Hải Châu',
    price: '2.850.000đ',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=640&q=80',
    posterType: 'personal',
    beds: 1,
    baths: 1,
    size: '24m²'
  },
  {
    id: 'diamond-manor-apartment',
    title: 'Căn hộ ban công sáng',
    address: '343 Franklin Ave, Sơn Trà',
    price: '3.500.000đ',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=640&q=80',
    posterType: 'personal',
    beds: 2,
    baths: 1,
    size: '36m²'
  },
  {
    id: 'house-on-hollywood',
    title: 'Nhà trọ có sân để xe',
    address: '374 Johnson Ave, Ngũ Hành Sơn',
    price: '2.400.000đ',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=640&q=80',
    posterType: 'broker',
    beds: 2,
    baths: 1,
    size: '28m²',
    featured: true
  },
  {
    id: 'comfortable-villa-green',
    title: 'Phòng gần Đại học Kinh tế',
    address: '178 Broadway, Ngũ Hành Sơn',
    price: '1.900.000đ',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&q=80',
    posterType: 'personal',
    beds: 1,
    baths: 1,
    size: '22m²',
    featured: true
  },
  {
    id: 'quality-house-for-sale',
    title: 'Căn hộ mới gần biển',
    address: '873 Bedford Ave, Sơn Trà',
    price: '4.200.000đ',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=640&q=80',
    posterType: 'broker',
    beds: 2,
    baths: 2,
    size: '48m²',
    featured: true
  },
  {
    id: 'villa-with-pool',
    title: 'Phòng ở ghép giá tốt',
    address: '9750 Distribution Ave, Hải Châu',
    price: '1.200.000đ',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=640&q=80',
    posterType: 'personal',
    beds: 1,
    baths: 1,
    size: '18m²'
  }
]

const SearchResultCard = ({ result }: { result: SearchResult }) => (
  <Link to={`/posts/${result.id}`} className='group block'>
    <article>
      <div className='relative h-44 overflow-hidden rounded-md bg-gray-100'>
        <img
          src={result.image}
          alt={result.title}
          className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
        />
        {result.featured && (
          <span className='absolute left-4 top-4 flex items-center gap-1 rounded bg-[#F2765B] px-3 py-1.5 text-xs font-extrabold text-white'>
            <FaBolt className='text-[10px]' />
            FEATURED
          </span>
        )}
      </div>

      <div className='mt-4'>
        <p className='text-sm font-extrabold text-[#181A20]'>{result.price}</p>
        <h3 className='mt-2 line-clamp-1 text-base font-extrabold text-[#181A20]'>{result.title}</h3>
        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-gray-500'>
          <FaMapMarkerAlt className='text-[#FFC300]' />
          {result.address}
        </p>
        <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-gray-600'>
          <span className='flex items-center gap-1'>
            <FaBed />
            {result.beds} Beds
          </span>
          <span className='flex items-center gap-1'>
            <FaBath />
            {result.baths} Baths
          </span>
          <span className='flex items-center gap-1'>
            <FaRulerCombined />
            {result.size}
          </span>
        </div>
      </div>
    </article>
  </Link>
)

const SearchResultsPage = () => {
  const [activeTab, setActiveTab] = useState<ResultTab>('all')

  const filteredResults = useMemo(
    () => (activeTab === 'all' ? results : results.filter((result) => result.posterType === activeTab)),
    [activeTab]
  )

  return (
    <div className='min-h-screen bg-[#E7E5E1] text-[#181A20]'>
      <SiteHeader />

      <main className='px-8 py-10'>
        <section className='mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm'>
          <div className='flex items-center gap-9 border-b border-gray-200 px-12 pt-8'>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type='button'
                onClick={() => setActiveTab(tab.value)}
                className={`relative pb-5 text-lg font-extrabold transition ${
                  activeTab === tab.value ? 'text-[#181A20]' : 'text-[#181A20]/70 hover:text-[#181A20]'
                }`}
              >
                {tab.label}
                {activeTab === tab.value && <span className='absolute bottom-0 left-0 h-1 w-full bg-[#FFC300]' />}
              </button>
            ))}
          </div>

          <div className='px-12 py-12'>
            <div className='grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'>
              {filteredResults.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default SearchResultsPage
