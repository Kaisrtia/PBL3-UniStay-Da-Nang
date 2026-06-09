import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }: PaginationProps) => {
  const normalizedTotalPages = Math.max(1, totalPages)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < normalizedTotalPages

  const goToPage = (page: number) => {
    if (disabled) return
    onPageChange(Math.min(normalizedTotalPages, Math.max(1, page)))
  }

  return (
    <nav className='flex flex-wrap items-center justify-center gap-3' aria-label='Phân trang bài đăng'>
      <button
        type='button'
        onClick={() => goToPage(currentPage - 1)}
        disabled={disabled || !canGoPrevious}
        className='inline-flex min-h-11 items-center gap-2 rounded-full border border-[#001D3D] px-5 py-2 text-sm font-extrabold text-[#001D3D] transition hover:bg-[#001D3D] hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400'
      >
        <FaChevronLeft className='text-xs' />
        Trang trước
      </button>

      <span className='min-h-11 rounded-full bg-[#F5F7FA] px-5 py-2.5 text-sm font-extrabold text-gray-700'>
        Trang {currentPage} / {normalizedTotalPages}
      </span>

      <button
        type='button'
        onClick={() => goToPage(currentPage + 1)}
        disabled={disabled || !canGoNext}
        className='inline-flex min-h-11 items-center gap-2 rounded-full border border-[#001D3D] px-5 py-2 text-sm font-extrabold text-[#001D3D] transition hover:bg-[#001D3D] hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400'
      >
        Trang sau
        <FaChevronRight className='text-xs' />
      </button>
    </nav>
  )
}

export default Pagination
