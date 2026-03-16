import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import Layout from '../components/Layout'

export default function AdminDashboard() {
  const { proprieteData } = useUser()
  const [stats, setStats] = useState({
    semaine: { heures: 0, travaux: 0, salaries: 0 },
    mois: { heures: 0, travaux: 0, salaries: 0 }
  })
  const [topTaches, setTopTaches] = useState([])
  const [topSalaries, setTopSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [dateDebut, setDateDebut] = useState(getMonday(new Date()))
  const [dateFin, setDateFin] = useState(getSunday(new Date()))

  // Fonctions utilitaires pour dates
  function getMonday(d) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  function getSunday(d) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + 7
    const sunday = new Date(date.setDate(diff))
    return sunday.toISOString().split('T')[0]
  }

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Stats semaine - utiliser la vue travaux_avec_emails
      const { data: semaineData } = await supabase
        .from('travaux_avec_emails')
        .select('duree_heures, user_id, user_email')
        .gte('date_travail', weekAgo)
        .lte('date_travail', today)

      // Stats mois
      const { data: moisData } = await supabase
        .from('travaux_avec_emails')
        .select('duree_heures, user_id, user_email')
        .gte('date_travail', monthAgo)
        .lte('date_travail', today)

      // Top tâches semaine
      const { data: tachesData } = await supabase
        .from('travaux')
        .select('id_tache, duree_heures, taches(nom_tache)')
        .gte('date_travail', weekAgo)
        .lte('date_travail', today)

      // Top salariés semaine - avec emails
      const { data: salariesData } = await supabase
        .from('travaux_avec_emails')
        .select('user_id, user_email, duree_heures')
        .gte('date_travail', weekAgo)
        .lte('date_travail', today)

      // Calculer les stats
      setStats({
        semaine: {
          heures: semaineData?.reduce((sum, t) => sum + parseFloat(t.duree_heures || 0), 0) || 0,
          travaux: semaineData?.length || 0,
          salaries: new Set(semaineData?.map(t => t.user_id)).size || 0
        },
        mois: {
          heures: moisData?.reduce((sum, t) => sum + parseFloat(t.duree_heures || 0), 0) || 0,
          travaux: moisData?.length || 0,
          salaries: new Set(moisData?.map(t => t.user_id)).size || 0
        }
      })

      // Agréger top tâches
      const tachesMap = {}
      tachesData?.forEach(t => {
        const nom = t.taches?.nom_tache || 'Inconnu'
        tachesMap[nom] = (tachesMap[nom] || 0) + parseFloat(t.duree_heures || 0)
      })
      const topTachesArray = Object.entries(tachesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nom, heures]) => ({ nom, heures }))
      setTopTaches(topTachesArray)

      // Agréger top salariés - avec emails directement
      const salariesMap = {}
      const salariesEmailMap = {}
      salariesData?.forEach(t => {
        salariesMap[t.user_id] = (salariesMap[t.user_id] || 0) + parseFloat(t.duree_heures || 0)
        salariesEmailMap[t.user_id] = t.user_email || 'Inconnu'
      })

      const topSalariesArray = Object.entries(salariesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, heures]) => ({ 
          email: salariesEmailMap[userId], 
          heures 
        }))
      setTopSalaries(topSalariesArray)

    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    setExportLoading(true)
    try {
      // Récupérer les travaux avec emails
      const { data: travaux, error } = await supabase
        .from('travaux_avec_emails')
        .select(`
          *,
          taches(nom_tache),
          sous_parcelles(
            nom_ss_parcelles,
            parcelles(
              nom_parcelle,
              secteurs(nom_secteur)
            )
          )
        `)
        .gte('date_travail', dateDebut)
        .lte('date_travail', dateFin)
        .order('date_travail', { ascending: false })

      if (error) throw error

      // Créer le CSV
      const headers = 'Date,Salarié,Secteur,Parcelle,Sous-parcelle,Tâche,Heures,Avancement %,Notes\n'
      const rows = travaux.map(t => {
        const secteur = t.sous_parcelles?.parcelles?.secteurs?.nom_secteur || ''
        const parcelle = t.sous_parcelles?.parcelles?.nom_parcelle || ''
        const sousParcelle = t.sous_parcelles?.nom_ss_parcelles || ''
        const tache = t.taches?.nom_tache || ''
        const email = t.user_email || 'Inconnu'
        const notes = (t.notes || '').replace(/"/g, '""') // Échapper les guillemets

        return `${t.date_travail},${email},${secteur},${parcelle},${sousParcelle},${tache},${t.duree_heures},${t.avancement_pourcent},"${notes}"`
      }).join('\n')

      const csv = headers + rows

      // Télécharger
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `travaux_${dateDebut}_${dateFin}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      alert('Erreur export : ' + error.message)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container page-container">
          <p>Chargement des statistiques...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">📊 Dashboard Admin</h1>
          <p className="page-subtitle">
            Vue d'ensemble des travaux - {proprieteData?.nom_propriete}
          </p>
        </div>

        <div className="cards-grid">
          {/* Stats semaine */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📅 Cette semaine</h2>
            </div>
            <div className="card-body">
              <div className="profile-info">
                <div className="profile-item">
                  <span className="profile-label">Heures travaillées</span>
                  <span className="profile-value" style={{ fontSize: '2rem', color: 'var(--primary)' }}>
                    {stats.semaine.heures.toFixed(1)}h
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Travaux saisis</span>
                  <span className="profile-value">{stats.semaine.travaux}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Salariés actifs</span>
                  <span className="profile-value">{stats.semaine.salaries}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats mois */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📆 Ce mois (30 jours)</h2>
            </div>
            <div className="card-body">
              <div className="profile-info">
                <div className="profile-item">
                  <span className="profile-label">Heures travaillées</span>
                  <span className="profile-value" style={{ fontSize: '2rem', color: 'var(--accent)' }}>
                    {stats.mois.heures.toFixed(1)}h
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Travaux saisis</span>
                  <span className="profile-value">{stats.mois.travaux}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Salariés actifs</span>
                  <span className="profile-value">{stats.mois.salaries}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top tâches */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🏆 Top tâches (semaine)</h2>
            </div>
            <div className="card-body">
              {topTaches.length === 0 ? (
                <p style={{ color: 'var(--gray-600)' }}>Aucune donnée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {topTaches.map((tache, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--gray-100)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <span>{tache.nom}</span>
                      <strong>{tache.heures.toFixed(1)}h</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top salariés */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">👷 Top salariés (semaine)</h2>
            </div>
            <div className="card-body">
              {topSalaries.length === 0 ? (
                <p style={{ color: 'var(--gray-600)' }}>Aucune donnée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {topSalaries.map((salarie, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--gray-100)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <span>{salarie.email}</span>
                      <strong>{salarie.heures.toFixed(1)}h</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export CSV */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">📥 Export CSV</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group">
                  <label>Date début</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date fin</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={exportCSV} 
                className="btn btn-primary"
                disabled={exportLoading}
                style={{ marginTop: 'var(--space-md)' }}
              >
                {exportLoading ? '⏳ Export en cours...' : '📥 Télécharger CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}