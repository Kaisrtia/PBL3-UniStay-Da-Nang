import { useEffect, useMemo, useState } from 'react'

import { FaBath, FaBed, FaBolt, FaMapMarkerAlt, FaRulerCombined } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import postService, { type Post, type PostPurpose } from '@/services/postService'

type ResultTab = 'all' | PostPurpose | 'recommended'

const tabs: { label: string; value: ResultTab }[] = [
  { label: 'Tat ca', value: 'all' },
  { label: 'Cho thue', value: 'RENT' },
  { label: 'O ghep', value: 'FIND_ROOMMATE' },
  { label: 'Goi y cho toi', value: 'recommended' }
]

const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=640&q=80'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const roomTypeLabel: Record<string, string> = {
  ROOM: 'Phong tro',
  APARTMENT: 'Can ho',
  HOUSE: 'Nha nguyen can'
}

const formatCurrency = (value: string | number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? currencyFormatter.format(numberValue) : `${value}`
}

const getPostImage = (post: Post) => post.postImages?.[0]?.imageUrl || fallbackImage

const getPostAddress = (post: Post) => {
  const wardName = post.ward?.name
  return wardName ? `${post.detailAddress}, ${wardName}` : post.detailAddress
}

const SearchResultCard = ({ post }: { post: Post }) => (
  <Link to={`/posts/${post.id}`} className='group block'>
    <article>
      <div className='relative h-44 overflow-hidden rounded-md bg-gray-100'>
        <img
          src={getPostImage(post)}
          alt={post.title}
          className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
        />
        {post.user?.hosts?.some((host) => host.isVerified) && (
          <span className='absolute left-4 top-4 flex items-center gap-1 rounded bg-[#F2765B] px-3 py-1.5 text-xs font-extrabold text-white'>
            <FaBolt className='text-[10px]' />
            VERIFIED
          </span>
        )}
      </div>

      <div className='mt-4'>
        <p className='text-sm font-extrabold text-[#181A20]'>{formatCurrency(post.price)}</p>
        <h3 className='mt-2 line-clamp-1 text-base font-extrabold text-[#181A20]'>{post.title}</h3>
        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-gray-500'>
          <FaMapMarkerAlt className='text-[#FFC300]' />
          {getPostAddress(post)}
        </p>
        <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-gray-600'>
          <span className='flex items-center gap-1'>
            <FaBed />
            {roomTypeLabel[String(post.roomType)] || post.roomType || 'Phong'}
          </span>
          <span className='flex items-center gap-1'>
            <FaBath />
            {post._count?.comments ?? 0} binh luan
          </span>
          <span className='flex items-center gap-1'>
            <FaRulerCombined />
            {post.area}m2
          </span>
        </div>
      </div>
    </article>
  </Link>
)

const SearchResultsPage = () => {
  const [activeTab, setActiveTab] = useState<ResultTab>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const result =
          activeTab === 'recommended'
            ? await postService.getRecommendedPosts({ limit: 24 })
            : await postService.getPosts({
                purpose: activeTab === 'all' ? undefined : activeTab,
                hasMedia: false,
                limit: 24,
                sortBy: 'createdAt',
                sortOrder: 'desc'
              })

        setPosts(result.data)
      } catch {
        setErrorMessage(
          activeTab === 'recommended'
            ? 'Khong tai duoc goi y. Hay dang nhap bang tai khoan sinh vien va tao nhu cau thue phong.'
            : 'Khong tai duoc danh sach bai dang.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadPosts()
  }, [activeTab])

  const content = useMemo(() => {
    if (loading) {
      return <p className='py-12 text-center text-sm font-semibold text-gray-500'>Dang tai danh sach bai dang...</p>
    }

    if (errorMessage) {
      return <p className='py-12 text-center text-sm font-semibold text-red-500'>{errorMessage}</p>
    }

    if (posts.length === 0) {
      return <p className='py-12 text-center text-sm font-semibold text-gray-500'>Chua co bai dang phu hop.</p>
    }

    return (
      <div className='grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'>
        {posts.map((post) => (
          <SearchResultCard key={post.id} post={post} />
        ))}
      </div>
    )
  }, [errorMessage, loading, posts])

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

          <div className='px-12 py-12'>{content}</div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default SearchResultsPage
