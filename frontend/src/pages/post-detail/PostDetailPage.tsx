import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import axios from 'axios'
import { FaArrowLeft, FaCheckCircle, FaEllipsisV, FaFlag, FaHeart, FaPhoneAlt, FaRegHeart, FaUserCircle } from 'react-icons/fa'
import { Link, useLocation, useParams } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import PostLocationMap from '@/components/map/PostLocationMap'
import adminService from '@/services/adminService'
import { API_BASE_URL } from '@/services/api'
import contactService from '@/services/contactService'
import engagementService, { type PostComment } from '@/services/engagementService'

type PostImage = {
  id: number
  postId: string
  imageUrl: string
}

type PostAmenity = {
  postId?: string
  amenityId: number
  currentCondition?: 'NEW' | 'GOOD' | 'OLD' | string
  amenity?: {
    id: number
    name: string
  }
}

type PostDetail = {
  id: string
  userId?: string
  user?: {
    id: string
    fullName?: string
    phone?: string | null
    avatarUrl?: string | null
    roles?: string[]
    hosts?: {
      isVerified?: boolean
      avgStar?: string | number
    }[]
  }
  ward?: {
    id: number
    name: string
  }
  title: string
  detailAddress: string
  area: string | number
  price: string | number
  deposit: string | number
  purpose?: string
  roomType: string
  postPurpose: string
  exactAddress?: string | null
  city?: string | null
  description: string
  latitude: string | number
  longitude: string | number
  postImages?: PostImage[]
  postAmenities?: PostAmenity[]
  comments?: PostComment[]
}

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const areaFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1
})

const roomTypeLabel: Record<string, string> = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  HOUSE: 'Nhà nguyên căn'
}

const postPurposeLabel: Record<string, string> = {
  RENT: 'Cho thuê',
  FIND_ROOMMATE: 'Tìm bạn ở ghép'
}

const amenityConditionLabel: Record<string, string> = {
  NEW: 'Mới',
  GOOD: 'Còn tốt',
  OLD: 'Đã sử dụng lâu'
}

const getAccessToken = () => {
  return localStorage.getItem('accessToken') ?? localStorage.getItem('token') ?? ''
}

const getStoredUser = () => {
  const rawUser = localStorage.getItem('authUser')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as StoredUser
  } catch {
    return null
  }
}

const toNumber = (value: string | number) => Number(value)

const formatPhoneNumber = (value?: string | null) => value || 'Chưa cập nhật'

const reportReasonOptions = [
  'Thông tin giá thuê không chính xác',
  'Địa chỉ hoặc vị trí không đúng',
  'Hình ảnh hoặc mô tả không phù hợp',
  'Bài đăng có dấu hiệu lừa đảo',
  'Khác'
]

const formatCommentTime = (value?: string) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const getInitials = (name?: string) => {
  const source = name || 'U'
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

type CommentItemProps = {
  comment: PostComment
  isReply?: boolean
  submittingCommentId?: string
  messagesByCommentId: Record<string, string>
  errorsByCommentId: Record<string, string>
  onReport: (commentId: string) => void
}

const CommentItem = ({
  comment: item,
  isReply = false,
  submittingCommentId,
  messagesByCommentId,
  errorsByCommentId,
  onReport
}: CommentItemProps) => {
  const authorName = item.user?.fullName || 'Người dùng UniStay'
  const avatarUrl = item.user?.avatarUrl
  const isSubmitting = submittingCommentId === item.id
  const message = messagesByCommentId[item.id]
  const error = errorsByCommentId[item.id]

  return (
    <article className={`${isReply ? 'ml-8 border-l border-gray-100 pl-4' : ''}`}>
      <div className='flex gap-3'>
        <div className='grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#001D3D] text-xs font-black text-[#FFC300]'>
          {avatarUrl ? <img src={avatarUrl} alt={authorName} className='h-full w-full object-cover' /> : getInitials(authorName)}
        </div>
        <div className='min-w-0 flex-1 rounded-2xl bg-gray-50 px-4 py-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='font-extrabold text-gray-950'>{authorName}</p>
            <span className='flex items-center gap-2'>
              {item.createdAt ? <p className='text-xs font-semibold text-gray-400'>{formatCommentTime(item.createdAt)}</p> : null}
              <button
                type='button'
                disabled={isSubmitting}
                onClick={() => onReport(item.id)}
                className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                <FaFlag />
                Report
              </button>
            </span>
          </div>
          <p className='mt-2 whitespace-pre-line text-sm leading-6 text-gray-700'>{item.content}</p>
          {message ? <p className='mt-2 text-xs font-bold text-green-600'>{message}</p> : null}
          {error ? <p className='mt-2 text-xs font-bold text-red-600'>{error}</p> : null}
        </div>
      </div>
      {item.replies && item.replies.length > 0 ? (
        <div className='mt-3 grid gap-3'>
          {item.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              submittingCommentId={submittingCommentId}
              messagesByCommentId={messagesByCommentId}
              errorsByCommentId={errorsByCommentId}
              onReport={onReport}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const location = useLocation()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [comment, setComment] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [storedUser] = useState(() => getStoredUser())
  const [isFavourite, setIsFavourite] = useState(false)
  const [isAccommodationRequested, setIsAccommodationRequested] = useState(false)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedReportReason, setSelectedReportReason] = useState(reportReasonOptions[0])
  const [customReportReason, setCustomReportReason] = useState('')
  const [submittingCommentReportId, setSubmittingCommentReportId] = useState<string>()
  const [commentReportMessages, setCommentReportMessages] = useState<Record<string, string>>({})
  const [commentReportErrors, setCommentReportErrors] = useState<Record<string, string>>({})
  const isAdmin = Boolean(storedUser?.roles?.includes('ADMIN'))
  const isStudent = Boolean(storedUser?.roles?.includes('STUDENT'))
  const needsStudentSetup = Boolean(storedUser?.status === 'SET_UP' || (storedUser && !isStudent && !isAdmin))
  const routeState = location.state as { returnTo?: string; returnLabel?: string } | null
  const backTo = routeState?.returnTo || '/home'
  const backLabel = routeState?.returnLabel || 'Quay lại trang chủ'

  const loadPostDetail = useCallback(
    async (signal?: AbortSignal, shouldSetLoading = true) => {
      if (!postId) {
        setErrorMessage('Không tìm thấy mã bài đăng trên đường dẫn.')
        setIsLoading(false)
        return
      }

      try {
        if (shouldSetLoading) {
          setIsLoading(true)
        }
        setErrorMessage('')

        const token = getAccessToken()
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal
        })
        const payload = (await response.json()) as ApiResponse<PostDetail>

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? 'Không thể tải chi tiết bài đăng.')
        }

        setPost(payload.data)

        if (isStudent) {
          try {
            const [favourites, sentRequests] = await Promise.all([
              engagementService.getFavouritePosts({ limit: 200 }),
              contactService.getSentRequests({ limit: 200 })
            ])
            setIsFavourite(favourites.data.some((item) => item.id === payload.data?.id))
            setIsAccommodationRequested(sentRequests.data.some((request) => request.postId === payload.data?.id))
          } catch {
            setIsFavourite(false)
            setIsAccommodationRequested(false)
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết bài đăng.')
      } finally {
        setIsLoading(false)
      }
    },
    [isStudent, postId]
  )

  useEffect(() => {
    const abortController = new AbortController()

    void loadPostDetail(abortController.signal)

    return () => abortController.abort()
  }, [loadPostDetail])

  const postImages = useMemo(() => post?.postImages?.filter((image) => Boolean(image.imageUrl)) ?? [], [post])
  const heroImage = postImages[selectedImageIndex]?.imageUrl
  const comments = useMemo(() => post?.comments ?? [], [post?.comments])
  const postAmenities = useMemo(
    () => post?.postAmenities?.filter((item) => Boolean(item.amenity?.name || item.amenityId)) ?? [],
    [post?.postAmenities]
  )
  const listingCriteria = useMemo(() => {
    if (!post) return []

    return [
      { label: 'Loại phòng', value: roomTypeLabel[String(post.roomType)] || post.roomType },
      { label: 'Nhu cầu', value: postPurposeLabel[String(post.postPurpose)] || postPurposeLabel[String(post.purpose)] || post.postPurpose || post.purpose },
      { label: 'Khu vực', value: post.ward?.name }
    ].filter((item): item is { label: string; value: string } => Boolean(item.value))
  }, [post])
  const owner = post?.user
  const ownerName = owner?.fullName || 'Chủ bài đăng'
  const ownerPhone = formatPhoneNumber(owner?.phone)
  const ownerVerified = Boolean(owner?.hosts?.some((host) => host.isVerified))
  const ownerRating = owner?.hosts?.find((host) => host.avgStar !== undefined)?.avgStar
  const addressLines = useMemo(() => {
    if (!post) return []

    return [
      post.exactAddress || post.detailAddress,
      [post.ward?.name, post.city].filter(Boolean).join(', ')
    ].filter(Boolean)
  }, [post])

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [post?.id])

  const runPostAction = async (action: () => Promise<{ message?: string }>, fallbackMessage: string) => {
    if (isSubmittingAction) {
      return
    }

    try {
      setIsSubmittingAction(true)
      setActionError('')
      setActionMessage('')

      const response = await action()
      setActionMessage(response.message || fallbackMessage)
    } catch {
      setActionError('Thao tác thất bại. Vui lòng đăng nhập đúng vai trò và thử lại.')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleAddFavourite = () => {
    if (!post) return

    if (needsStudentSetup) {
      setActionMessage('')
      setActionError('Vui lòng hoàn tất hồ sơ Sinh viên trong mục Thông tin cá nhân trước khi lưu bài đăng.')
      return
    }

    if (isSubmittingAction) {
      return
    }

    void (async () => {
      try {
        setIsSubmittingAction(true)
        setActionError('')
        setActionMessage('')

        if (isFavourite) {
          await engagementService.removeFavouritePost(post.id)
          setIsFavourite(false)
          return
        }

        await engagementService.addFavouritePost(post.id)
        setIsFavourite(true)
      } catch {
        setActionError('Không thể cập nhật trạng thái lưu bài. Vui lòng đăng nhập đúng vai trò và thử lại.')
      } finally {
        setIsSubmittingAction(false)
      }
    })()
  }

  const handleAccommodationRequest = () => {
    if (!post) return
    if (isAccommodationRequested || isSubmittingAction) return

    if (needsStudentSetup) {
      setActionMessage('')
      setActionError('Vui lòng hoàn tất hồ sơ Sinh viên trong mục Thông tin cá nhân trước khi gửi yêu cầu thuê/ở ghép.')
      return
    }

    void (async () => {
      try {
        setIsSubmittingAction(true)
        setActionError('')
        setActionMessage('')

        const response = await engagementService.createAccommodationRequest(post.id)
        setIsAccommodationRequested(true)
        setActionMessage(response.message || 'Đã gửi yêu cầu thuê/ở ghép.')
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { error?: { message?: string }; message?: string } | undefined)?.error?.message ||
            (error.response?.data as { message?: string } | undefined)?.message ||
            ''
          : ''
        const hasAlreadyRequested =
          axios.isAxiosError(error) &&
          error.response?.status === 409 &&
          message.toLowerCase().includes('already')

        if (hasAlreadyRequested) {
          setIsAccommodationRequested(true)
          setActionMessage('Bạn đã gửi yêu cầu cho bài đăng này.')
          return
        }

        setActionError('Không thể gửi yêu cầu. Vui lòng kiểm tra lại tài khoản sinh viên và thử lại.')
      } finally {
        setIsSubmittingAction(false)
      }
    })()
  }

  const handleReport = () => {
    if (!post) return
    setIsActionMenuOpen(false)
    setSelectedReportReason(reportReasonOptions[0])
    setCustomReportReason('')
    setIsReportModalOpen(true)
  }

  const handleSubmitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!post) return

    const reason =
      selectedReportReason === 'Khác'
        ? customReportReason.trim()
        : [selectedReportReason, customReportReason.trim()].filter(Boolean).join(' - ')

    if (!reason) {
      setActionError('Vui lòng nhập lý do báo cáo.')
      return
    }

    setIsReportModalOpen(false)
    void runPostAction(() => engagementService.createReport(post.id, reason), 'Đã gửi báo cáo bài đăng.')
  }

  const handleReportComment = (commentId: string) => {
    if (submittingCommentReportId) return

    void (async () => {
      try {
        setSubmittingCommentReportId(commentId)
        setCommentReportMessages((current) => ({ ...current, [commentId]: '' }))
        setCommentReportErrors((current) => ({ ...current, [commentId]: '' }))

        const response = await engagementService.createCommentReport(commentId, 'Báo cáo bình luận không phù hợp')
        setCommentReportMessages((current) => ({
          ...current,
          [commentId]: response.message || 'Đã gửi báo cáo bình luận.'
        }))
      } catch {
        setCommentReportErrors((current) => ({
          ...current,
          [commentId]: 'Không thể gửi báo cáo bình luận. Vui lòng đăng nhập và thử lại.'
        }))
      } finally {
        setSubmittingCommentReportId(undefined)
      }
    })()
  }

  const handleBanPostOwner = () => {
    if (!post?.userId) {
      setActionError('Không tìm thấy chủ bài đăng để chặn.')
      return
    }

    if (!window.confirm('Chặn người dùng đã đăng bài này?')) {
      return
    }

    const ownerId = post.userId
    void runPostAction(() => adminService.banUser(ownerId), 'Đã chặn người dùng.')
  }

  const handleRemovePost = () => {
    if (!post) return

    if (!window.confirm('Xóa bài viết khỏi danh sách công khai?')) {
      return
    }

    void runPostAction(
      () =>
        adminService.censorPost(post.id, {
          status: 'REJECTED',
          rejectionReason: 'Bài viết bị quản trị viên xóa khỏi danh sách công khai.'
        }),
      'Đã xóa bài viết khỏi danh sách công khai.'
    )
  }

  const handleBanOwnerAndRemovePost = () => {
    if (!post?.userId) {
      setActionError('Không tìm thấy chủ bài đăng để chặn.')
      return
    }

    if (!window.confirm('Chặn người dùng và xóa bài viết này?')) {
      return
    }

    const ownerId = post.userId
    void runPostAction(async () => {
      await adminService.banUser(ownerId)
      await adminService.censorPost(post.id, {
        status: 'REJECTED',
        rejectionReason: 'Người dùng bị chặn và bài viết bị quản trị viên xóa khỏi danh sách công khai.'
      })
      return { message: 'Đã chặn người dùng và xóa bài viết.' }
    }, 'Đã chặn người dùng và xóa bài viết.')
  }

  const handleCreateComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!post || !comment.trim()) {
      return
    }

    void runPostAction(async () => {
      const response = await engagementService.createComment(post.id, comment.trim())
      setComment('')
      await loadPostDetail(undefined, false)
      return response
    }, 'Đã gửi bình luận.')
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 text-[#181A20]'>
        <SiteHeader />
        <main className='px-4 py-10'>
          <div className='mx-auto max-w-5xl rounded-lg bg-white p-8 shadow-sm'>
            <p className='text-sm text-gray-500'>Đang tải chi tiết bài đăng...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (errorMessage || !post) {
    return (
      <div className='min-h-screen bg-gray-50 text-[#181A20]'>
        <SiteHeader />
        <main className='px-4 py-10'>
          <div className='mx-auto max-w-5xl rounded-lg bg-white p-8 shadow-sm'>
            <Link
              to={backTo}
              aria-label={backLabel}
              title={backLabel}
              className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
            >
              <FaArrowLeft />
            </Link>
            <h1 className='mt-4 text-2xl font-bold text-gray-900'>Không thể hiển thị bài đăng</h1>
            <p className='mt-2 text-gray-600'>{errorMessage || 'Bài đăng không tồn tại.'}</p>
            <p className='mt-4 text-sm text-gray-500'>
              Vui lòng đăng nhập lại hoặc chọn một bài đăng khác trong danh sách.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 text-[#181A20]'>
      <SiteHeader />
      <main className='px-4 py-10'>
        <article className='mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]'>
          <section className='rounded-lg bg-white p-6 shadow-sm'>
          <Link
            to={backTo}
            aria-label={backLabel}
            title={backLabel}
            className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
          >
            <FaArrowLeft />
          </Link>

          {heroImage ? (
            <div className='mt-5'>
              <div className='relative overflow-hidden rounded-lg bg-gray-100'>
                <img src={heroImage} alt={post.title} className='h-80 w-full object-cover' />
                {postImages.length > 1 ? (
                  <span className='absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white'>
                    {selectedImageIndex + 1}/{postImages.length}
                  </span>
                ) : null}
              </div>

              {postImages.length > 1 ? (
                <div className='mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5'>
                  {postImages.map((image, index) => (
                    <button
                      key={image.id || `${image.imageUrl}-${index}`}
                      type='button'
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-20 overflow-hidden rounded-lg border-2 bg-gray-100 transition ${
                        selectedImageIndex === index
                          ? 'border-[#FFC300] shadow-md shadow-[#001D3D]/15'
                          : 'border-transparent hover:border-[#F6D983]'
                      }`}
                    >
                      <img src={image.imageUrl} alt={`${post.title} ${index + 1}`} className='h-full w-full object-cover' />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className='mt-5 flex h-80 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500'>
              Chưa có hình ảnh
            </div>
          )}

          <div className='mt-6'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold uppercase tracking-wide text-yellow-600'>
                  {roomTypeLabel[String(post.roomType)] || post.roomType}
                </p>
                <h1 className='mt-2 text-3xl font-black text-gray-950'>{post.title}</h1>
              </div>
              {!isAdmin ? (
                <div className='relative flex shrink-0 items-center gap-2'>
                  <button
                    type='button'
                    disabled={isSubmittingAction}
                    onClick={handleAddFavourite}
                    className={`grid h-11 w-11 place-items-center rounded-full border text-lg transition ${
                      isFavourite
                        ? 'border-[#FFC300] bg-[#FFF2B8] text-[#D79A00]'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-[#FFC300] hover:text-[#D79A00]'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                    aria-label={isFavourite ? 'Bỏ lưu bài đăng' : 'Lưu bài đăng'}
                    title={isFavourite ? 'Bỏ lưu bài đăng' : 'Lưu bài đăng'}
                  >
                    {isFavourite ? <FaHeart /> : <FaRegHeart />}
                  </button>
                  <button
                    type='button'
                    onClick={() => setIsActionMenuOpen((current) => !current)}
                    className='grid h-11 w-11 place-items-center rounded-full border border-gray-200 bg-white text-gray-800 transition hover:border-[#FFC300] hover:text-[#001D3D]'
                    aria-expanded={isActionMenuOpen}
                    aria-label='Mở menu thao tác'
                    title='Thao tác'
                  >
                    <FaEllipsisV />
                  </button>
                  {isActionMenuOpen ? (
                    <div className='absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl shadow-[#001D3D]/15'>
                      <button
                        type='button'
                        disabled={isSubmittingAction}
                        onClick={handleReport}
                        className='flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70'
                      >
                        <FaFlag />
                        Report Post
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className='mt-4 grid gap-1 text-sm font-semibold text-gray-600'>
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className='mt-5 text-4xl font-black leading-tight text-[#FF5A3D] drop-shadow-sm'>
              {currencyFormatter.format(toNumber(post.price))}
              <span className='ml-2 text-xl font-extrabold text-[#FF5A3D]'>/tháng</span>
            </p>
          </div>

          <div className='mt-6 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-500'>Diện tích</p>
              <p className='mt-1 font-bold text-gray-950'>{areaFormatter.format(toNumber(post.area))} m²</p>
            </div>
            <div className='rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-500'>Tiền cọc</p>
              <p className='mt-1 font-bold text-gray-950'>{currencyFormatter.format(toNumber(post.deposit))}</p>
            </div>
          </div>

          <section className='mt-8'>
            <h2 className='text-xl font-bold text-gray-950'>Mô tả</h2>
            <p className='mt-3 whitespace-pre-line leading-7 text-gray-700'>{post.description}</p>
          </section>

          <section className='mt-8 grid gap-5 border-t border-gray-100 pt-6'>
            {listingCriteria.length > 0 ? (
              <div>
                <h2 className='text-xl font-bold text-gray-950'>Tiêu chí bài đăng</h2>
                <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                  {listingCriteria.map((item) => (
                    <div key={item.label} className='rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3'>
                      <p className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>{item.label}</p>
                      <p className='mt-1 font-bold text-[#001D3D]'>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className='text-xl font-bold text-gray-950'>Tiện ích</h2>
              {postAmenities.length > 0 ? (
                <div className='mt-4 flex flex-wrap gap-3'>
                  {postAmenities.map((item) => {
                    const condition = item.currentCondition ? amenityConditionLabel[String(item.currentCondition)] : ''

                    return (
                      <div
                        key={`${item.amenityId}-${item.amenity?.name || ''}`}
                        className='rounded-full border border-[#F1C232] bg-[#FFF7D6] px-4 py-2 text-sm font-extrabold text-[#001D3D]'
                      >
                        {item.amenity?.name || `Tiện ích #${item.amenityId}`}
                        {condition ? <span className='ml-2 text-xs font-bold text-gray-500'>({condition})</span> : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className='mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500'>
                  Chủ bài đăng chưa cập nhật tiện ích cho phòng này.
                </p>
              )}
            </div>
          </section>
          </section>

          <aside className='space-y-4'>
          <section className='rounded-xl bg-[#FFF0C7] p-5 shadow-sm shadow-[#001D3D]/10'>
            <div className='flex items-center gap-3'>
              <div className='grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#001D3D]/20 bg-white text-2xl text-[#001D3D]'>
                {owner?.avatarUrl ? <img src={owner.avatarUrl} alt={ownerName} className='h-full w-full object-cover' /> : <FaUserCircle />}
              </div>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <h2 className='truncate text-lg font-black text-gray-950'>{ownerName}</h2>
                  {ownerVerified ? <FaCheckCircle className='shrink-0 text-green-500' aria-label='Đã xác minh' /> : null}
                </div>
                <p className='mt-1 text-xs font-semibold text-gray-600'>
                  {ownerRating && Number(ownerRating) >= 0 ? `Đánh giá ${Number(ownerRating).toFixed(1)} sao` : 'Chủ bài đăng UniStay'}
                </p>
              </div>
            </div>
            <a
              href={owner?.phone ? `tel:${owner.phone}` : undefined}
              className='mt-4 flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#C7A643] px-4 py-3 text-sm font-black text-[#001D3D] shadow-md shadow-[#001D3D]/10 transition hover:bg-[#B9972E]'
            >
              <FaPhoneAlt />
              <span>{ownerPhone}</span>
            </a>
          </section>

          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <h2 className='text-lg font-bold text-gray-950'>Thao tác</h2>
            <div className='mt-4 grid gap-3'>
              {isAdmin ? (
                <>
                  <button
                    type='button'
                    disabled={isSubmittingAction}
                    onClick={handleBanPostOwner}
                    className='rounded-lg bg-[#001D3D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:opacity-70'
                  >
                    Chặn người dùng
                  </button>
                  <button
                    type='button'
                    disabled={isSubmittingAction}
                    onClick={handleRemovePost}
                    className='rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70'
                  >
                    Xóa bài viết
                  </button>
                  <button
                    type='button'
                    disabled={isSubmittingAction}
                    onClick={handleBanOwnerAndRemovePost}
                    className='rounded-lg border border-red-300 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70'
                  >
                    Chặn và xóa bài
                  </button>
                </>
              ) : (
                <>
                  <button
                    type='button'
                    disabled={isSubmittingAction || isAccommodationRequested}
                    onClick={handleAccommodationRequest}
                    className='rounded-lg bg-[#001D3D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:opacity-70'
                  >
                    {isAccommodationRequested ? 'Đã gửi yêu cầu' : 'Gửi yêu cầu thuê/ở ghép'}
                  </button>
                </>
              )}
            </div>
            {actionMessage ? <p className='mt-3 text-sm font-semibold text-green-600'>{actionMessage}</p> : null}
            {actionError ? <p className='mt-3 text-sm font-semibold text-red-600'>{actionError}</p> : null}
          </section>

          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <h2 className='text-lg font-bold text-gray-950'>Vị trí bài đăng</h2>
            <p className='mt-1 text-sm text-gray-500'>Bản đồ hiển thị đúng tọa độ chủ bài đăng đã cung cấp.</p>
            <PostLocationMap
              latitude={post.latitude}
              longitude={post.longitude}
              title={post.title}
              address={post.detailAddress}
              className='mt-4'
              height={360}
            />
          </section>

          {!isAdmin ? (
          <section className='rounded-lg bg-white p-5 shadow-sm'>
            <h2 className='text-lg font-bold text-gray-950'>Bình luận</h2>
            <form onSubmit={handleCreateComment} className='mt-4 grid gap-3'>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder='Nhập bình luận của bạn'
                className='min-h-28 resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'
              />
              <button
                type='submit'
                disabled={isSubmittingAction || !comment.trim()}
                className='rounded-lg bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70'
              >
                Gửi bình luận
              </button>
            </form>

            <div className='mt-6 border-t border-gray-100 pt-5'>
              {comments.length > 0 ? (
                <div className='grid gap-4'>
                  {comments.map((item) => (
                    <CommentItem
                      key={item.id}
                      comment={item}
                      submittingCommentId={submittingCommentReportId}
                      messagesByCommentId={commentReportMessages}
                      errorsByCommentId={commentReportErrors}
                      onReport={handleReportComment}
                    />
                  ))}
                </div>
              ) : (
                <p className='rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500'>
                  Chưa có bình luận nào cho bài đăng này.
                </p>
              )}
            </div>
          </section>
          ) : null}
          </aside>
        </article>
      </main>
      {isReportModalOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#000814]/60 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl shadow-[#000814]/30'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-black text-gray-950'>Báo cáo bài đăng</h2>
                <p className='mt-1 text-sm font-semibold text-gray-500'>Chọn lý do hoặc nhập thêm mô tả để quản trị viên xử lý nhanh hơn.</p>
              </div>
              <button
                type='button'
                onClick={() => setIsReportModalOpen(false)}
                className='grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 transition hover:bg-gray-200'
                aria-label='Hủy báo cáo'
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className='mt-5 grid gap-4'>
              <label className='grid gap-2'>
                <span className='text-sm font-extrabold text-gray-800'>Lý do báo cáo</span>
                <select
                  value={selectedReportReason}
                  onChange={(event) => setSelectedReportReason(event.target.value)}
                  className='h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                >
                  {reportReasonOptions.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className='grid gap-2'>
                <span className='text-sm font-extrabold text-gray-800'>
                  {selectedReportReason === 'Khác' ? 'Mô tả lý do' : 'Thông tin bổ sung'}
                </span>
                <textarea
                  value={customReportReason}
                  onChange={(event) => setCustomReportReason(event.target.value)}
                  className='min-h-32 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                  placeholder='Nhập thêm chi tiết nếu cần...'
                />
              </label>

              <div className='mt-2 flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsReportModalOpen(false)}
                  className='rounded-xl border border-gray-200 px-5 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={isSubmittingAction}
                  className='rounded-xl bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:opacity-70'
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  )
}

type StoredUser = {
  roles?: string[]
  status?: string | null
}

export default PostDetailPage
