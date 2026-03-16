// ============================================
// EXEMPLE : Page de saisie de données vignoble
// ============================================
// Ce fichier montre comment créer une nouvelle page personnalisée
// Copiez ce fichier dans src/pages/ et adaptez-le à vos besoins

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function VineyardData() {
  const [parcelles, setParcelles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nom_parcelle: '',
    surface: '',
    cepage: '',
    date_observation: new Date().toISOString().split('T')[0],
    etat_sante: '',
    notes: ''
  })

  // Charger les données au montage
  useEffect(() => {
    loadParcelles()
  }, [])

  const loadParcelles = async () => {
    // EXEMPLE - Adaptez selon votre table
    // const { data, error } = await supabase
    //   .from('parcelles')
    //   .select('*')
    //   .order('date_observation', { ascending: false })
    
    // if (!error) setParcelles(data)
    
    // Pour le moment, données fictives :
    setParcelles([
      { id: 1, nom_parcelle: 'Parcelle Nord', surface: 2.5, cepage: 'Chardonnay', date_observation: '2025-01-20', etat_sante: 'Bon' },
      { id: 2, nom_parcelle: 'Parcelle Sud', surface: 1.8, cepage: 'Pinot Noir', date_observation: '2025-01-19', etat_sante: 'Excellent' }
    ])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // EXEMPLE - Adaptez selon votre table
      // const { error } = await supabase
      //   .from('parcelles')
      //   .insert([formData])
      
      // if (error) throw error

      alert('Données enregistrées ! (simulation)')
      setShowForm(false)
      setFormData({
        nom_parcelle: '',
        surface: '',
        cepage: '',
        date_observation: new Date().toISOString().split('T')[0],
        etat_sante: '',
        notes: ''
      })
      loadParcelles()
    } catch (error) {
      alert('Erreur : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">📊 Suivi des Parcelles</h1>
          <p className="page-subtitle">
            Enregistrez vos observations de terrain
          </p>
        </div>

        <div className="cards-grid">
          {/* Bouton d'ajout */}
          <div className="card card-primary" style={{ gridColumn: '1 / -1' }}>
            <div className="card-body">
              <button 
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary"
              >
                {showForm ? '❌ Annuler' : '➕ Nouvelle observation'}
              </button>
            </div>
          </div>

          {/* Formulaire */}
          {showForm && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h2 className="card-title">📝 Nouvelle observation</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="form">
                  <div style={{ display: 'grid', gap: 'var(--space-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div className="form-group">
                      <label>Nom de la parcelle *</label>
                      <input
                        type="text"
                        value={formData.nom_parcelle}
                        onChange={(e) => setFormData({...formData, nom_parcelle: e.target.value})}
                        placeholder="Ex: Parcelle Nord"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Surface (hectares) *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.surface}
                        onChange={(e) => setFormData({...formData, surface: e.target.value})}
                        placeholder="2.5"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Cépage *</label>
                      <select
                        value={formData.cepage}
                        onChange={(e) => setFormData({...formData, cepage: e.target.value})}
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Chardonnay">Chardonnay</option>
                        <option value="Pinot Noir">Pinot Noir</option>
                        <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                        <option value="Merlot">Merlot</option>
                        <option value="Sauvignon Blanc">Sauvignon Blanc</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Date d'observation *</label>
                      <input
                        type="date"
                        value={formData.date_observation}
                        onChange={(e) => setFormData({...formData, date_observation: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>État de santé *</label>
                      <select
                        value={formData.etat_sante}
                        onChange={(e) => setFormData({...formData, etat_sante: e.target.value})}
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Bon">Bon</option>
                        <option value="Moyen">Moyen</option>
                        <option value="Préoccupant">Préoccupant</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes complémentaires</label>
                    <textarea
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Observations, traitements effectués, etc."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Liste des observations */}
          {parcelles.map(parcelle => (
            <div key={parcelle.id} className="card">
              <div className="card-header">
                <h2 className="card-title">{parcelle.nom_parcelle}</h2>
              </div>
              <div className="card-body">
                <div className="profile-info">
                  <div className="profile-item">
                    <span className="profile-label">Surface</span>
                    <span className="profile-value">{parcelle.surface} ha</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Cépage</span>
                    <span className="profile-value">{parcelle.cepage}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Date</span>
                    <span className="profile-value">
                      {new Date(parcelle.date_observation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">État</span>
                    <span className={`badge ${
                      parcelle.etat_sante === 'Excellent' ? 'badge-admin' : 'badge-user'
                    }`}>
                      {parcelle.etat_sante}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si pas de données */}
        {parcelles.length === 0 && !showForm && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🍇</div>
            <h2>Aucune observation enregistrée</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-xl)' }}>
              Commencez par ajouter votre première observation
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              ➕ Ajouter une observation
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ============================================
// POUR UTILISER CETTE PAGE :
// ============================================
// 1. Copiez ce fichier dans src/pages/VineyardData.jsx
// 
// 2. Créez la table SQL dans Supabase :
//
// CREATE TABLE parcelles (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES auth.users(id) NOT NULL,
//   nom_parcelle TEXT NOT NULL,
//   surface NUMERIC NOT NULL,
//   cepage TEXT NOT NULL,
//   date_observation DATE NOT NULL,
//   etat_sante TEXT NOT NULL,
//   notes TEXT,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// ALTER TABLE parcelles ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can manage their own parcelles"
// ON parcelles
// FOR ALL
// TO authenticated
// USING (auth.uid() = user_id)
// WITH CHECK (auth.uid() = user_id);
//
// 3. Ajoutez la route dans src/App.jsx :
//
// import VineyardData from './pages/VineyardData'
//
// <Route
//   path="/parcelles"
//   element={
//     <ProtectedRoute>
//       <VineyardData />
//     </ProtectedRoute>
//   }
// />
//
// 4. Ajoutez un lien dans le Layout ou la page d'accueil
