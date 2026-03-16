-- ============================================
-- SUPABASE STARTER KIT - CONFIGURATION SQL
-- ============================================
-- Ce script configure votre base de données Supabase pour le starter-kit
-- Exécutez-le dans : Supabase Dashboard → SQL Editor → New Query

-- ============================================
-- 1. TABLE DES INVITATIONS
-- ============================================

-- Créer la table des invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE invitations IS 'Gestion des invitations utilisateurs';
COMMENT ON COLUMN invitations.email IS 'Email de l''utilisateur invité';
COMMENT ON COLUMN invitations.invited_by IS 'ID de l''admin qui a envoyé l''invitation';
COMMENT ON COLUMN invitations.invited_at IS 'Date d''envoi de l''invitation';
COMMENT ON COLUMN invitations.accepted_at IS 'Date d''acceptation de l''invitation';
COMMENT ON COLUMN invitations.token IS 'Token unique pour le lien d''invitation';

-- ============================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================

-- Index sur l'email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_invitations_email 
ON invitations(email);

-- Index sur le token pour validation rapide
CREATE INDEX IF NOT EXISTS idx_invitations_token 
ON invitations(token);

-- Index sur les invitations non acceptées
CREATE INDEX IF NOT EXISTS idx_invitations_pending 
ON invitations(invited_at) 
WHERE accepted_at IS NULL;

-- Index sur l'inviteur
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by 
ON invitations(invited_by);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur la table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "admin_manage_invitations" ON invitations;
DROP POLICY IF EXISTS "users_view_invitations" ON invitations;
DROP POLICY IF EXISTS "users_view_own_invitation" ON invitations;

-- Policy 1: Les admins peuvent tout gérer
CREATE POLICY "admin_manage_invitations"
ON invitations
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 2: Les utilisateurs peuvent voir leurs propres invitations (avec token)
CREATE POLICY "users_view_own_invitation"
ON invitations
FOR SELECT
TO anon
USING (true);

-- Policy 3: Les utilisateurs authentifiés peuvent voir les invitations
CREATE POLICY "authenticated_view_invitations"
ON invitations
FOR SELECT
TO authenticated
USING (true);

-- Policy 4: Les utilisateurs peuvent mettre à jour leur propre invitation (acceptation)
CREATE POLICY "users_accept_invitation"
ON invitations
FOR UPDATE
TO anon
USING (accepted_at IS NULL)
WITH CHECK (accepted_at IS NOT NULL);

-- ============================================
-- 4. FONCTION POUR NETTOYER LES VIEILLES INVITATIONS
-- ============================================

-- Créer une fonction pour supprimer les invitations expirées (> 7 jours)
CREATE OR REPLACE FUNCTION clean_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM invitations
  WHERE accepted_at IS NULL
  AND invited_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION clean_expired_invitations IS 
'Supprime les invitations non acceptées de plus de 7 jours';

-- ============================================
-- 5. TRIGGER POUR LOGS (OPTIONNEL)
-- ============================================

-- Table pour logger les invitations
CREATE TABLE IF NOT EXISTS invitation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'accepted', 'expired'
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Function trigger pour logger
CREATE OR REPLACE FUNCTION log_invitation_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO invitation_logs (invitation_id, action, metadata)
    VALUES (NEW.id, 'created', jsonb_build_object('email', NEW.email));
  ELSIF TG_OP = 'UPDATE' AND OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    INSERT INTO invitation_logs (invitation_id, action, metadata)
    VALUES (NEW.id, 'accepted', jsonb_build_object('email', NEW.email));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_log_invitation ON invitations;
CREATE TRIGGER trigger_log_invitation
AFTER INSERT OR UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION log_invitation_action();

-- ============================================
-- 6. VUES UTILES
-- ============================================

-- Vue pour les invitations en attente
CREATE OR REPLACE VIEW pending_invitations AS
SELECT 
  i.id,
  i.email,
  i.invited_at,
  i.invited_by,
  u.email as invited_by_email,
  EXTRACT(DAY FROM NOW() - i.invited_at) as days_pending
FROM invitations i
LEFT JOIN auth.users u ON i.invited_by = u.id
WHERE i.accepted_at IS NULL
ORDER BY i.invited_at DESC;

COMMENT ON VIEW pending_invitations IS 
'Vue des invitations en attente avec informations de l''inviteur';

-- Vue pour les statistiques d'invitations
CREATE OR REPLACE VIEW invitation_stats AS
SELECT
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE accepted_at IS NOT NULL) as accepted_count,
  COUNT(*) FILTER (WHERE accepted_at IS NULL) as pending_count,
  COUNT(*) FILTER (WHERE accepted_at IS NULL AND invited_at < NOW() - INTERVAL '7 days') as expired_count,
  ROUND(
    COUNT(*) FILTER (WHERE accepted_at IS NOT NULL)::NUMERIC / 
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
    2
  ) as acceptance_rate
FROM invitations;

COMMENT ON VIEW invitation_stats IS 
'Statistiques globales sur les invitations';

-- ============================================
-- 7. FONCTION POUR CRÉER UN ADMIN
-- ============================================

-- Fonction utilitaire pour promouvoir un utilisateur en admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Trouver l'utilisateur
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- Mettre à jour les métadonnées
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION promote_to_admin IS 
'Promouvoir un utilisateur en administrateur. Usage: SELECT promote_to_admin(''email@example.com'');';

-- ============================================
-- 8. DONNÉES INITIALES (OPTIONNEL)
-- ============================================

-- Si vous voulez créer un admin par défaut, décommentez et modifiez :
-- SELECT promote_to_admin('votre-email@exemple.com');

-- ============================================
-- FIN DE LA CONFIGURATION
-- ============================================

-- Afficher un résumé
SELECT 
  'Configuration terminée !' as message,
  (SELECT COUNT(*) FROM invitations) as invitations_count,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') as admin_count;
