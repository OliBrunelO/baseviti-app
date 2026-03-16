# BaseViti App

Application web de gestion des travaux viticoles.

## Technologies
- React + Vite
- Supabase (PostgreSQL + Auth)
- PWA (Progressive Web App)

## Installation
```bash
npm install
npm run dev
```

## Configuration

Copier `.env.example` en `.env` et renseigner les variables :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## Rôles utilisateurs
- **super_admin** : accès complet
- **admin** : gestion de sa propriété
- **salarié** : saisie des travaux