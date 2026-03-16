import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'

export default function Layout({ children }) {
  const { user, userRole, proprieteData, isSuperAdmin, isAdmin } = useUser()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="logo-link" onClick={closeMenu}>
              <span className="logo">🍇</span>
              <h1 className="app-title">Vignoble App</h1>
            </Link>
          </div>
          
          {/* Menu hamburger (mobile) */}
          <button 
            className="menu-toggle" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Navigation */}
          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={closeMenu}>
              🏠 Accueil
            </Link>
            
            {(isAdmin || isSuperAdmin) && (
              <>
                <Link to="/admin" className="nav-link" onClick={closeMenu}>
                  👥 Utilisateurs
                </Link>
                <Link to="/admin/structure" className="nav-link" onClick={closeMenu}>
                  📁 Structure
                </Link>
                <Link to="/admin/dashboard" className="nav-link" onClick={closeMenu}>
                  📊 Dashboard
                </Link>
              </>
            )}

            {isSuperAdmin && (
              <Link to="/admin/users" className="nav-link" onClick={closeMenu}>
                🔧 Gestion Utilisateurs
              </Link>
            )}
            
            <button onClick={() => { handleLogout(); closeMenu(); }} className="btn btn-secondary">
              Déconnexion
            </button>
          </nav>
        </div>
        
        {proprieteData && (
          <div className="header-subtitle">
            {proprieteData.nom_propriete} - Campagne {proprieteData.campagne_active}
          </div>
        )}
        
        {isSuperAdmin && (
          <div className="header-subtitle" style={{ color: 'var(--warning)' }}>
            🔧 Mode Super Administrateur
          </div>
        )}
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}