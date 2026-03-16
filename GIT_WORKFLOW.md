# 📋 Guide Git - BaseViti App

## 🗺️ Rappel de l'organisation

```
master ──────────────────────────────▶  Production (baseviti-app.vercel.app)
   │
   └── dev ────────────────────────▶  Développement (ton travail quotidien)
```

- **Tu travailles toujours sur `dev`**
- **`master` = ce que voient les utilisateurs**
- Vercel redéploie automatiquement dès qu'on pousse sur `master`

---

## 📅 Travail quotidien (sur dev)

### 1. Vérifier sur quelle branche tu es
```bash
git branch
```
La branche active a une étoile ★ devant son nom.
Tu dois voir `* dev`.

### 2. Si tu n'es pas sur dev, y aller
```bash
git checkout dev
```

### 3. Tu codes normalement dans VS Code...

### 4. Sauvegarder ton travail (commit)
```bash
git add .
git commit -m "feat: description de ce que tu as fait"
git push
```

---

## 🚀 Mettre en production

Quand tu es satisfait de tes changements sur `dev` et que tu veux les mettre en ligne :

```bash
# 1. Aller sur master
git checkout master

# 2. Fusionner les changements de dev dans master
git merge dev

# 3. Envoyer sur GitHub (Vercel redéploie automatiquement)
git push

# 4. Retourner sur dev pour continuer à travailler
git checkout dev
```

⏱️ Vercel met environ 1 minute pour redéployer.

---

## 💬 Convention des messages de commit

Un bon message de commit explique CE QUE tu as fait :

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `feat:` | Nouvelle fonctionnalité | `feat: ajout filtres parcelles` |
| `fix:` | Correction de bug | `fix: correction reset formulaire` |
| `docs:` | Documentation | `docs: mise à jour README` |
| `style:` | Changement visuel CSS | `style: couleur bouton primaire` |

---

## 🔍 Commandes utiles

```bash
# Voir l'état de tes fichiers modifiés
git status

# Voir l'historique des commits
git log --oneline

# Voir sur quelle branche tu es
git branch

# Annuler les modifications d'un fichier (avant commit)
git checkout -- nom-du-fichier.jsx
```

---

## ⚠️ Règles importantes

1. **Ne jamais travailler directement sur `master`**
2. **Toujours tester en local avant de mettre en production**
3. **Ne jamais committer le fichier `.env`**
4. **Un commit = une modification logique** (pas tout en un seul commit)

---

## 🌐 URLs importantes

| Environnement | URL |
|---------------|-----|
| Local (développement) | http://localhost:5173 |
| Production | https://baseviti-app.vercel.app |
| GitHub | https://github.com/OliBrunelO/baseviti-app |
| Supabase | https://supabase.com/dashboard/project/apoladhtjbfwjzwfqgps |
| Vercel | https://vercel.com/olibrunelos-projects/baseviti-app |

---

*Dernière mise à jour : 16 mars 2026*
