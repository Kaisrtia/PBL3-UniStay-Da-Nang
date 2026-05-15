import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { FaCheck, FaEye, FaUsers, FaTimes } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import adminService, {
  type AdminPostStatistic,
  type AdminStatsPeriod,
  type AdminUser
} from '@/services/adminService'
import { type Post, type PostStatus } from '@/services/postService'

type AdminTab = 'overview' | 'posts' | 'users'

type AdminDashboardPageProps = {
  activeTab: AdminTab
}

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  UPDATED: 'Cập nhật',
  HIDDEN: 'Đã ẩn',
  ACTIVE: 'Hoạt động',
  BANNED: 'Bị khóa',
  LOCKED: 'Chờ mở',
  SET_UP: 'Thiết lập'
}

const adminTabs: { label: string; value: AdminTab; to: string }[] = [
  { label: 'Tổng quan', value: 'overview', to: '/admin/overview' },
  { label: 'Bài đăng', value: 'posts', to: '/admin/posts' },
  { label: 'Người dùng', value: 'users', to: '/admin/users' }
]

const formatNumber = (value?: number) => new Intl.NumberFormat('vi-VN').format(value || 0)

const getStatusClass = (status?: string) => {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'bg-green-100 text-green-700'
  if (status === 'PENDING' || status === 'UPDATED' || status === 'SET_UP') return 'bg-yellow-100 text-yellow-700'
  if (status === 'REJECTED' || status === 'BANNED') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const getPostCountByStatus = (stats: AdminPostStatistic, status: string) =>
  stats.byStatus?.find((item) => item.status === status)?.count || 0

type ChartPoint = {
  label: string
  posts: number
  approved: number
}

const getPostDate = (post: Post) => {
  const date = post.createdAt ? new Date(post.createdAt) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const buildDailyChartData = (posts: Post[]): ChartPoint[] => {
  const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  const data = labels.map((label) => ({ label, posts: 0, approved: 0 }))

  posts.forEach((post) => {
    const date = getPostDate(post)
    if (!date) return

    const index = date.getDay() === 0 ? 6 : date.getDay() - 1
    data[index].posts += 1
    if (post.status === 'APPROVED') data[index].approved += 1
  })

  return data
}

const buildHourlyChartData = (posts: Post[]): ChartPoint[] => {
  const ranges = [
    { label: '0-4h', start: 0, end: 4 },
    { label: '4-8h', start: 4, end: 8 },
    { label: '8-12h', start: 8, end: 12 },
    { label: '12-16h', start: 12, end: 16 },
    { label: '16-20h', start: 16, end: 20 },
    { label: '20-24h', start: 20, end: 24 }
  ]
  const data = ranges.map((range) => ({ label: range.label, posts: 0, approved: 0 }))

  posts.forEach((post) => {
    const date = getPostDate(post)
    if (!date) return

    const hour = date.getHours()
    const index = ranges.findIndex((range) => hour >= range.start && hour < range.end)
    if (index < 0) return

    data[index].posts += 1
    if (post.status === 'APPROVED') data[index].approved += 1
  })

  return data
}

const ActivityChart = ({ title, data }: { title: string; data: ChartPoint[] }) => {
  const maxValue = Math.max(...data.flatMap((item) => [item.posts, item.approved]), 1)

  return (
  <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
    <div className='flex items-start justify-between gap-6'>
      <h2 className='text-3xl font-extrabold text-[#181A20]'>{title}</h2>
      <div className='flex items-center gap-5 text-xs font-bold text-gray-500'>
        <span className='flex items-center gap-2'>
          <span className='h-3 w-3 rounded-full bg-[#001D3D]' />
          Bài đăng
        </span>
        <span className='flex items-center gap-2'>
          <span className='h-3 w-3 rounded-full bg-[#FFC300]' />
          Đã duyệt
        </span>
      </div>
    </div>
    <div className='mt-7 flex h-64 items-end gap-4 border-y border-gray-100 px-2 py-4'>
      {data.map((item) => (
        <div key={item.label} className='flex h-full min-w-0 flex-1 flex-col justify-end'>
          <div className='flex h-full items-end justify-center gap-1'>
            <span
              className='w-4 rounded-t-md bg-[#001D3D]'
              title={`${item.posts} bài đăng`}
              style={{ height: `${Math.max(8, (item.posts / maxValue) * 100)}%` }}
            />
            <span
              className='w-4 rounded-t-md bg-[#FFC300]'
              title={`${item.approved} bài đã duyệt`}
              style={{ height: `${Math.max(8, (item.approved / maxValue) * 100)}%` }}
            />
          </div>
          <span className='mt-3 truncate text-center text-[10px] font-extrabold text-gray-400'>{item.label}</span>
        </div>
      ))}
    </div>
    <p className='mt-3 text-xs font-semibold text-gray-500'>
      Dựa trên thời điểm tạo của các bài đăng đang tải trong trang quản trị.
    </p>
  </section>
  )
}

const AdminShell = ({ activeTab, children }: AdminDashboardPageProps & { children: ReactNode }) => {
  const location = useLocation()

  return (
    <div className='min-h-screen bg-[#F4F5F7] text-[#181A20]'>
      <SiteHeader accountLabel='Admin' />
      <main className='mx-auto max-w-[1440px] px-8 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <h1 className='text-4xl font-black tracking-wide'>TRANG THỐNG KÊ</h1>
          <nav className='flex rounded-lg bg-gray-200 p-1 text-sm font-bold shadow-inner'>
            {adminTabs.map((tab) => (
              <Link
                key={tab.value}
                to={tab.to}
                className={`rounded-md px-7 py-2 transition ${
                  activeTab === tab.value || location.pathname === tab.to
                    ? 'bg-white text-[#181A20] shadow-md'
                    : 'text-gray-700 hover:text-[#181A20]'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <article className='flex min-h-40 items-center justify-between rounded-2xl bg-white px-9 py-7 shadow-lg shadow-black/20'>
    <div>
      <p className='text-2xl font-extrabold'>{label}</p>
      <p className='mt-5 text-5xl font-black text-[#F5C434]'>{formatNumber(value)}</p>
    </div>
    <FaUsers className='text-7xl text-black' />
  </article>
)

const PeriodControls = ({
  period,
  onChange
}: {
  period: AdminStatsPeriod
  onChange: (period: AdminStatsPeriod) => void
}) => (
  <section className='rounded-2xl bg-white p-5 shadow-lg shadow-black/15'>
    <div className='flex gap-4'>
      {[
        ['day', 'Hôm nay'],
        ['week', 'Tuần này'],
        ['month', 'Tháng này']
      ].map(([value, label]) => (
        <button
          key={value}
          type='button'
          onClick={() => onChange(value as AdminStatsPeriod)}
          className={`rounded-full px-6 py-3 text-sm font-bold transition ${
            period === value ? 'bg-[#F8D977] text-[#181A20]' : 'bg-[#FFE9A3] text-[#181A20] hover:bg-[#F8D977]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </section>
)

const DateFilterCard = () => (
  <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
    <label className='flex items-center justify-between gap-4 text-lg font-medium'>
      Ngày bắt đầu
      <input className='h-10 w-44 rounded-full border border-[#001D3D] px-4 outline-none focus:ring-2 focus:ring-[#FFC300]' />
    </label>
    <label className='mt-5 flex items-center justify-between gap-4 text-lg font-medium'>
      Ngày kết thúc
      <input className='h-10 w-44 rounded-full border border-[#001D3D] px-4 outline-none focus:ring-2 focus:ring-[#FFC300]' />
    </label>
  </section>
)

const RegionalStatistics = ({ posts }: { posts: Post[] }) => {
  const regionalData = useMemo(() => {
    const counts = new Map<string, number>()
    posts.forEach((post) => {
      const wardName = post.ward?.name || 'Chưa rõ'
      counts.set(wardName, (counts.get(wardName) || 0) + 1)
    })

    const total = Math.max(posts.length, 1)
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4)
  }, [posts])

  return (
    <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
      <h2 className='text-xl font-extrabold text-gray-700'>Thống kê theo khu vực</h2>
      <div className='mt-6 grid gap-5'>
        {regionalData.map((item) => (
          <div key={item.name}>
            <div className='mb-2 flex justify-between text-sm font-extrabold text-gray-600'>
              <span>{item.name}</span>
              <span>{item.percent}%</span>
            </div>
            <div className='h-2 rounded-full bg-gray-100'>
              <div className='h-full rounded-full bg-[#756309]' style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
      <button className='mt-8 h-14 w-full rounded-lg bg-gray-100 text-base font-extrabold text-gray-500'>
        Xem chi tiết
      </button>
    </section>
  )
}

const OverviewContent = () => {
  const [period, setPeriod] = useState<AdminStatsPeriod>('day')
  const [stats, setStats] = useState<AdminPostStatistic>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setErrorMessage('')
        const [statResult, postResult, userResult] = await Promise.all([
          adminService.getPostStatistics(period),
          adminService.getAdminPosts({ limit: 100 }),
          adminService.getUsers({ limit: 5 })
        ])
        setStats(statResult)
        setPosts(postResult.data)
        setUsers(userResult.data)
      } catch {
        setErrorMessage('Không tải được dữ liệu admin. Hãy đăng nhập bằng tài khoản ADMIN.')
      }
    }

    void loadOverview()
  }, [period])

  const recentFlaggedPosts = posts.filter((post) => (post._count?.comments || 0) > 0 || post.status !== 'APPROVED').slice(0, 3)
  const dailyChartData = useMemo(() => buildDailyChartData(posts), [posts])
  const hourlyChartData = useMemo(() => buildHourlyChartData(posts), [posts])

  return (
    <AdminShell activeTab='overview'>
      {errorMessage ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{errorMessage}</p> : null}

      <section className='mt-12 grid gap-16 lg:grid-cols-[1fr_1fr_1fr]'>
        <StatCard label='Tổng người dùng' value={users.length ? users.length : 0} />
        <StatCard label='Tổng số người truy cập' value={1304} />
        <StatCard label='Số lượng bài đăng mới' value={stats.totalPosts || posts.length} />
      </section>

      <section className='mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='grid gap-10'>
          <ActivityChart title='Thống kê theo ngày' data={dailyChartData} />
          <ActivityChart title='Thống kê theo giờ' data={hourlyChartData} />
        </div>
        <aside className='grid content-start gap-8'>
          <PeriodControls period={period} onChange={setPeriod} />
          <DateFilterCard />
          <RegionalStatistics posts={posts} />
        </aside>
      </section>

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex items-start justify-between gap-6'>
          <h2 className='text-3xl font-extrabold'>Gần đây - bài đăng cần xử lý</h2>
          <p className='text-sm text-gray-500'>Ưu tiên tin bị báo cáo hoặc đang chờ duyệt.</p>
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[760px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Người đăng</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3'>Bài đăng</th>
                <th className='py-3'>Bình luận</th>
                <th className='py-3 text-right'>Quyết định</th>
              </tr>
            </thead>
            <tbody>
              {(recentFlaggedPosts.length ? recentFlaggedPosts : posts.slice(0, 3)).map((post) => (
                <tr key={post.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{post.user?.fullName || post.userId || 'Người dùng'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(post.status)}`}>
                      {statusLabels[String(post.status)] || post.status}
                    </span>
                  </td>
                  <td className='max-w-xs truncate py-4'>{post.title}</td>
                  <td className='py-4'>{post._count?.comments || 0}</td>
                  <td className='py-4 text-right'>
                    <Link to='/admin/posts' className='rounded-full bg-[#F8D977] px-5 py-2 text-xs font-extrabold'>
                      Xử lý
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

const AdminPostsContent = () => {
  const [period, setPeriod] = useState<AdminStatsPeriod>('day')
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>('ALL')
  const [stats, setStats] = useState<AdminPostStatistic>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [message, setMessage] = useState('')

  const loadPosts = useCallback(async () => {
    const [statResult, postResult] = await Promise.all([
      adminService.getPostStatistics(period),
      adminService.getAdminPosts({ status: statusFilter === 'ALL' ? undefined : statusFilter, limit: 100 })
    ])
    setStats(statResult)
    setPosts(postResult.data)
  }, [period, statusFilter])

  useEffect(() => {
    void loadPosts().catch(() => setMessage('Không tải được danh sách bài đăng admin.'))
  }, [loadPosts])

  const handleCensor = async (postId: string, status: PostStatus) => {
    try {
      setMessage('')
      await adminService.censorPost(postId, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Không phù hợp với quy định đăng tin.' : undefined
      })
      await loadPosts()
      setMessage(status === 'APPROVED' ? 'Đã duyệt bài đăng.' : 'Đã đánh dấu vi phạm.')
    } catch {
      setMessage('Không thể cập nhật trạng thái bài đăng.')
    }
  }
  const dailyChartData = useMemo(() => buildDailyChartData(posts), [posts])
  const hourlyChartData = useMemo(() => buildHourlyChartData(posts), [posts])

  return (
    <AdminShell activeTab='posts'>
      {message ? <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p> : null}

      <section className='mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='grid gap-8'>
          <ActivityChart title='Thống kê theo ngày' data={dailyChartData} />
          <ActivityChart title='Thống kê theo giờ' data={hourlyChartData} />
        </div>
        <aside className='grid content-start gap-8'>
          <PeriodControls period={period} onChange={setPeriod} />
          <DateFilterCard />
          <section className='rounded-2xl bg-white p-5 shadow-lg shadow-black/15'>
            <p className='text-sm font-extrabold'>Lọc trạng thái</p>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  type='button'
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                    statusFilter === status ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {status === 'ALL' ? 'Tất cả' : statusLabels[status]}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex flex-wrap items-start justify-between gap-5'>
          <div>
            <h2 className='text-3xl font-extrabold'>Gần đây - bài đăng vi phạm</h2>
            <p className='mt-2 text-sm text-gray-500'>
              Tổng: {formatNumber(stats.totalPosts || posts.length)} | Chờ duyệt: {getPostCountByStatus(stats, 'PENDING')}
            </p>
          </div>
          <p className='text-sm text-gray-500'>Các quyết định xử lý sẽ được ghi nhận và gửi thông báo cho người đăng.</p>
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[980px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Người dùng</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3'>Bài đăng</th>
                <th className='py-3'>Khu vực</th>
                <th className='py-3'>Báo cáo</th>
                <th className='py-3 text-right'>Quyết định</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{post.user?.fullName || post.userId || 'Người dùng'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(post.status)}`}>
                      {statusLabels[String(post.status)] || post.status}
                    </span>
                  </td>
                  <td className='max-w-xs truncate py-4'>{post.title}</td>
                  <td className='py-4'>{post.ward?.name || 'Chưa rõ'}</td>
                  <td className='py-4'>{post._count?.comments || 0}</td>
                  <td className='py-4'>
                    <div className='flex justify-end gap-2'>
                      <Link
                        to={`/posts/${post.id}`}
                        state={{ returnTo: '/admin/posts', returnLabel: 'Quay lại trang quản trị' }}
                        className='inline-flex items-center gap-2 rounded-full bg-[#001D3D] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#003566]'
                      >
                        <FaEye />
                        Chi tiết
                      </Link>
                      <button
                        type='button'
                        onClick={() => void handleCensor(post.id, 'REJECTED')}
                        className='inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white'
                      >
                        <FaTimes />
                        Vi phạm
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleCensor(post.id, 'APPROVED')}
                        className='inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-extrabold text-white'
                      >
                        <FaCheck />
                        Duyệt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

const AdminUsersContent = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    const result = await adminService.getUsers({ limit: 24 })
    setUsers(result.data)
  }

  useEffect(() => {
    void loadUsers().catch(() => setMessage('Không tải được danh sách người dùng admin.'))
  }, [])

  const handleToggleUser = async (user: AdminUser) => {
    try {
      if (user.status === 'BANNED') {
        await adminService.unbanUser(user.id)
      } else {
        await adminService.banUser(user.id)
      }
      await loadUsers()
    } catch {
      setMessage('Không thể cập nhật trạng thái người dùng.')
    }
  }

  return (
    <AdminShell activeTab='users'>
      {message ? <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p> : null}
      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <h2 className='text-3xl font-extrabold'>Người dùng</h2>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[900px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Tên</th>
                <th className='py-3'>Email</th>
                <th className='py-3'>Vai trò</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3 text-right'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{user.fullName}</td>
                  <td className='py-4 text-gray-600'>{user.email}</td>
                  <td className='py-4'>{user.roles?.join(', ') || 'USER'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(user.status)}`}>
                      {statusLabels[String(user.status)] || user.status}
                    </span>
                  </td>
                  <td className='py-4 text-right'>
                    <button
                      type='button'
                      onClick={() => void handleToggleUser(user)}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold text-white ${
                        user.status === 'BANNED' ? 'bg-green-500' : 'bg-red-600'
                      }`}
                    >
                      {user.status === 'BANNED' ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export const AdminOverviewPage = () => <OverviewContent />
export const AdminPostsPage = () => <AdminPostsContent />
export const AdminUsersPage = () => <AdminUsersContent />
