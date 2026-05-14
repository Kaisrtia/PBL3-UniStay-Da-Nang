const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'unistay/posts'

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: {
    message?: string
  }
}

const getUploadEndpoint = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Thiếu cấu hình Cloudinary. Vui lòng kiểm tra VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
}

export const uploadPostImage = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Hiện tại hệ thống chỉ hỗ trợ upload ảnh cho bài đăng.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', CLOUDINARY_UPLOAD_FOLDER)

  const response = await fetch(getUploadEndpoint(), {
    method: 'POST',
    body: formData
  })
  const data = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'Upload ảnh lên Cloudinary thất bại.')
  }

  return data.secure_url
}

export const uploadPostImages = async (files: File[]) => Promise.all(files.map((file) => uploadPostImage(file)))

export default {
  uploadPostImage,
  uploadPostImages
}
