export const clearAuthSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('token')
  localStorage.removeItem('authUser')
  window.dispatchEvent(new Event('auth-user-updated'))
}
