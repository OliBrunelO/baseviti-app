# 🎨 Checklist de Personnalisation

Ce document vous guide pour adapter le starter-kit à votre projet spécifique.

## 🎯 Branding & Identité

### Couleurs et thème visuel
- [ ] Modifier les variables CSS dans `src/App.css` (lignes 6-30)
  - `--primary` : Couleur principale
  - `--accent` : Couleur d'accentuation
  - `--success`, `--warning`, `--error` : Couleurs de statut

```css
/* Exemple : Thème bleu océan */
--primary: #006994;
--primary-dark: #003f5c;
--accent: #00b4d8;
```

### Logo et icônes
- [ ] Remplacer l'emoji 🍇 dans `src/components/Layout.jsx` (ligne 41)
- [ ] Ajouter votre logo dans `public/`
- [ ] Créer des icônes PWA (192x192 et 512x512)
- [ ] Modifier le favicon dans `public/`

### Textes et noms
- [ ] Changer "Vignoble App" dans :
  - `index.html` (titre)
  - `src/components/Layout.jsx` (ligne 42)
  - `package.json` (name)
  - `README.md`

---

## 📊 Base de Données

### Tables métier
1. **Identifier vos entités** (ex: parcelles, observations, traitements)
2. **Créer les tables SQL** dans Supabase
3. **Configurer les RLS policies**
4. **Créer les index** pour performance

Exemple pour vos vignes :
```sql
-- Table parcelles
CREATE TABLE parcelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nom TEXT NOT NULL,
  surface NUMERIC,
  cepage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table observations
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelle_id UUID REFERENCES parcelles(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date_observation DATE NOT NULL,
  etat_sante TEXT,
  notes TEXT,
  photos TEXT[], -- URLs des photos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE parcelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own parcelles"
ON parcelles FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own observations"
ON observations FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 📱 Pages et Fonctionnalités

### Pages à créer/modifier

- [ ] **Liste des parcelles** (`src/pages/Parcelles.jsx`)
  - Affichage en grille/liste
  - Recherche et filtres
  - Actions (voir, éditer, supprimer)

- [ ] **Détail d'une parcelle** (`src/pages/ParcelleDetail.jsx`)
  - Informations complètes
  - Historique des observations
  - Graphiques d'évolution

- [ ] **Formulaire de saisie** (`src/pages/NouvelleObservation.jsx`)
  - Champs adaptés à votre métier
  - Upload de photos
  - Géolocalisation (optionnel)

- [ ] **Tableau de bord** (modifier `src/pages/Home.jsx`)
  - Statistiques personnalisées
  - Alertes importantes
  - Accès rapides

### Routes
Dans `src/App.jsx`, ajouter :
```javascript
<Route path="/parcelles" element={<ProtectedRoute><Parcelles /></ProtectedRoute>} />
<Route path="/parcelle/:id" element={<ProtectedRoute><ParcelleDetail /></ProtectedRoute>} />
<Route path="/observation/new" element={<ProtectedRoute><NouvelleObservation /></ProtectedRoute>} />
```

---

## 🎨 Design Mobile

### Optimisations spécifiques

- [ ] Tester sur vrais appareils (iOS + Android)
- [ ] Vérifier la taille des boutons (min 44x44px)
- [ ] Ajuster les espacements pour les pouces
- [ ] Tester avec une main (zone accessible)

### Saisie terrain optimale

- [ ] **Champs de formulaire grands** et espacés
- [ ] **Auto-complétion** pour saisie rapide
- [ ] **Valeurs par défaut** intelligentes
- [ ] **Mode hors-ligne** (optionnel mais utile)

Exemple de formulaire mobile-friendly :
```css
.mobile-form input,
.mobile-form select {
  min-height: 48px; /* Facilite le tap */
  font-size: 16px; /* Évite le zoom sur iOS */
}
```

---

## 🔌 Fonctionnalités Avancées

### Upload de photos
```bash
npm install @supabase/storage-js
```

Dans votre composant :
```javascript
const uploadPhoto = async (file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(`observations/${fileName}`, file)
  
  if (error) throw error
  return data.path
}
```

Créer le bucket dans Supabase Dashboard → Storage

### Géolocalisation
```javascript
const getLocation = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      (error) => reject(error)
    )
  })
}
```

### Notifications (optionnel)
```bash
npm install @supabase/realtime-js
```

Pour être notifié des changements :
```javascript
const subscription = supabase
  .channel('observations')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'observations' },
    (payload) => console.log('Nouvelle observation !', payload)
  )
  .subscribe()
```

---

## 👥 Gestion des Utilisateurs

### Rôles supplémentaires
Si vous avez besoin de plus de rôles (admin, manager, user) :

```sql
-- Dans user_metadata, ajoutez :
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "manager"}'::jsonb
WHERE email = 'manager@exemple.com';
```

Puis dans le code :
```javascript
const isManager = user?.user_metadata?.role === 'manager'
const isAdmin = user?.user_metadata?.role === 'admin'
```

### Profils utilisateurs étendus
Créer une table `profiles` :
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nom_complet TEXT,
  telephone TEXT,
  entreprise TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Rapports et Exports

### Export CSV
```javascript
const exportToCSV = (data) => {
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
}
```

### Graphiques
```bash
npm install recharts
```

Exemple :
```javascript
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

<LineChart width={500} height={300} data={observations}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="valeur" stroke="#2d5016" />
</LineChart>
```

---

## 🔒 Sécurité Renforcée

### Validation des données
Créer un fichier `src/lib/validation.js` :
```javascript
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateParcelle = (data) => {
  if (!data.nom || data.nom.length < 3) {
    throw new Error('Le nom doit contenir au moins 3 caractères')
  }
  if (data.surface && data.surface <= 0) {
    throw new Error('La surface doit être positive')
  }
  return true
}
```

### Rate limiting (Supabase)
Dans Supabase Dashboard → Settings → API :
- Activer rate limiting
- Configurer les limites par IP

---

## 📱 PWA et Offline

### Service Worker basique
Créer `public/sw.js` :
```javascript
const CACHE_NAME = 'vignoble-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/App.css'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  )
})
```

Enregistrer dans `src/main.jsx` :
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

---

## ✅ Tests Utilisateurs

### Checklist de test terrain
- [ ] Connexion sur 4G (connexion lente)
- [ ] Saisie avec des gants
- [ ] Utilisation sous le soleil (contraste)
- [ ] Batterie faible
- [ ] Mode avion puis reconnexion
- [ ] Changement d'orientation (portrait/paysage)

---

## 📚 Documentation

### Pour votre équipe
- [ ] Créer un guide utilisateur simplifié
- [ ] Documenter les codes/statuts spécifiques
- [ ] Lister les contacts en cas de problème
- [ ] Créer des vidéos de démonstration

### Exemple de doc utilisateur
```markdown
# Guide Utilisateur - Saisie d'Observations

## 1. Se connecter
- Ouvrir l'app sur votre téléphone
- Entrer email + mot de passe

## 2. Nouvelle observation
- Menu → Nouvelle observation
- Sélectionner la parcelle
- Remplir les champs
- Ajouter photo (optionnel)
- Enregistrer

## 3. Consulter l'historique
- Menu → Mes parcelles
- Cliquer sur une parcelle
- Voir toutes les observations
```

---

## 🚀 Prochaines Itérations

Idées d'évolution :
- [ ] Intégration météo (API)
- [ ] Calculs automatiques (rendement prévu, etc.)
- [ ] Partage de parcelles entre utilisateurs
- [ ] Alertes automatiques (traitements à faire)
- [ ] Mode collaboratif (équipes)
- [ ] Dashboard admin avancé
- [ ] Export PDF des rapports
- [ ] Intégration calendrier

---

Bon développement ! 🍇
