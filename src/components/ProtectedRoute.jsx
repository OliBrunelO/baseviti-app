import { Navigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

export default function ProtectedRoute({ children, requireAdmin = false, requireSuperAdmin = false }) {
  const { user, userRole, loading } = useUser()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requireSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/" />
  }

  if (requireAdmin && userRole !== 'admin' && userRole !== 'super_admin') {
    return <Navigate to="/" />
  }

  return children
}