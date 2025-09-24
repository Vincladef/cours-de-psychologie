# Cours à trous

Application complète de révision de cours avec un backend Express/SQLite et un frontend React (Vite).

## Backend Express

- **Démarrer en local**
  ```bash
  npm install
  npm start
  ```
- Variables d'environnement
  - `PORT` : port d'écoute (3000 par défaut)
  - `DB_PATH` : chemin vers le fichier SQLite (défaut `database.sqlite` à la racine)
- Les tables SQLite sont créées automatiquement au démarrage :
  - `users` : pseudo unique
  - `courses` : contenus des cours avec marqueurs `[[HOLE:uuid|texte]]`
  - `holes` : dictionnaire des trous d'un cours
  - `hole_states` : progression par utilisateur
- Principales routes REST (JSON)
  - `GET /` → statut du serveur
  - `GET /users?username=` / `POST /users`
  - `GET /courses?userId=` / `POST /courses`
  - `GET /courses/:id` / `PUT /courses/:id` / `DELETE /courses/:id`
  - `POST /courses/:id/sync-holes`
  - `GET /courses/:id/holes?userId=`
  - `POST /holes/:id/review`
  - `POST /iterations/advance`

## Frontend React (Vite)

Le frontend complet se trouve dans le dossier `frontend/`.

- **Prérequis**
  ```bash
  cd frontend
  npm install
  ```
- **Variables d'environnement** : créer un fichier `.env` ou utiliser `npm run` avec
  ```bash
  VITE_API_BASE_URL=https://cours-de-psychologie.onrender.com
  ```
- **Développement**
  ```bash
  npm run dev
  ```
- **Build de production**
  ```bash
  npm run build
  npm run preview
  ```

## Déploiement GitHub Pages

1. Activer GitHub Pages sur la branche `main` ou `gh-pages` (dossier `frontend/dist`).
2. Depuis `frontend/`, construire les assets :
   ```bash
   npm install
   npm run build
   ```
3. Déployer le contenu du dossier `dist/` (ex. via l'action GitHub Pages ou `gh-pages`).
4. Vérifier que l'environnement de build définit `VITE_API_BASE_URL=https://cours-de-psychologie.onrender.com`.

## Fonctionnalités principales

- Authentification minimale par pseudo (persistée en `localStorage`).
- Tableau de bord des cours (création, ouverture, suppression).
- Éditeur riche avec génération de trous `[[HOLE:uuid|texte]]` et synchronisation automatique.
- Mode révision avec gestion des trous, révélation à la demande et notation Likert.
- Bouton "Nouvelle itération" décrémentant les compteurs de révision utilisateur.
