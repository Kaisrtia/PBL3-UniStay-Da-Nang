import { useEffect, useMemo, useState } from 'react'

import { Link, useParams } from 'react-router-dom'

import PostLocationMap from '@/components/map/PostLocationMap'

type PostImage = {
  id: number
  postId: string
  imageUrl: string
}

type PostDetail = {
  id: string
  title: string
  detailAddress: string
  area: string | number
  price: string | number
  deposit: string | number
  roomType: string
  postPurpose: string
  description: string
  latitude: string | number
  longitude: string | number
  postImages?: PostImage[]
}

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const areaFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1
})

const getAccessToken = () => {
  return localStorage.getItem('accessToken') ?? localStorage.getItem('token') ?? ''
}

const toNumber = (value: string | number) => Number(value)

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    const loadPostDetail = async () => {
      if (!postId) {
        setErrorMessage('Khong tim thay ma bai dang tren URL.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')

        const token = getAccessToken()
        const response = await fetch(`${apiBaseUrl}/posts/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: abortController.signal
        })
        const payload = (await response.json()) as ApiResponse<PostDetail>

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? 'Khong the tai chi tiet bai dang.')
        }

        setPost(payload.data)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Khong the tai chi tiet bai dang.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPostDetail()

    return () => abortController.abort()
  }, [postId])

  const heroImage = useMemo(() => post?.postImages?.[0]?.imageUrl, [post])

  if (isLoading) {
    return (
      <main className='min-h-screen bg-gray-50 px-4 py-10'>
        <div className='mx-auto max-w-5xl rounded-lg bg-white p-8 shadow-sm'>
          <p className='text-sm text-gray-500'>Dang tai chi tiet bai dang...</p>
        </div>
      </main>
    )
  }

  if (errorMessage || !post) {
    return (
      <main className='min-h-screen bg-gray-50 px-4 py-10'>
        <div className='mx-auto max-w-5xl rounded-lg bg-white p-8 shadow-sm'>
          <Link to='/home' className='text-sm font-semibold text-blue-600 hover:underline'>
            Quay lai trang chu
          </Link>
          <h1 className='mt-4 text-2xl font-bold text-gray-900'>Khong the hien thi bai dang</h1>
          <p className='mt-2 text-gray-600'>{errorMessage || 'Bai dang khong ton tai.'}</p>
          <p className='mt-4 text-sm text-gray-500'>
            Neu API yeu cau dang nhap, hay luu access token vao localStorage voi key accessToken roi tai lai trang.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-gray-50 px-4 py-10'>
      <article className='mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]'>
        <section className='rounded-lg bg-white p-6 shadow-sm'>
          <Link to='/home' className='text-sm font-semibold text-blue-600 hover:underline'>
            Quay lai trang chu
          </Link>

          {heroImage ? (
            <img src={heroImage} alt={post.title} className='mt-5 h-80 w-full rounded-lg object-cover' />
          ) : (
            <div className='mt-5 flex h-80 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500'>
              Chua co hinh anh
            </div>
          )}

          <div className='mt-6'>
            <p className='text-sm font-semibold uppercase tracking-wide text-yellow-600'>{post.roomType}</p>
            <h1 className='mt-2 text-3xl font-bold text-gray-950'>{post.title}</h1>
            <p className='mt-3 text-gray-600'>{post.detailAddress}</p>
          </div>

          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-500'>Gia thue</p>
              <p className='mt-1 font-bold text-gray-950'>{currencyFormatter.format(toNumber(post.price))}</p>
            </div>
            <div className='rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-500'>Dien tich</p>
              <p className='mt-1 font-bold text-gray-950'>{areaFormatter.format(toNumber(post.area))} m2</p>
            </div>
            <div className='rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-500'>Tien coc</p>
              <p className='mt-1 font-bold text-gray-950'>{currencyFormatter.format(toNumber(post.deposit))}</p>
            </div>
          </div>

          <section className='mt-8'>
            <h2 className='text-xl font-bold text-gray-950'>Mo ta</h2>
            <p className='mt-3 whitespace-pre-line leading-7 text-gray-700'>{post.description}</p>
          </section>
        </section>

        <aside className='space-y-4'>
          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <h2 className='text-lg font-bold text-gray-950'>Vi tri bai dang</h2>
            <p className='mt-1 text-sm text-gray-500'>Ban do lay toa do latitude/longitude da luu trong bai dang.</p>
            <PostLocationMap
              latitude={post.latitude}
              longitude={post.longitude}
              title={post.title}
              address={post.detailAddress}
              className='mt-4'
              height={360}
            />
          </section>
        </aside>
      </article>
    </main>
  )
}

export default PostDetailPage
