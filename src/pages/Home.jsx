import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    heures_semaine: 0,
    nb_travaux_semaine: 0,
    derniere_saisie: null
  })
  const [derniersTravaux, setDerniersTravaux] = useState([])

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        chargerDashboard(session.user.id)
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
    }
  }

  const chargerDashboard = async (userId) => {
    setLoading(true)
    try {
      // Calculer le début de la semaine (lundi)
      const aujourd_hui = new Date()
      const jour_semaine = aujourd_hui.getDay()
      const jours_depuis_lundi = jour_semaine === 0 ? 6 : jour_semaine - 1
      const debut_semaine = new Date(aujourd_hui)
      debut_semaine.setDate(aujourd_hui.getDate() - jours_depuis_lundi)
      debut_semaine.setHours(0, 0, 0, 0)

      // Récupérer les travaux de la semaine
      const { data: travauxSemaine, error: errorSemaine } = await supabase
        .from('travaux')
        .select('duree_heures, date_travail, created_at')
        .eq('user_id', userId)
        .gte('date_travail', debut_semaine.toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (errorSemaine) throw errorSemaine

      // Calculer les stats
      const heures = travauxSemaine?.reduce((sum, t) => sum + parseFloat(t.duree_heures || 0), 0) || 0
      const nbTravaux = travauxSemaine?.length || 0
      const derniereSaisie = travauxSemaine?.[0]?.created_at || null

      setStats({
        heures_semaine: heures,
        nb_travaux_semaine: nbTravaux,
        derniere_saisie: derniereSaisie
      })

      // Récupérer les 5 derniers travaux SANS jointures
      const { data: travaux, error: errorTravaux } = await supabase
        .from('travaux')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (errorTravaux) throw errorTravaux

      // Enrichir les travaux avec les détails
      if (travaux && travaux.length > 0) {
        const travauxEnrichis = await Promise.all(
          travaux.map(async (travail) => {
            // Charger la tâche
            const { data: tache } = await supabase
              .from('taches')
              .select('nom_tache')
              .eq('id_tache', travail.id_tache)
              .single()

            // Charger la sous-parcelle
            const { data: sousParcelle } = await supabase
              .from('sous_parcelles')
              .select('nom_ss_parcelles, id_parcelle')
              .eq('id_ss_parcelles', travail.id_ss_parcelles)
              .single()

            // Charger la parcelle
            let parcelle = null
            if (sousParcelle) {
              const { data: parcelleData } = await supabase
                .from('parcelles')
                .select('nom_parcelle, id_secteur')
                .eq('id_parcelle', sousParcelle.id_parcelle)
                .single()
              parcelle = parcelleData
            }

            // Charger le secteur
            let secteur = null
            if (parcelle) {
              const { data: secteurData } = await supabase
                .from('secteurs')
                .select('nom_secteur')
                .eq('id_secteur', parcelle.id_secteur)
                .single()
              secteur = secteurData
            }

            return {
              ...travail,
              tache_nom: tache?.nom_tache,
              sous_parcelle_nom: sousParcelle?.nom_ss_parcelles,
              parcelle_nom: parcelle?.nom_parcelle,
              secteur_nom: secteur?.nom_secteur
            }
          })
        )

        setDerniersTravaux(travauxEnrichis)
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
      alert('Erreur lors du chargement du dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTempsEcoule = (dateString) => {
    const maintenant = new Date()
    const date = new Date(dateString)
    const diff = maintenant - date
    
    const minutes = Math.floor(diff / 60000)
    const heures = Math.floor(diff / 3600000)
    const jours = Math.floor(diff / 86400000)

    if (minutes < 60) return `il y a ${minutes} min`
    if (heures < 24) return `il y a ${heures}h`
    if (jours === 1) return 'hier'
    if (jours < 7) return `il y a ${jours} jours`
    return formatDateTime(dateString)
  }

  if (loading) {
    return (
      <Layout>
        <div className="container page-container">
          <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container page-container">
        {/* Message d'accueil */}
        <div className="page-header">
          <h1 className="page-title">
            Bonjour {user?.user_metadata?.nom_complet || user?.email?.split('@')[0]} ! 👋
          </h1>
          <p className="page-subtitle">
            Bienvenue sur votre espace de travail
          </p>
        </div>

        <div className="cards-grid">
          {/* Bouton principal de saisie */}
          <div 
            className="card card-primary" 
            style={{ 
              gridColumn: '1 / -1',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onClick={() => navigate('/saisie')}
          >
            <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📝</div>
              <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.5rem' }}>
                Saisir mon travail
              </h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: 0 }}>
                Enregistrer une nouvelle activité
              </p>
            </div>
          </div>

          {/* Stats de la semaine */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📊 Ma semaine</h2>
            </div>
            <div className="card-body">
              <div className="profile-info">
                <div className="profile-item">
                  <span className="profile-label">Heures travaillées</span>
                  <span className="profile-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                    {stats.heures_semaine.toFixed(1)} h
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Travaux saisis</span>
                  <span className="profile-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                    {stats.nb_travaux_semaine}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Dernière saisie</span>
                  <span className="profile-value">
                    {stats.derniere_saisie 
                      ? getTempsEcoule(stats.derniere_saisie)
                      : 'Aucune saisie'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accès rapides */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🚀 Accès rapides</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <button 
                  onClick={() => navigate('/saisie')}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  ➕ Nouvelle saisie
                </button>
                <button 
                  onClick={() => navigate('/mes-travaux')}
                  className="btn"
                  style={{ width: '100%' }}
                >
                  📋 Mes travaux
                </button>
              </div>
            </div>
          </div>

          {/* Derniers travaux */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">🕐 Mes 5 derniers travaux</h2>
            </div>
            <div className="card-body">
              {derniersTravaux.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--gray-600)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🍇</p>
                  <p>Aucun travail saisi pour le moment</p>
                  <button 
                    onClick={() => navigate('/saisie')}
                    className="btn btn-primary"
                    style={{ marginTop: 'var(--space-lg)' }}
                  >
                    ➕ Saisir mon premier travail
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {derniersTravaux.map((travail) => (
                    <div 
                      key={travail.id_travail}
                      style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-200)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: 'var(--space-sm)',
                        flexWrap: 'wrap',
                        gap: 'var(--space-sm)'
                      }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--gray-600)',
                            marginBottom: '2px'
                          }}>
                            {formatDate(travail.date_travail)}
                          </div>
                          <div style={{ 
                            fontWeight: '600', 
                            color: 'var(--primary)',
                            fontSize: '1rem'
                          }}>
                            {travail.tache_nom || 'Tâche inconnue'}
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--gray-700)',
                            marginTop: '4px'
                          }}>
                            {travail.secteur_nom} › {travail.parcelle_nom} › {travail.sous_parcelle_nom}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: 'var(--space-md)',
                          alignItems: 'center'
                        }}>
                          <span className="badge badge-user">
                            {travail.duree_heures}h
                          </span>
                          <span className="badge badge-admin">
                            {travail.avancement_pourcent}%
                          </span>
                        </div>
                      </div>
                      {travail.notes && (
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--gray-600)',
                          fontStyle: 'italic',
                          marginTop: 'var(--space-sm)',
                          paddingTop: 'var(--space-sm)',
                          borderTop: '1px solid var(--gray-200)'
                        }}>
                          💬 {travail.notes}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--gray-500)',
                        marginTop: 'var(--space-sm)'
                      }}>
                        Saisi {getTempsEcoule(travail.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lien vers historique complet */}
          {derniersTravaux.length > 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <button 
                onClick={() => navigate('/mes-travaux')}
                className="btn"
              >
                📋 Voir tous mes travaux
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}