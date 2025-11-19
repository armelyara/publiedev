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
- Recherche full-text avec mots-clés
- Filtrage par type, catégorie, technologies
- Système d'indexation automatique
- Tri par pertinence, date, popularité

### RAG (Retrieval Augmented Generation)
- Système de questions-réponses intelligent
- Extraction de contexte pertinent
- Réponses basées sur les publications indexées

### PWA
- Installation sur mobile et desktop
- Fonctionnement hors-ligne
- Performance optimisée

## Technologies

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Styling**: CSS personnalisé (couleur principale: Bluesky #0ea5e9)
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **PWA**: Service Worker + Manifest

## Structure du projet

```
publiedev/
├── index.html              # Page d'accueil
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   └── style.css          # Styles principaux
├── js/
│   ├── config.js          # Configuration Firebase
│   ├── app.js             # Application principale
│   ├── services/
│   │   ├── firebase.js    # Initialisation Firebase
│   │   ├── auth.js        # Authentification
│   │   ├── publications.js # CRUD publications
│   │   └── search.js      # Recherche et RAG
│   └── utils/
│       └── helpers.js     # Utilitaires
├── pages/
│   ├── login.html         # Page de connexion
│   ├── explore.html       # Explorer les publications
│   ├── search.html        # Résultats de recherche
│   └── publish.html       # Créer une publication
├── assets/
│   └── icons/             # Icônes PWA
├── firebase.json          # Configuration Firebase Hosting
├── firestore.rules        # Règles Firestore
└── storage.rules          # Règles Storage
```

## Installation

### Prérequis
- Un compte Firebase
- Un serveur web local (optionnel)

### Configuration

1. **Cloner le projet**
```bash
git clone https://github.com/votre-repo/publiedev.git
cd publiedev
```

2. **Configurer Firebase**

Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com) et activez:
- Authentication (Email/Password, Google, GitHub)
- Firestore Database
- Storage
- Hosting

3. **Configurer les clés Firebase**

Éditez le fichier `js/config.js` avec vos clés Firebase:

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

4. **Configurer les règles Firestore**

Déployez les règles via CLI:

```bash
firebase deploy --only firestore:rules
```

### Développement local

Option 1 - Avec npm:
```bash
npm install
npm start
```

Option 2 - Avec Python:
```bash
python -m http.server 8000
```

Option 3 - Avec PHP:
```bash
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000`

### Déploiement sur Firebase

```bash
# Installation Firebase CLI
npm install -g firebase-tools

# Connexion
firebase login

# Initialisation (choisir Hosting, définir "." comme dossier public)
firebase init hosting

# Déploiement
firebase deploy --only hosting
```

## Fonctionnalités détaillées

### Système de publication

Les utilisateurs peuvent publier différents types de contenu avec:
- Titre et description
- Contenu détaillé
- Technologies utilisées
- Tags et catégories
- Liens (GitHub, démo)
- Image de couverture

### Système de recherche

- Recherche par mots-clés dans titre, description, tags
- Filtres par type de publication
- Tri par pertinence, date, vues, likes
- Score de pertinence calculé automatiquement

### Système RAG

Le système RAG permet de poser des questions et obtenir des réponses:
1. **Retrieval** - Récupération des documents pertinents
2. **Scoring** - Calcul de la pertinence
3. **Response** - Génération de la réponse basée sur les sources

### Authentification

- Email/Mot de passe
- Google OAuth
- GitHub OAuth

## Personnalisation

### Couleurs

Les couleurs sont définies dans `css/style.css`:

```css
:root {
    --bluesky-500: #0ea5e9;  /* Couleur principale */
    --bluesky-600: #0284c7;  /* Hover */
    /* ... */
}
```

## Contribution

Les contributions sont les bienvenues!

1. Fork le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Roadmap

- [ ] Page de profil utilisateur
- [ ] Système de commentaires
- [ ] Notifications
- [ ] Export des citations
- [ ] API publique
- [ ] Système de badges
- [ ] Mode sombre

## Licence

MIT License

## Contact

Pour toute question ou suggestion:
- GitHub Issues: [Ouvrir une issue](https://github.com/votre-repo/publiedev/issues)

---

**PublieDev** - Fait avec ❤️ en Côte d'Ivoire
