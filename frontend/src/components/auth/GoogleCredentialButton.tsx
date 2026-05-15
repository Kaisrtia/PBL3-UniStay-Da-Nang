import { useEffect, useRef, useState } from 'react'

import { getGoogleIdentity, type GoogleCredentialResponse } from '@/services/googleAuthService'

type GoogleCredentialButtonProps = {
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  disabled?: boolean
  onCredential: (idToken: string) => void
  onError?: (message: string) => void
}

const GoogleCredentialButton = ({
  text = 'signin_with',
  disabled = false,
  onCredential,
  onError
}: GoogleCredentialButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const renderButton = async () => {
      try {
        const { clientId, googleIdentity } = await getGoogleIdentity()

        if (cancelled || !containerRef.current) {
          return
        }

        googleIdentity.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
              onCredential(response.credential)
              return
            }

            onError?.('Google không trả về mã đăng nhập hợp lệ.')
          }
        })

        containerRef.current.innerHTML = ''
        googleIdentity.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          width: containerRef.current.offsetWidth || 320,
          locale: 'vi'
        })
        setIsReady(true)
      } catch (error) {
        if (!cancelled) {
          onError?.(error instanceof Error ? error.message : 'Không thể khởi tạo Google Login.')
        }
      }
    }

    void renderButton()

    return () => {
      cancelled = true
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [onCredential, onError, text])

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={containerRef} className='min-h-11 w-full overflow-hidden rounded-lg' />
      {!isReady ? (
        <div className='mt-2 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-500'>
          Đang tải Google Login...
        </div>
      ) : null}
    </div>
  )
}

export default GoogleCredentialButton
