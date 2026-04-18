'use client'

import { useEffect, useRef } from 'react'

interface JitsiEmbedProps {
  room: string
  displayName: string
  isHost?: boolean
  onLeave?: () => void
}

interface JitsiAPI {
  dispose: () => void
  executeCommand: (command: string, ...args: unknown[]) => void
  addEventListener: (event: string, listener: () => void) => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: object) => JitsiAPI
  }
}

export default function JitsiEmbed({ room, displayName, isHost = false, onLeave }: JitsiEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiAPI | null>(null)

  useEffect(() => {
    if (!room || !containerRef.current) return

    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return

      // Limpiar instancia previa si existe
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }

      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: room,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithVideoMuted: !isHost,
          startWithAudioMuted: !isHost,
          disableInitialGUM: !isHost,
          toolbarButtons: isHost
            ? ['microphone', 'camera', 'desktop', 'chat', 'hangup', 'tileview']
            : ['chat', 'hangup', 'raisehand'],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
        },
        userInfo: { displayName },
      })

      if (onLeave) {
        apiRef.current.addEventListener('readyToClose', onLeave)
      }
    }

    // Verificar si el script ya está cargado
    if (window.JitsiMeetExternalAPI) {
      initJitsi()
    } else {
      const existingScript = document.getElementById('jitsi-api-script')
      if (existingScript) {
        existingScript.addEventListener('load', initJitsi)
        return () => {
          existingScript.removeEventListener('load', initJitsi)
          apiRef.current?.dispose()
        }
      }

      const script = document.createElement('script')
      script.id = 'jitsi-api-script'
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = initJitsi
      document.head.appendChild(script)
    }

    return () => {
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [room, displayName, isHost, onLeave])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
