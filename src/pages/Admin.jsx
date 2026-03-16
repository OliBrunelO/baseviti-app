import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import Layout from '../components/Layout'

export default function Admin() {
  const { userPropriete, isSuperAdmin } = useUser()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('salarie')
  const [selectedPropriete, setSelectedPropriete] = useState(userPropriete)
  const [proprietes, setProprietes] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadInvitations()
    if (isSuperAdmin) {
      loadProprietes()
    }
  }, [])

  const loadProprietes = async () => {
    const { data } = await supabase
      .from('proprietes')
      .select('*')
      .eq('actif', true)
      .order('nom_propriete')
    
    if (data) setProprietes(data)
  }

  const loadInvitations = async () => {
    let query = supabase
      .from('invitations')
      .select('*, proprietes(nom_propriete)')
      .order('invited_at', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('id_propriete', userPropriete)
    }
    
    const { data } = await query
    if (data) setInvitations(data)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Déterminer la propriété à utiliser
      const proprieteId = isSuperAdmin ? selectedPropriete : userPropriete

      if (!proprieteId) {
        throw new Error('Propriété non sélectionnée')
      }

      // Récupérer l'ID de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Créer juste l'invitation en base (pas d'email)
      const { error } = await supabase
        .from('invitations')
        .insert([{
          email: email,
          invited_by: user.id,
          id_propriete: proprieteId
        }])

      if (error) throw error

      setMessage('✅ Demande d\'accès enregistrée ! Le super-admin sera notifié.')
      setEmail('')
      loadInvitations()
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('❌ Erreur : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Gestion des utilisateurs</p>
        </div>

        <div className="cards-grid">
          {/* Formulaire d'invitation */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Demander un accès</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleInvite} className="form">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="utilisateur@exemple.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rôle *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="salarie">Salarié</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="form-group">
                    <label>Propriété *</label>
                    <select
                      value={selectedPropriete || ''}
                      onChange={(e) => setSelectedPropriete(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner une propriété...</option>
                      {proprietes.map(p => (
                        <option key={p.id_propriete} value={p.id_propriete}>
                          {p.nom_propriete}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {message && (
                  <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Demander l\'accès'}
                </button>
              </form>
            </div>
          </div>

          {/* Liste des invitations */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">Demandes en attente</h2>
            </div>
            <div className="card-body">
              {invitations.length === 0 ? (
                <p style={{ color: 'var(--gray-600)' }}>Aucune demande en attente</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        {isSuperAdmin && <th>Propriété</th>}
                        <th>Date de demande</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map(inv => (
                        <tr key={inv.id}>
                          <td>{inv.email}</td>
                          {isSuperAdmin && (
                            <td>{inv.proprietes?.nom_propriete || '-'}</td>
                          )}
                          <td>{new Date(inv.invited_at).toLocaleDateString('fr-FR')}</td>
                          <td>
                            {inv.accepted_at ? (
                              <span className="badge badge-success">Compte créé</span>
                            ) : (
                              <span className="badge badge-warning">En attente</span>
                            )}
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
      </div>
    </Layout>
  )
}