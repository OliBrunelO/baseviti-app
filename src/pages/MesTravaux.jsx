import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function MesTravaux() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [travaux, setTravaux] = useState([])
  const [travauxFiltres, setTravauxFiltres] = useState([])
  
  // Données de référence pour filtres
  const [taches, setTaches] = useState([])
  const [secteurs, setSecteurs] = useState([])
  
  // Filtres
  const [filtres, setFiltres] = useState({
    dateDebut: '',
    dateFin: '',
    id_tache: '',
    id_secteur: ''
  })

  // Stats
  const [stats, setStats] = useState({
    total_heures: 0,
    total_travaux: 0,
    tache_plus_frequente: null
  })

  // Modal de modification
  const [editModal, setEditModal] = useState(null)
  const [editData, setEditData] = useState({
    duree_heures: '',
    avancement_pourcent: '',
    notes: ''
  })

  useEffect(() => {
    getUser()
    loadTaches()
    loadSecteurs()
  }, [])

  useEffect(() => {
    if (user) {
      loadTravaux()
    }
  }, [user])

  useEffect(() => {
    appliquerFiltres()
  }, [travaux, filtres])

  const getUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
    }
  }

  const loadTaches = async () => {
    const { data } = await supabase
      .from('taches')
      .select('id_tache, nom_tache')
      .eq('actif', true)
      .order('nom_tache')
    
    if (data) setTaches(data)
  }

  const loadSecteurs = async () => {
    const { data } = await supabase
      .from('secteurs')
      .select('id_secteur, nom_secteur')
      .eq('actif', true)
      .order('nom_secteur')
    
    if (data) setSecteurs(data)
  }

  const loadTravaux = async () => {
    setLoading(true)
    try {
      // Récupérer tous les travaux
      const { data: travauxData, error } = await supabase
        .from('travaux')
        .select('*')
        .eq('user_id', user.id)
        .order('date_travail', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Enrichir avec les détails
      if (travauxData && travauxData.length > 0) {
        const travauxEnrichis = await Promise.all(
          travauxData.map(async (travail) => {
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
                .select('nom_secteur, id_secteur')
                .eq('id_secteur', parcelle.id_secteur)
                .single()
              secteur = secteurData
            }

            return {
              ...travail,
              tache_nom: tache?.nom_tache,
              sous_parcelle_nom: sousParcelle?.nom_ss_parcelles,
              parcelle_nom: parcelle?.nom_parcelle,
              secteur_nom: secteur?.nom_secteur,
              id_secteur: secteur?.id_secteur
            }
          })
        )

        setTravaux(travauxEnrichis)
        calculerStats(travauxEnrichis)
      } else {
        setTravaux([])
      }
    } catch (error) {
      console.error('Erreur chargement travaux:', error)
      alert('Erreur lors du chargement des travaux')
    } finally {
      setLoading(false)
    }
  }

  const calculerStats = (listeTravaux) => {
    const totalHeures = listeTravaux.reduce((sum, t) => sum + parseFloat(t.duree_heures || 0), 0)
    const totalTravaux = listeTravaux.length

    // Tâche la plus fréquente
    const tachesCount = {}
    listeTravaux.forEach(t => {
      const nom = t.tache_nom || 'Inconnue'
      tachesCount[nom] = (tachesCount[nom] || 0) + 1
    })
    const tachePlusFrequente = Object.entries(tachesCount).sort((a, b) => b[1] - a[1])[0]

    setStats({
      total_heures: totalHeures,
      total_travaux: totalTravaux,
      tache_plus_frequente: tachePlusFrequente ? tachePlusFrequente[0] : null
    })
  }

  const appliquerFiltres = () => {
    let resultats = [...travaux]

    // Filtre par date début
    if (filtres.dateDebut) {
      resultats = resultats.filter(t => t.date_travail >= filtres.dateDebut)
    }

    // Filtre par date fin
    if (filtres.dateFin) {
      resultats = resultats.filter(t => t.date_travail <= filtres.dateFin)
    }

    // Filtre par tâche
    if (filtres.id_tache) {
      resultats = resultats.filter(t => t.id_tache === filtres.id_tache)
    }

    // Filtre par secteur
    if (filtres.id_secteur) {
      resultats = resultats.filter(t => t.id_secteur === filtres.id_secteur)
    }

    setTravauxFiltres(resultats)
  }

  const resetFiltres = () => {
    setFiltres({
      dateDebut: '',
      dateFin: '',
      id_tache: '',
      id_secteur: ''
    })
  }

  const peutModifier = (dateTravail) => {
    const date = new Date(dateTravail)
    const maintenant = new Date()
    const diffJours = Math.floor((maintenant - date) / (1000 * 60 * 60 * 24))
    return diffJours <= 3
  }

  const ouvrirModalEdit = (travail) => {
    setEditModal(travail)
    setEditData({
      duree_heures: travail.duree_heures,
      avancement_pourcent: travail.avancement_pourcent,
      notes: travail.notes || ''
    })
  }

  const fermerModalEdit = () => {
    setEditModal(null)
    setEditData({
      duree_heures: '',
      avancement_pourcent: '',
      notes: ''
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('travaux')
        .update({
          duree_heures: parseFloat(editData.duree_heures),
          avancement_pourcent: parseFloat(editData.avancement_pourcent),
          notes: editData.notes || null
        })
        .eq('id_travail', editModal.id_travail)

      if (error) {
        if (error.message.includes('100')) {
          throw new Error('L\'avancement total dépasserait 100%')
        }
        throw error
      }

      alert('✅ Travail modifié avec succès !')
      fermerModalEdit()
      loadTravaux()
    } catch (error) {
      alert('❌ Erreur : ' + error.message)
    }
  }

  const handleDelete = async (travail) => {
    if (!confirm(`Voulez-vous vraiment supprimer ce travail ?\n\n${travail.tache_nom} - ${travail.date_travail}`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('travaux')
        .delete()
        .eq('id_travail', travail.id_travail)

      if (error) throw error

      alert('✅ Travail supprimé avec succès !')
      loadTravaux()
    } catch (error) {
      alert('❌ Erreur : ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
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
        <div className="page-header">
          <h1 className="page-title">📋 Mes travaux</h1>
          <p className="page-subtitle">
            Historique complet de vos saisies
          </p>
        </div>

        <div className="cards-grid">
          {/* Statistiques */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">📊 Mes statistiques</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {stats.total_heures.toFixed(1)}h
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Heures totales
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {stats.total_travaux}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Travaux saisis
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {stats.tache_plus_frequente || '-'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Tâche la plus fréquente
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">🔍 Filtres</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group">
                  <label>Date début</label>
                  <input
                    type="date"
                    value={filtres.dateDebut}
                    onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date fin</label>
                  <input
                    type="date"
                    value={filtres.dateFin}
                    onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tâche</label>
                  <select
                    value={filtres.id_tache}
                    onChange={(e) => setFiltres({ ...filtres, id_tache: e.target.value })}
                  >
                    <option value="">Toutes les tâches</option>
                    {taches.map(t => (
                      <option key={t.id_tache} value={t.id_tache}>
                        {t.nom_tache}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Secteur</label>
                  <select
                    value={filtres.id_secteur}
                    onChange={(e) => setFiltres({ ...filtres, id_secteur: e.target.value })}
                  >
                    <option value="">Tous les secteurs</option>
                    {secteurs.map(s => (
                      <option key={s.id_secteur} value={s.id_secteur}>
                        {s.nom_secteur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(filtres.dateDebut || filtres.dateFin || filtres.id_tache || filtres.id_secteur) && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <button onClick={resetFiltres} className="btn btn-secondary">
                    🔄 Réinitialiser les filtres
                  </button>
                  <span style={{ marginLeft: 'var(--space-md)', color: 'var(--gray-600)' }}>
                    {travauxFiltres.length} résultat(s)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Liste des travaux */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">📝 Historique ({travauxFiltres.length})</h2>
            </div>
            <div className="card-body">
              {travauxFiltres.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--gray-600)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🍇</p>
                  <p>Aucun travail trouvé avec ces filtres</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {travauxFiltres.map((travail) => {
                    const modifiable = peutModifier(travail.date_travail)
                    return (
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
                          gap: 'var(--space-md)',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: '1', minWidth: '250px' }}>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--gray-600)',
                              marginBottom: '4px'
                            }}>
                              {formatDate(travail.date_travail)}
                            </div>
                            <div style={{ 
                              fontWeight: '600', 
                              color: 'var(--primary)',
                              fontSize: '1.125rem',
                              marginBottom: '4px'
                            }}>
                              {travail.tache_nom}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--gray-700)'
                            }}>
                              {travail.secteur_nom} › {travail.parcelle_nom} › {travail.sous_parcelle_nom}
                            </div>
                            {travail.notes && (
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: 'var(--gray-600)',
                                fontStyle: 'italic',
                                marginTop: 'var(--space-sm)'
                              }}>
                                💬 {travail.notes}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: 'var(--space-md)',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            <span className="badge badge-user">
                              {travail.duree_heures}h
                            </span>
                            <span className="badge badge-admin">
                              {travail.avancement_pourcent}%
                            </span>
                            {modifiable && (
                              <>
                                <button
                                  onClick={() => ouvrirModalEdit(travail)}
                                  className="btn btn-secondary"
                                  style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={() => handleDelete(travail)}
                                  className="btn"
                                  style={{ 
                                    padding: 'var(--space-sm) var(--space-md)',
                                    backgroundColor: 'var(--error)',
                                    color: 'white'
                                  }}
                                >
                                  🗑️ Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bouton retour */}
          <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <button onClick={() => navigate('/')} className="btn">
              🏠 Retour à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Modal de modification */}
      {editModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-lg)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-2xl)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>✏️ Modifier le travail</h2>
            <form onSubmit={handleUpdate} className="form">
              <div style={{ 
                padding: 'var(--space-md)', 
                backgroundColor: 'var(--gray-50)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-lg)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {editModal.tache_nom}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {formatDate(editModal.date_travail)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {editModal.secteur_nom} › {editModal.parcelle_nom} › {editModal.sous_parcelle_nom}
                </div>
              </div>

              <div className="form-group">
                <label>Heures travaillées *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={editData.duree_heures}
                  onChange={(e) => setEditData({ ...editData, duree_heures: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Avancement (%) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={editData.avancement_pourcent}
                  onChange={(e) => setEditData({ ...editData, avancement_pourcent: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="3"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  placeholder="Observations, commentaires..."
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  💾 Enregistrer
                </button>
                <button 
                  type="button" 
                  onClick={fermerModalEdit} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}