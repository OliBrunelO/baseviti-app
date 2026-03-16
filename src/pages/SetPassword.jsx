import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const [checkingToken, setCheckingToken] = useState(true)
  const navigate = useNavigate()

  const token = searchParams.get('token')

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      }
    })

    // Vérifier le token
    if (token) {
      checkInvitationToken()
    } else {
      setError('Token d\'invitation manquant')
      setCheckingToken(false)
    }
  }, [token, navigate])

  const checkInvitationToken = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (error || !data) {
        setError('Ce lien d\'invitation est invalide ou a déjà été utilisé')
      } else {
        setInvitation(data)
      }
    } catch (error) {
      setError('Erreur lors de la vérification du lien')
    } finally {
      setCheckingToken(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      // Créer le compte utilisateur
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      })

      if (signUpError) throw signUpError

      // Marquer l'invitation comme acceptée
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)

      if (updateError) {
        console.error('Erreur lors de la mise à jour de l\'invitation:', updateError)
        // On continue quand même car le compte est créé
      }

      // Connexion automatique
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: password,
      })

      if (signInError) throw signInError

      navigate('/')
    } catch (error) {
      console.error('Erreur:', error)
      if (error.message.includes('User already registered')) {
        setError('Un compte existe déjà avec cet email. Essayez de vous connecter.')
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="auth-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Vérification de l'invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="error-content">
            <div className="error-icon">❌</div>
            <h1 className="error-title">Lien invalide</h1>
            <p className="error-message">{error}</p>
            <a href="/login" className="btn btn-primary">
              Aller à la connexion
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h1 className="auth-title">Créer votre compte</h1>
          <p className="auth-subtitle">
            Bienvenue ! Définissez votre mot de passe pour accéder à votre espace
          </p>
          {invitation && (
            <div className="invitation-badge">
              <span>✉️</span>
              <span>{invitation.email}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
            <p className="form-help">Minimum 6 caractères</p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-muted">
            Vous avez déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  )
}
