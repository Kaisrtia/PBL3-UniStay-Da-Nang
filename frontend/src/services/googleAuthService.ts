export type GoogleCredentialResponse = {
  credential?: string
}

type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  type?: 'standard' | 'icon'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  width?: number | string
  locale?: string
}

type GoogleAccounts = {
  accounts?: {
    id?: {
      initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
      renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
      prompt: (callback?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void
      cancel?: () => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleAccounts
  }
}

const googleScriptId = 'google-identity-services'

export const getGoogleClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.getElementById(googleScriptId)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Không tải được Google Login.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = googleScriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được Google Login.'))
    document.head.appendChild(script)
  })

export const getGoogleIdentity = async () => {
  const clientId = getGoogleClientId()

  if (!clientId) {
    throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID cho frontend.')
  }

  await loadGoogleIdentityScript()

  const googleIdentity = window.google?.accounts?.id
  if (!googleIdentity) {
    throw new Error('Google Login chưa sẵn sàng. Vui lòng thử lại.')
  }

  return { clientId, googleIdentity }
}

export const requestGoogleIdToken = async () => {
  const { clientId, googleIdentity } = await getGoogleIdentity()

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true
        googleIdentity.cancel?.()
        reject(new Error('Chưa nhận được phản hồi từ Google. Vui lòng thử lại.'))
      }
    }, 60000)

    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)

        if (response.credential) {
          resolve(response.credential)
          return
        }

        reject(new Error('Google không trả về mã đăng nhập hợp lệ.'))
      }
    })

    googleIdentity.prompt((notification) => {
      if (settled) return

      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        settled = true
        window.clearTimeout(timeoutId)
        reject(new Error('Google Login không hiển thị. Hãy dùng nút Google chính thức bên dưới hoặc kiểm tra OAuth Client ID.'))
      }
    })
  })
}

export default requestGoogleIdToken
