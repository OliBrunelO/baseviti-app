# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### 1. Cloner et installer

```bash
# Si vous avez récupéré le projet
cd supabase-starter-kit
npm install
```

### 2. Configurer Supabase

#### A. Créer un projet Supabase (si pas encore fait)
1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez votre URL et votre clé ANON

#### B. Configurer la base de données
1. Dans Supabase Dashboard → SQL Editor
2. Créez une nouvelle requête
3. Copiez-collez tout le contenu de `supabase-setup.sql`
4. Exécutez la requête (Run)

**⚠️ IMPORTANT - Policy supplémentaire obligatoire :**

Après avoir exécuté le script, ajoutez cette policy pour éviter l'erreur 403 :

```sql
CREATE POLICY "authenticated_view_invitations"
ON invitations FOR SELECT TO authenticated USING (true);
```

Exécutez cette commande (Run) également.

### 3. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos vraies valeurs
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Trouvez ces valeurs dans : **Supabase Dashboard → Settings → API**

### 4. Créer votre premier admin

Dans Supabase Dashboard → SQL Editor, exécutez :

```sql
-- Remplacez par votre email
SELECT promote_to_admin('votre-email@exemple.com');
```

OU créez manuellement dans **Authentication → Users** :
- Add User
- Email + Password
- User Metadata : `{"role": "admin"}`

### 5. Configurer les emails (important !)

Dans **Supabase Dashboard → Authentication → Email Templates** :

1. Trouvez "Invite user"
2. Modifiez le template :

```html
<h2>Bienvenue !</h2>
<p>Vous avez été invité à rejoindre l'application Vignoble.</p>
<p><a href="{{ .SiteURL }}/set-password?token={{ .Token }}">Créer mon compte</a></p>
```

3. Sauvegardez

### 6. Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:5173

## ✅ Vérifications

- [ ] La page de connexion s'affiche
- [ ] Vous pouvez vous connecter avec votre compte admin
- [ ] Le dashboard affiche "Base de données connectée"
- [ ] Vous voyez le bouton "Admin" dans la navigation
- [ ] Page admin accessible

## 🎯 Premier test complet

1. **Connectez-vous** en tant qu'admin
2. **Allez sur** `/admin`
3. **Invitez un email** (utilisez un vrai email que vous contrôlez)
4. **Vérifiez les spams** - l'email peut arriver là
5. **Cliquez sur le lien** dans l'email
6. **Définissez un mot de passe**
7. **Vous êtes connecté** automatiquement !

## 🔧 Problèmes courants

### "Failed to fetch" / Erreur de connexion
→ Vérifiez vos variables `.env`
→ Vérifiez que l'URL n'a pas d'espace avant/après

### Email non reçu
→ Vérifiez les spams
→ Vérifiez le template email dans Supabase
→ Dans Supabase : Settings → Auth → SMTP Settings (optionnel pour custom domain)

### "Table doesn't exist"
→ Exécutez le script SQL `supabase-setup.sql`

### "Not authorized" sur page admin
→ Assurez-vous d'avoir le role admin : `raw_user_meta_data->>'role' = 'admin'`

## 📱 Test sur mobile

```bash
# Trouver votre IP locale
# Mac/Linux
ifconfig | grep "inet "
# Windows
ipconfig

# Lancer avec host
npm run dev -- --host

# Accédez depuis votre mobile sur
# http://192.168.x.x:5173
```

## 🚀 Prochaines étapes

1. **Personnalisez les couleurs** dans `src/App.css` (variables CSS en haut)
2. **Ajoutez vos tables métier** dans Supabase
3. **Créez de nouvelles pages** dans `src/pages/`
4. **Ajoutez des formulaires** de saisie pour vos vignes

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [React Router](https://reactrouter.com)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## 💡 Conseils

- Commencez simple : une page, une fonctionnalité à la fois
- Testez sur mobile dès le début
- Gardez le design mobile-first
- Utilisez les RLS policies de Supabase pour la sécurité

Bon développement ! 🍇
