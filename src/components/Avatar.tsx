import { useState } from 'react'

type Props = {
  src: string | null
  name: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Avatar({ src, name }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="avatar avatar-fallback" aria-hidden="true">
        {initials(name)}
      </div>
    )
  }

  return <img className="avatar" src={src} alt="" onError={() => setFailed(true)} />
}
