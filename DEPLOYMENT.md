# 🚀 Guide de Déploiement en Production

## Options de déploiement

### Option 1 : Netlify (Recommandé - Gratuit)

#### Prérequis
- Compte GitHub (pour pousser votre code)
- Compte Netlify (gratuit)

#### Étapes

1. **Préparer le code**
```bash
# Assurez-vous que tout fonctionne en local
npm run build

# Le dossier dist/ doit être créé
```

2. **Pousser sur GitHub**
```bash
git init
git add .
git commit -m "Initial commit - Supabase Starter Kit"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main
```

3. **Déployer sur Netlify**
- Allez sur https://netlify.com
- "Add new site" → "Import an existing project"
- Connectez GitHub et sélectionnez votre repo
- Configuration :
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`
  - **Environment variables**:
    - `VITE_SUPABASE_URL` = votre URL Supabase
    - `VITE_SUPABASE_ANON_KEY` = votre clé anon

4. **Configurer Supabase**
Dans Supabase Dashboard → Authentication → URL Configuration :
- **Site URL**: Votre URL Netlify (ex: https://votre-app.netlify.app)
- **Redirect URLs**: Ajoutez :
  - `https://votre-app.netlify.app/**`
  - `https://votre-app.netlify.app/set-password`

5. **Tester**
- Visitez votre site Netlify
- Testez la connexion
- Testez l'invitation d'utilisateurs

---

### Option 2 : Vercel (Alternative gratuite)

Similaire à Netlify :

1. Visitez https://vercel.com
2. Importez depuis GitHub
3. Configurez les variables d'environnement
4. Déployez
5. Configurez les URLs dans Supabase

---

### Option 3 : Hébergement personnalisé (VPS)

#### Prérequis
- Un serveur (VPS) avec Ubuntu
- Un nom de domaine
- Accès SSH

#### Installation sur le serveur

```bash
# Se connecter au serveur
ssh user@votre-serveur.com

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer nginx
sudo apt-get install nginx

# Cloner le projet
cd /var/www
sudo git clone https://github.com/VOTRE-USERNAME/VOTRE-REPO.git app
cd app

# Créer .env
sudo nano .env
# Coller vos variables d'environnement
# Ctrl+X, Y, Enter pour sauvegarder

# Installer et builder
sudo npm install
sudo npm run build

# Configurer nginx
sudo nano /etc/nginx/sites-available/app
```

Configuration nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Installer Certbot pour HTTPS
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## 🔒 Sécurité en production

### 1. Variables d'environnement
- ❌ Ne jamais commit `.env`
- ✅ Utiliser les variables d'environnement de la plateforme
- ✅ Régénérer les clés si elles sont exposées

### 2. Supabase
- ✅ Activer RLS sur toutes les tables
- ✅ Tester les policies avec différents utilisateurs
- ✅ Limiter les permissions de la clé ANON
- ✅ Configurer les CORS correctement

### 3. Application
- ✅ Activer HTTPS (certificat SSL)
- ✅ Configurer CSP (Content Security Policy)
- ✅ Valider toutes les entrées utilisateur
- ✅ Logger les erreurs (Sentry, LogRocket)

---

## 📊 Monitoring

### Netlify Analytics (gratuit)
- Visitez votre dashboard Netlify
- Activez Analytics
- Suivez le trafic et les performances

### Supabase Logs
- Dashboard Supabase → Logs
- Surveillez les requêtes et erreurs

### Sentry (optionnel)
Pour tracker les erreurs :

```bash
npm install @sentry/react
```

Dans `src/main.jsx` :
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_DSN_SENTRY",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 🔄 Mises à jour

### Déploiement automatique (Netlify/Vercel)
Chaque push sur `main` déploie automatiquement :

```bash
git add .
git commit -m "Update: nouvelle fonctionnalité"
git push
# ✨ Déployé automatiquement !
```

### Déploiement manuel (VPS)
```bash
ssh user@serveur
cd /var/www/app
sudo git pull
sudo npm install
sudo npm run build
sudo systemctl restart nginx
```

---

## 📱 Configuration mobile

### PWA (Progressive Web App)
Pour permettre l'installation sur mobile :

1. Créer `public/manifest.json` :
```json
{
  "name": "Vignoble App",
  "short_name": "Vignoble",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2d5016",
  "theme_color": "#2d5016",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. Dans `index.html` :
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2d5016">
```

---

## ✅ Checklist avant lancement

- [ ] Tests complets de toutes les fonctionnalités
- [ ] Connexion / Déconnexion fonctionnent
- [ ] Invitations d'utilisateurs fonctionnent
- [ ] Emails reçus correctement
- [ ] Responsive testé sur mobile
- [ ] RLS configuré et testé
- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] URLs de redirection configurées dans Supabase
- [ ] Sauvegarde de la base de données configurée
- [ ] Monitoring en place
- [ ] Documentation à jour

---

## 🆘 Support

### En cas de problème

1. **Vérifier les logs**
   - Netlify : Dashboard → Deploys → Function logs
   - Supabase : Dashboard → Logs

2. **Tester en local**
   ```bash
   npm run dev
   ```

3. **Variables d'environnement**
   Vérifiez qu'elles sont bien configurées sur la plateforme

4. **Rebuilder**
   Dans Netlify/Vercel : Trigger deploy → Clear cache and deploy

---

## 📈 Optimisations futures

- [ ] Ajouter un service worker pour offline
- [ ] Implémenter lazy loading des pages
- [ ] Compresser les images
- [ ] Ajouter du caching
- [ ] Optimiser les requêtes Supabase
- [ ] Ajouter des tests automatisés

Bon déploiement ! 🚀
