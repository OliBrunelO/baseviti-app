import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function AdminStructure() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [csvContent, setCsvContent] = useState('')

  // Télécharger le template CSV
  const downloadTemplate = async () => {
    try {
      const { data, error } = await supabase.rpc('get_csv_template')
      
      if (error) throw error

      // Créer un blob et télécharger
      const blob = new Blob([data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template_sous_parcelles.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur : ' + error.message })
    }
  }

  // Gérer le fichier uploadé
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setCsvContent(e.target.result)
    }
    reader.readAsText(file)
  }

  // Importer le CSV
  const handleImport = async () => {
    if (!csvContent) {
      setMessage({ type: 'error', text: 'Veuillez d\'abord sélectionner un fichier CSV' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Appeler la fonction d'import (plus besoin de passer id_propriete)
      const { data, error } = await supabase.rpc('import_sous_parcelles_csv', {
        p_csv_data: csvContent
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: data[0].message 
      })
      
      // Réinitialiser le formulaire
      setCsvContent('')
      document.getElementById('csvFile').value = ''

    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur : ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container page-container">
        <div className="page-header">
          <h1 className="page-title">📁 Import de Structure</h1>
          <p className="page-subtitle">
            Importez vos secteurs, parcelles et sous-parcelles via CSV
          </p>
        </div>

        <div className="cards-grid">
          {/* Instructions */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">📋 Instructions</h2>
            </div>
            <div className="card-body">
              <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Téléchargez le template CSV ci-dessous</li>
                <li>Remplissez-le avec vos données (Excel, LibreOffice, Google Sheets...)</li>
                <li>Enregistrez en format CSV (UTF-8)</li>
                <li>Uploadez le fichier ci-dessous</li>
              </ol>
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <button onClick={downloadTemplate} className="btn btn-primary">
                  📥 Télécharger le template CSV
                </button>
              </div>
            </div>
          </div>

          {/* Format du CSV */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">📝 Format du CSV</h2>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: 'var(--space-md)' }}>
                Le fichier doit contenir ces colonnes dans cet ordre :
              </p>
              <div style={{ 
                backgroundColor: 'var(--gray-100)', 
                padding: 'var(--space-md)', 
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflowX: 'auto'
              }}>
                propriete,secteur,parcelle,sous_parcelle,campagne,cepage,surface,nb_pieds,etat
              </div>
              <p style={{ marginTop: 'var(--space-md)', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                <strong>Exemples de valeurs pour "etat" :</strong> jachere, JVSP1, JVSP2, production
              </p>
            </div>
          </div>

          {/* Formulaire d'import */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">⬆️ Import CSV</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Fichier CSV</label>
                <input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                {csvContent && (
                  <p style={{ marginTop: 'var(--space-sm)', fontSize: '0.9rem', color: 'var(--success)' }}>
                    ✓ Fichier chargé ({csvContent.split('\n').length - 1} lignes)
                  </p>
                )}
              </div>

              <button 
                onClick={handleImport} 
                className="btn btn-primary"
                disabled={loading || !csvContent}
              >
                {loading ? '⏳ Import en cours...' : '🚀 Importer'}
              </button>

              {message && (
                <div style={{
                  marginTop: 'var(--space-lg)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                  border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`
                }}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}