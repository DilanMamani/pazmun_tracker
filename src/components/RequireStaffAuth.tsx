import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function RequireStaffAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return null
  if (!session) {
    return <Navigate to="/staff/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}
