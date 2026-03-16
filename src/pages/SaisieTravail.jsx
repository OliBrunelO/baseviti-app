import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

export default function SaisieTravail() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Données de référence
  const [secteurs, setSecteurs] = useState([])
  const [parcelles, setParcelles] = useState([])
  const [sousParcelles, setSousParcelles] = useState([])
  const [taches, setTaches] = useState([])
  
  // Formulaire
  const [formData, setFormData] = useState({
    id_secteur: '',
    id_parcelle: '',
    id_ss_parcelles: '',
    id_tache: '',
    date_travail: new Date().toISOString().split('T')[0],
    duree_heures: '',
    avancement_pourcent: '',
    notes: ''
  })

  // Charger les données initiales
  useEffect(() => {
    loadSecteurs()
    loadTaches()
  }, [])

  // Charger parcelles quand secteur change
  useEffect(() => {
    if (formData.id_secteur) {
      loadParcelles(formData.id_secteur)
    } else {
      setParcelles([])
      setSousParcelles([])
    }
  }, [formData.id_secteur])

  // Charger sous-parcelles quand parcelle change
  useEffect(() => {
    if (formData.id_parcelle) {
      loadSousParcelles(formData.id_parcelle)
    } else {
      setSousParcelles([])
    }
  }, [formData.id_parcelle])

  const loadSecteurs = async () => {
    const { data } = await supabase
      .from('secteurs')
      .select('*')
      .eq('actif', true)
      .order('nom_secteur')
    
    if (data) setSecteurs(data)
  }

  const loadParcelles = async (idSecteur) => {
    const { data } = await supabase
      .from('parcelles')
      .select('*')
      .eq('id_secteur', idSecteur)
      .order('nom_parcelle')
    
    if (data) setParcelles(data)
  }

  const loadSousParcelles = async (idParcelle) => {
    const { data } = await supabase
      .from('sous_parcelles')
      .select('*')
      .eq('id_parcelle', idParcelle)
      .order('nom_ss_parcelles')
    
    if (data) setSousParcelles(data)
  }

  const loadTaches = async () => {
    const { data } = await supabase
      .from('taches')
      .select('*')
      .eq('actif', true)
      .order('ordre_affichage')
    
    if (data) setTaches(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validation
      if (!formData.id_ss_parcelles) {
        throw new Error('Veuillez sélectionner une sous-parcelle')
      }
      if (!formData.id_tache) {
        throw new Error('Veuillez sélectionner une tâche')
      }
      if (!formData.duree_heures || formData.duree_heures <= 0) {
        throw new Error('La durée doit être supérieure à 0')
      }
      if (!formData.avancement_pourcent || formData.avancement_pourcent <= 0 || formData.avancement_pourcent > 100) {
        throw new Error('L\'avancement doit être entre 1 et 100%')
      }

      // Récupérer la session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('Non authentifié')

      // Insérer le travail
      const { error } = await supabase
        .from('travaux')
        .insert([{
          user_id: session.user.id,
          id_ss_parcelles: formData.id_ss_parcelles,
          id_tache: formData.id_tache,
          date_travail: formData.date_travail,
          duree_heures: parseFloat(formData.duree_heures),
          avancement_pourcent: parseFloat(formData.avancement_pourcent),
          notes: formData.notes || null
        }])

      if (error) {
        console.error('Erreur Supabase:', error)
        // Vérifier si c'est une erreur d'avancement max
        if (error.message.includes('100')) {
          throw new Error('L\'avancement total pour cette tâche sur cette sous-parcelle dépasserait 100%')
        }
        throw error
      }

      setMessage({ 
        type: 'success', 
        text: '✅ Travail enregistré avec succès !',
        showActions: true 
      })
      
      // Réinitialiser TOUS les champs
      setFormData({
        id_secteur: '',
        id_parcelle: '',
        id_ss_parcelles: '',
        id_tache: '',
        date_travail: new Date().toISOString().split('T')[0],
        duree_heures: '',
        avancement_pourcent: '',
        notes: ''
      })

    } catch (error) {
      console.error('Erreur complète:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">✍️ Saisir mon travail</h1>
          <p className="page-subtitle">
            Enregistrez votre travail du jour
          </p>
        </div>

        <div className="cards-grid">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="form">
                {/* Sélection hiérarchique */}
                <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="form-group">
                    <label>Secteur *</label>
                    <select
                      value={formData.id_secteur}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        id_secteur: e.target.value,
                        id_parcelle: '',
                        id_ss_parcelles: ''
                      })}
                      required
                    >
                      <option value="">Sélectionner un secteur...</option>
                      {secteurs.map(s => (
                        <option key={s.id_secteur} value={s.id_secteur}>
                          {s.nom_secteur}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Parcelle *</label>
                    <select
                      value={formData.id_parcelle}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        id_parcelle: e.target.value,
                        id_ss_parcelles: ''
                      })}
                      required
                      disabled={!formData.id_secteur}
                    >
                      <option value="">Sélectionner une parcelle...</option>
                      {parcelles.map(p => (
                        <option key={p.id_parcelle} value={p.id_parcelle}>
                          {p.nom_parcelle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sous-parcelle *</label>
                    <select
                      value={formData.id_ss_parcelles}
                      onChange={(e) => setFormData({ ...formData, id_ss_parcelles: e.target.value })}
                      required
                      disabled={!formData.id_parcelle}
                    >
                      <option value="">Sélectionner une sous-parcelle...</option>
                      {sousParcelles.map(sp => (
                        <option key={sp.id_ss_parcelles} value={sp.id_ss_parcelles}>
                          {sp.nom_ss_parcelles} {sp.cepage ? `(${sp.cepage})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tâche et date */}
                <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label>Tâche *</label>
                    <select
                      value={formData.id_tache}
                      onChange={(e) => setFormData({ ...formData, id_tache: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner une tâche...</option>
                      {taches.map(t => (
                        <option key={t.id_tache} value={t.id_tache}>
                          {t.nom_tache}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date_travail}
                      onChange={(e) => setFormData({ ...formData, date_travail: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Heures travaillées *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={formData.duree_heures}
                      onChange={(e) => setFormData({ ...formData, duree_heures: e.target.value })}
                      placeholder="Ex: 3.5"
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
                      value={formData.avancement_pourcent}
                      onChange={(e) => setFormData({ ...formData, avancement_pourcent: e.target.value })}
                      placeholder="Ex: 25"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                  <label>Notes (optionnel)</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observations, commentaires..."
                  />
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/')}
                  >
                    Annuler
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`
                  }}>
                    <div>{message.text}</div>
                    
                    {message.showActions && (
                      <div style={{ 
                        display: 'flex', 
                        gap: 'var(--space-md)', 
                        marginTop: 'var(--space-md)' 
                      }}>
                        
                        <button 
                          onClick={() => navigate('/')}
                          className="btn btn-secondary"
                        >
                          🏠 Retour à l'accueil
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}