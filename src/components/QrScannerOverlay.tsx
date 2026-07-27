import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'

type Props = {
  onDecode: (pathname: string) => void
  onClose: () => void
}

type Status = 'starting' | 'scanning' | 'unrecognized' | 'error'

export default function QrScannerOverlay({ onDecode, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  const [status, setStatus] = useState<Status>('starting')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    const scanner = new QrScanner(
      video,
      (result) => {
        if (cancelled) return
        let pathname: string | null = null
        try {
          pathname = new URL(result.data).pathname
        } catch {
          pathname = null
        }
        if (pathname?.startsWith('/p/')) {
          scanner.stop()
          onDecodeRef.current(pathname)
        } else {
          setStatus('unrecognized')
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: () => {
          if (!cancelled) setStatus((s) => (s === 'unrecognized' ? 'scanning' : s))
        },
      },
    )

    const startPromise = scanner
      .start()
      .then(() => {
        if (!cancelled) setStatus('scanning')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMessage(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Debes permitir el acceso a la cámara para escanear.'
            : 'No se pudo acceder a la cámara de este dispositivo.',
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
      // Espera a que termine de adquirir la cámara antes de soltarla — pararla
      // a mitad de un getUserMedia en curso puede dejar la siguiente
      // instancia (el remount de StrictMode en dev) sin stream.
      startPromise.finally(() => {
        scanner.stop()
        scanner.destroy()
      })
    }
  }, [])

  return (
    <div className="qr-scanner-overlay">
      <button type="button" className="qr-scanner-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>

      <video ref={videoRef} className="qr-scanner-video" muted playsInline />

      {(status === 'starting' || status === 'unrecognized') && (
        <p className="qr-scanner-hint">
          {status === 'starting' ? 'Solicitando acceso a la cámara…' : 'Código QR no reconocido'}
        </p>
      )}

      {status === 'error' && (
        <div className="credential-message qr-scanner-error">
          <h1>No se pudo abrir la cámara</h1>
          <p>{errorMessage}</p>
          <button type="button" className="staff-entry-link" onClick={onClose}>
            Volver a la búsqueda
          </button>
        </div>
      )}
    </div>
  )
}
