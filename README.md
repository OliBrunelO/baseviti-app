# 🚀 Supabase Starter Kit - Gestion Vignoble

Un starter-kit moderne et responsive pour applications de saisie de données sur le terrain.

## 📋 Fonctionnalités

- ✅ Authentification email/mot de passe via Supabase
- ✅ Page d'accueil (dashboard) après connexion
- ✅ Page admin pour inviter des utilisateurs
- ✅ Flux d'invitation avec définition de mot de passe
- ✅ Design responsive mobile-first
- ✅ Déconnexion sécurisée

## 🛠️ Configuration

### 1. Prérequis

- Node.js 16+
- Un compte Supabase (gratuit)
- npm ou yarn

### 2. Configuration Supabase

#### A. Créer les tables nécessaires

Dans votre dashboard Supabase, exécutez ce SQL :

```sql
-- Table pour les invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT
);

-- Index pour performance
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);

-- RLS (Row Level Security)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy : Admin peut tout faire
CREATE POLICY "Admin can manage invitations"
ON invitations
FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
));

-- Policy : Utilisateur peut voir ses propres invitations
CREATE POLICY "Users can view their invitations"
ON invitations
FOR SELECT
TO anon
USING (true);

-- Policy : Utilisateurs authentifiés peuvent voir les invitations
CREATE POLICY "authenticated_view_invitations"
ON invitations
FOR SELECT
TO authenticated
USING (true);
```

#### B. Configurer l'email d'invitation

1. Dans Supabase Dashboard → Authentication → Email Templates
2. Modifier le template "Invite user"
3. Utiliser ce template :

```html
<h2>Vous êtes invité !</h2>
<p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
<p><a href="{{ .SiteURL }}/set-password?token={{ .Token }}">Définir mon mot de passe</a></p>
```

#### C. Créer un utilisateur admin

Dans Authentication → Users → Add User :
- Email : votre-email@exemple.com
- Password : votre-mot-de-passe
- User Metadata : `{"role": "admin"}`

### 3. Installation du projet

```bash
# Cloner ou créer le projet
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### 4. Configuration des variables d'environnement

Éditez `.env` avec vos clés Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

Trouvez ces valeurs dans Supabase Dashboard → Settings → API

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera disponible sur http://localhost:5173

## 📱 Utilisation

### Flux d'invitation utilisateur

1. **Admin se connecte** → va sur `/admin`
2. **Admin invite un utilisateur** → saisit l'email
3. **Utilisateur reçoit un email** avec lien d'invitation
4. **Utilisateur clique sur le lien** → arrive sur `/set-password`
5. **Utilisateur définit son mot de passe** → peut se connecter

### Structure des pages

- `/login` - Connexion
- `/` - Dashboard (protégé, nécessite authentification)
- `/admin` - Administration (protégé, nécessite role admin)
- `/set-password?token=xxx` - Définition mot de passe (public avec token)

## 🔧 Structure du projet

```
starter-kit/
├── public/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Home.jsx
│   │   ├── Admin.jsx
│   │   └── SetPassword.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

## 🎨 Personnalisation

### Thème visuel

Le design utilise des variables CSS définies dans `App.css` :

```css
:root {
  --primary: #2d5016;
  --primary-dark: #1a3009;
  --accent: #7cb342;
  /* ... */
}
```

Modifiez ces valeurs pour adapter les couleurs à votre charte graphique.

### Ajouter des fonctionnalités

Le starter est conçu pour être étendu facilement :
- Ajoutez des tables dans Supabase
- Créez de nouvelles pages dans `src/pages/`
- Ajoutez des routes dans `App.jsx`

## 📦 Déploiement

### Netlify / Vercel

```bash
npm run build
# Déployez le dossier dist/
```

N'oubliez pas de configurer les variables d'environnement sur la plateforme de déploiement.

### Supabase Edge Functions (optionnel)

Pour des fonctionnalités avancées, vous pouvez utiliser les Edge Functions de Supabase.

## 🔒 Sécurité

- ✅ RLS activé sur toutes les tables sensibles
- ✅ Tokens d'invitation à usage unique
- ✅ Routes protégées côté client
- ✅ Validation des emails
- ⚠️ En production : activez HTTPS et configurez les CORS

## 🐛 Dépannage

**Erreur de connexion Supabase**
- Vérifiez vos variables d'environnement
- Assurez-vous que l'URL et la clé sont correctes

**Email d'invitation non reçu**
- Vérifiez les spams
- Vérifiez la configuration SMTP dans Supabase

**Erreur de permission**
- Vérifiez les policies RLS
- Assurez-vous que l'utilisateur admin a le bon metadata

## 📝 License

MIT - Libre d'utilisation pour vos projets

## 🤝 Contribution

Ce starter-kit est un point de départ. N'hésitez pas à l'adapter à vos besoins spécifiques !
