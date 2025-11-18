# PublieDev - L'innovation tech Made in Côte d'Ivoire

PublieDev est une plateforme PWA (Progressive Web App) de référence pour découvrir et partager les applications, APIs, programmes et ressources techniques créées par les développeurs ivoiriens. Inspiré par PubMed pour le domaine médical, PublieDev vise à créer une base de données complète de l'innovation technologique ivoirienne.

## Fonctionnalités

### Publications
- **Applications** - Applications web et mobile
- **APIs** - Interfaces de programmation et services
- **Programmes** - Scripts, outils CLI et bibliothèques
- **Tutoriels** - Guides pas à pas et formations
- **Articles** - Articles techniques et scientifiques

### Recherche et Indexation
- Recherche full-text avec autocomplétion
- Filtrage par type, catégorie, technologies
- Système d'indexation par mots-clés
- Tri par pertinence, date, popularité

### RAG (Retrieval Augmented Generation)
- Système de questions-réponses intelligent
- Extraction de contexte pertinent
- Réponses basées sur les publications indexées

### PWA
- Installation sur mobile et desktop
- Fonctionnement hors-ligne
- Notifications push (optionnel)
- Performance optimisée

## Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (couleur principale: Bluesky)
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **State Management**: React Query
- **Routing**: React Router v6
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin + Workbox

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase

### Configuration

1. **Cloner le projet**
```bash
git clone https://github.com/votre-repo/publiedev.git
cd publiedev
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Firebase**

Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com) et activez:
- Authentication (Email/Password, Google, GitHub)
- Firestore Database
- Storage
- Hosting

4. **Variables d'environnement**

Copiez le fichier `.env.example` vers `.env` et remplissez vos clés Firebase:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_MEASUREMENT_ID=votre_measurement_id
```

5. **Configurer Firestore Rules**

Dans la console Firebase, configurez les règles de sécurité Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Publications collection
    match /publications/{publicationId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        request.auth.uid == resource.data.authorId;
    }

    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        request.auth.uid == resource.data.authorId;
    }
  }
}
```

6. **Créer les index Firestore**

Créez les index composites nécessaires dans la console Firebase ou via CLI:

```bash
firebase deploy --only firestore:indexes
```

### Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Build de production

```bash
npm run build
```

### Déploiement sur Firebase

```bash
# Installation Firebase CLI
npm install -g firebase-tools

# Connexion
firebase login

# Initialisation
firebase init hosting

# Déploiement
npm run build && firebase deploy --only hosting
```

## Structure du projet

```
publiedev/
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants React
│   │   ├── Layout/         # Header, Footer, Layout
│   │   ├── Publication/    # Cartes de publication
│   │   └── UI/             # Composants UI réutilisables
│   ├── contexts/           # Contextes React (Auth)
│   ├── hooks/              # Hooks personnalisés
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services Firebase
│   │   ├── firebase.ts     # Configuration Firebase
│   │   ├── auth.ts         # Authentification
│   │   ├── publications.ts # CRUD publications
│   │   ├── search.ts       # Recherche et indexation
│   │   └── rag.ts          # Système RAG
│   ├── types/              # Types TypeScript
│   ├── utils/              # Utilitaires
│   ├── App.tsx             # Composant principal
│   └── main.tsx            # Point d'entrée
├── .env.example            # Variables d'environnement
├── firebase.json           # Configuration Firebase
├── firestore.rules         # Règles Firestore
├── firestore.indexes.json  # Index Firestore
├── tailwind.config.js      # Configuration Tailwind
├── vite.config.ts          # Configuration Vite
└── package.json
```

## Fonctionnalités détaillées

### Système de publication

Les utilisateurs peuvent publier différents types de contenu:

1. **Création** - Formulaire avec métadonnées, technologies, liens
2. **Indexation** - Génération automatique de mots-clés
3. **Modération** - Statut draft/pending/published
4. **Métriques** - Vues, likes, bookmarks, citations

### Système de recherche

- Recherche par mots-clés dans titre, description, contenu
- Autocomplétion avec suggestions
- Filtres avancés (type, catégories, technologies, date)
- Tri par pertinence avec scoring

### Système RAG

Le système RAG permet de poser des questions et obtenir des réponses basées sur les publications:

1. **Retrieval** - Récupération des documents pertinents
2. **Extraction** - Extraction des chunks de contenu
3. **Scoring** - Calcul de la pertinence
4. **Response** - Génération de la réponse

Note: Pour un RAG complet avec LLM, intégrez une API comme OpenAI ou Anthropic.

## Contribution

Les contributions sont les bienvenues! Veuillez:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

## Roadmap

- [ ] Système de commentaires
- [ ] Notifications en temps réel
- [ ] Profils utilisateurs complets
- [ ] Intégration LLM pour RAG amélioré
- [ ] Export PDF/BibTeX des citations
- [ ] API publique
- [ ] Application mobile native
- [ ] Système de badges et gamification
- [ ] Intégration CI/CD

## Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contact

Pour toute question ou suggestion:
- Email: contact@publiedev.ci
- GitHub Issues: [Ouvrir une issue](https://github.com/votre-repo/publiedev/issues)

---

**PublieDev** - Fait avec ❤️ en Côte d'Ivoire
