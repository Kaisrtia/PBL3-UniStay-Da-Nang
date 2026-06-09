const authMessageTranslations: Record<string, string> = {
  'Email is required!': 'Vui lòng nhập email.',
  'Email is required': 'Vui lòng nhập email.',
  'Password is required': 'Vui lòng nhập mật khẩu.',
  'Full name is required': 'Vui lòng nhập họ và tên.',
  'Email already exists': 'Email này đã được đăng ký.',
  'Registration successful. Please verify your email to continue.':
    'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
  'Email and code are required!': 'Vui lòng nhập email và mã xác thực.',
  'Email not found': 'Không tìm thấy email này.',
  'Email already verified': 'Email đã được xác thực.',
  'Email not verified': 'Email chưa được xác thực.',
  'Email is not verified': 'Email chưa được xác thực.',
  'Verification email already sent': 'Mã xác thực đã được gửi. Vui lòng đợi trước khi yêu cầu lại.',
  'Failed to send verification email': 'Không thể gửi email xác thực. Vui lòng thử lại.',
  'Verification email not found or expired': 'Mã xác thực không tồn tại hoặc đã hết hạn.',
  'Invalid verification code': 'Mã xác thực không hợp lệ.',
  'Verification code sent to your email': 'Đã gửi mã xác thực đến email của bạn.',
  'Email verified successfully': 'Xác thực email thành công.',
  'Google accounts cannot reset password this way': 'Tài khoản Google không thể đặt lại mật khẩu bằng cách này.',
  'Reset link already sent, please wait before requesting again':
    'Liên kết đặt lại mật khẩu đã được gửi. Vui lòng đợi trước khi yêu cầu lại.',
  'Failed to send password reset email': 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.',
  'Token and new password are required!': 'Liên kết đặt lại mật khẩu hoặc mật khẩu mới không hợp lệ.',
  'Reset link is invalid or has expired': 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  'Password reset link sent to your email': 'Đã gửi liên kết đặt lại mật khẩu đến email của bạn.',
  'Password reset successfully': 'Đã đặt lại mật khẩu thành công.',
  'Google token is required': 'Thiếu mã đăng nhập Google. Vui lòng thử lại.',
  'Invalid Google token': 'Mã đăng nhập Google không hợp lệ. Vui lòng thử lại.',
  'Email is already registered with password login': 'Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.',
  'User is registered with Google, please login with Google': 'Tài khoản này đăng ký bằng Google. Vui lòng đăng nhập bằng Google.',
  'User is banned': 'Tài khoản của bạn đã bị khóa.',
  'Account is not active': 'Tài khoản chưa hoạt động.',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'User not found': 'Không tìm thấy tài khoản.'
}

export const translateAuthMessage = (message?: string | null) => {
  if (!message) return ''

  return authMessageTranslations[message] || message
}
