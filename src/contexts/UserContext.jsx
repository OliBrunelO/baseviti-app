import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userPropriete, setUserPropriete] = useState(null)
  const [proprieteData, setProprietData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setUserRole(session.user.user_metadata?.role || 'salarie')
        setUserPropriete(session.user.user_metadata?.id_propriete || null)
        
        // Charger les données de la propriété si applicable
        if (session.user.user_metadata?.id_propriete) {
          loadProprietData(session.user.user_metadata.id_propriete)
        }
      }
      setLoading(false)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setUserRole(session.user.user_metadata?.role || 'salarie')
        setUserPropriete(session.user.user_metadata?.id_propriete || null)
        
        if (session.user.user_metadata?.id_propriete) {
          loadProprietData(session.user.user_metadata.id_propriete)
        }
      } else {
        setUser(null)
        setUserRole(null)
        setUserPropriete(null)
        setProprietData(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProprietData = async (proprieteId) => {
    const { data, error } = await supabase
      .from('proprietes')
      .select('*')
      .eq('id_propriete', proprieteId)
      .single()
    
    if (!error && data) {
      setProprietData(data)
    }
  }

  const isSuperAdmin = userRole === 'super_admin'
  const isAdmin = userRole === 'admin'
  const isSalarie = userRole === 'salarie'

  return (
    <UserContext.Provider value={{
      user,
      userRole,
      userPropriete,
      proprieteData,
      loading,
      isSuperAdmin,
      isAdmin,
      isSalarie
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}