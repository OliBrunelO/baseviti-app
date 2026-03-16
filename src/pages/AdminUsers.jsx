import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

export default function AdminUsers() {
  const { isSuperAdmin } = useUser()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/')
      return
    }
    loadInvitations()
  }, [isSuperAdmin, navigate])

  const loadInvitations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        proprietes (nom_propriete)
      `)
      .order('invited_at', { ascending: false })
    
    if (data) setInvitations(data)
    if (error) console.error('Erreur:', error)
    setLoading(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert(`Copié : ${text}`)
  }

  const pendingInvitations = invitations.filter(inv => !inv.accepted_at)
  const acceptedInvitations = invitations.filter(inv => inv.accepted_at)

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">🔧 Gestion utilisateurs (Super Admin)</h1>
          <p className="page-subtitle">
            Toutes les demandes d'accès multi-propriétés
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Chargement...
          </div>
        ) : (
          <div className="cards-grid">
            {/* Invitations en attente */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h2 className="card-title">
                  ⏳ Invitations en attente ({pendingInvitations.length})
                </h2>
              </div>
              <div className="card-body">
                {pendingInvitations.length === 0 ? (
                  <p style={{ color: 'var(--gray-600)' }}>
                    Aucune invitation en attente
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Propriété</th>
                          <th>Date demande</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingInvitations.map(inv => (
                          <tr key={inv.id}>
                            <td>
                              <strong>{inv.email}</strong>
                            </td>
                            <td>{inv.proprietes?.nom_propriete || '-'}</td>
                            <td>
                              {new Date(inv.invited_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td>
                              <button
                                onClick={() => copyToClipboard(inv.email)}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem' }}
                              >
                                📋 Copier email
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {pendingInvitations.length > 0 && (
                  <div style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--primary)'
                  }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>
                      📝 Instructions pour créer le compte :
                    </h3>
                    <ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Copiez l'email en cliquant sur "📋 Copier email"</li>
                      <li>Allez sur <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Supabase Dashboard</a></li>
                      <li>Cliquez sur <strong>Authentication → Users → Add user</strong></li>
                      <li>Collez l'email et créez un mot de passe temporaire</li>
                      <li>Cochez <strong>"Auto Confirm User"</strong></li>
                      <li>L'utilisateur recevra un email pour réinitialiser son mot de passe</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Invitations acceptées */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h2 className="card-title">
                  ✅ Comptes créés ({acceptedInvitations.length})
                </h2>
              </div>
              <div className="card-body">
                {acceptedInvitations.length === 0 ? (
                  <p style={{ color: 'var(--gray-600)' }}>
                    Aucun compte créé
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Propriété</th>
                          <th>Date création</th>
                          <th>Date acceptation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acceptedInvitations.map(inv => (
                          <tr key={inv.id}>
                            <td>{inv.email}</td>
                            <td>{inv.proprietes?.nom_propriete || '-'}</td>
                            <td>
                              {new Date(inv.invited_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td>
                              {new Date(inv.accepted_at).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}