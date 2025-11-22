# PublieDev - Architecture de Recherche

## 📋 Vue d'ensemble

PublieDev utilise **Option B: Server-Side Custom Search** avec Firestore + TF-IDF côté serveur.

**🔒 SÉCURITÉ:** L'algorithme de scoring est désormais **côté serveur** (Firebase Functions) pour protéger la sauce secrète. Le code client ne contient AUCUNE logique de scoring.

Les Firebase Functions pour Algolia sont **préparées mais non utilisées** - elles sont prêtes pour une future migration vers Option A si nécessaire.

---

## 🎯 Workflow Actuel (Option B)

### 1. Soumission par l'utilisateur
**Fichier:** `public/pages/publish.html`

L'utilisateur remplit le formulaire avec:
- **Titre** (obligatoire)
- **Description** (obligatoire)
- **Catégorie** (obligatoire) - Dropdown avec 10 catégories officielles
- **Tags** (3 à 8 tags techniques obligatoires)

Le JavaScript génère automatiquement:
```javascript
searchKeywords = generateKeywords(title + description + category + tags)
```

Les données sont sauvegardées dans Firestore `publications` avec `status: "pending"`.

---

### 2. Approbation Admin
L'admin change le statut de `"pending"` à `"approved"`.

**Note:** Les Firebase Functions Algolia se déclenchent ici, MAIS ne sont pas utilisées actuellement. Elles sont prêtes pour une future migration.

---

### 3. Recherche par l'utilisateur

#### 🔒 Workflow Sécurisé (Client → Server)

**Client Side** (`public/js/services/search.js`):
```javascript
// Simple API call - NO scoring logic exposed
const params = new URLSearchParams({
    q: query,
    category: category,
    type: type,
    sortBy: sortBy,
    limit: 20
});

const response = await fetch(`${FUNCTIONS_URL}/searchPublications?${params}`);
const data = await response.json();
return data.results; // Already sorted by server
```

**Server Side** (`functions/index.js` - SECRET SAUCE 🔒):

##### Étape A: Hard Filter (SQL WHERE)
```javascript
let queryRef = db.collection('publications')
    .where('status', '==', 'approved');

// Hard Filter sur catégorie
if (category) {
    queryRef = queryRef.where('category', '==', category);
}

// Hard Filter sur type
if (type) {
    queryRef = queryRef.where('type', '==', type);
}
```

##### Étape B: TF-IDF Scoring (HIDDEN FROM CLIENT 🔒)
```javascript
// ⚠️ This logic is ONLY in functions/index.js (not visible on GitHub frontend)

let score = 0;

// Exact tag match: +25 points
if (data.tags && data.tags.some(tag => tag.toLowerCase() === queryLower))
    score += 25;

// Tags contains: +15 points (5x multiplier)
if (data.tags && data.tags.some(tag => tag.toLowerCase().includes(queryLower)))
    score += 15;

// Title match: +10 points
if (data.title && data.title.toLowerCase().includes(queryLower))
    score += 10;

// Category match: +8 points
if (data.category && data.category.toLowerCase().includes(queryLower))
    score += 8;

// Description match: +5 points
if (data.description && data.description.toLowerCase().includes(queryLower))
    score += 5;

// Engagement metrics (logarithmic)
score += Math.log10((data.views || 0) + 1);
score += Math.log10((data.likes || 0) + 1) * 2;
```

##### Étape C: Tri et Nettoyage (SECURITY)
```javascript
// Sort by score
results.sort((a, b) => b.score - a.score);

// Remove score from response (keep algorithm secret)
results = results.map(r => {
    const {score, searchKeywords, ...publicData} = r;
    return publicData; // Client never sees the scores
});
```

---

## 📊 Taxonomie Officielle

### 10 Catégories Maîtres
1. **fintech** - Fintech & Mobile Money
2. **agritech** - AgriTech
3. **healthtech** - Santé & E-Santé (HealthTech)
4. **edtech** - Éducation & Formation (EdTech)
5. **ecommerce** - E-commerce & Logistique
6. **transport** - Transport & Smart City
7. **govtech** - Services Publics & Citoyenneté (GovTech)
8. **ai-data** - Intelligence Artificielle & Data
9. **devtools** - Outils Développeurs (DevTools)
10. **entertainment** - Divertissement & Culture

### Différence Catégorie vs Tags
- **Catégorie** = Secteur d'activité (ex: Fintech) → **Hard Filter (SQL)**
- **Tags** = Technologies utilisées (ex: Flutter, API Orange Money) → **Soft Scoring (TF-IDF)**

---

## ⚡ Option A vs Option B

### Option A: Algolia (PRÉPARÉE, NON UTILISÉE)
**Fichiers:** `functions/index.js` (fonctions commentées comme "FUTURE USE")

✅ **Avantages:**
- Typo-tolerance automatique
- Synonymes
- Ultra-rapide (<10ms)
- Scalabilité illimitée

❌ **Inconvénients:**
- Coûts récurrents
- Dépendance à un service externe
- Configuration dashboard nécessaire

**Quand migrer:**
- Volume > 10,000 publications
- Besoin de typo-tolerance
- Budget disponible

### Option B: Server-Side Custom Search (ACTUEL ✓)
**Fichiers:**
- `functions/index.js` (Server-side - SECRET SAUCE 🔒)
- `public/js/services/search.js` (Client-side - Simple API caller)

✅ **Avantages:**
- **Gratuit** (pas de coûts Algolia)
- **Sécurisé** - Algorithme secret côté serveur
- **Contrôle total** du scoring
- **Impossible à reverse-engineer** (code non visible sur GitHub frontend)
- **Flexible** - Peut modifier l'algo sans redéployer le frontend

❌ **Inconvénients:**
- Pas de typo-tolerance (pour l'instant)
- Moins performant qu'Algolia pour gros volumes (>10k)
- Pas de synonymes automatiques

**Parfait pour:**
- MVP et lancement
- Budget limité
- < 10,000 publications
- **Protection de la propriété intellectuelle**

---

## 🔄 Comment migrer vers Algolia (Option A)

### 1. Activer les Firebase Functions
Les fonctions sont déjà écrites dans `functions/index.js`. Il suffit de:
- Vérifier que les exports sont actifs
- Déployer: `firebase deploy --only functions`

### 2. Configurer Algolia Dashboard
```
SearchableAttributes (ordre de priorité):
  1. tags (poids: 5)
  2. title (poids: 3)
  3. description (poids: 1)

CustomRanking:
  1. desc(likes)
  2. desc(views)
  3. desc(createdAt)

Facets:
  - category (filtrable)
  - type (filtrable)
```

### 3. Réécrire search.js
```javascript
// Remplacer searchPublications() par:
const index = algoliasearch(APP_ID, SEARCH_KEY).initIndex('publications');

async function searchPublications(query, options = {}) {
    const { category, type } = options;

    let filters = '';
    if (category) filters += `category:${category}`;
    if (type) filters += ` AND type:${type}`;

    return await index.search(query, { filters });
}
```

### 4. Réindexer les données existantes
```bash
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/reindexAllPublications
```

---

## 🔒 Sécurité - Protection de la Sauce Secrète

### Principe de Sécurité
L'algorithme de scoring (+25, +15, +10, +8, +5) est **votre avantage concurrentiel**. Il ne doit JAMAIS être visible publiquement.

### Architecture Sécurisée

**❌ AVANT (Client-Side - DANGEREUX):**
```
Frontend (GitHub public) → Contient TOUT le code de scoring
                          → N'importe qui peut voir les coefficients
                          → Facile à copier
```

**✅ MAINTENANT (Server-Side - SÉCURISÉ):**
```
Frontend (GitHub public) → Simple fetch() API call
                          → AUCUNE logique de scoring

Firebase Functions      → Scoring algorithm (SECRET)
(Code privé)            → Impossible à voir depuis le navigateur
                        → Protégé par Firebase
```

### Ce qui est caché:
- Les coefficients (+25, +15, +10, +8, +5)
- La logique logarithmique pour l'engagement
- Les multiplicateurs exacts
- Le champ `searchKeywords` (supprimé des réponses)
- Les scores calculés (jamais renvoyés au client)

### Ce qui est visible:
- Les résultats finaux (triés)
- Les filtres disponibles (category, type)
- Les options de tri (relevance, date, views, likes)

### Déploiement Sécurisé

**⚠️ IMPORTANT:** Ne JAMAIS commit `functions/` sur un repo GitHub public!

Options:
1. **Git privé:** Gardez le repo privé sur GitHub
2. **Git submodule privé:** `functions/` dans un sous-module privé
3. **Déploiement direct:** `firebase deploy --only functions` depuis votre machine locale
4. **.gitignore:** Ajouter `functions/index.js` au `.gitignore` (mais garder `package.json`)

---

## 📁 Structure des Fichiers

```
publiedev/
├── functions/                       # 🔒 PRIVÉ - Ne pas publier sur GitHub
│   ├── index.js                    # SECRET SAUCE: Scoring algorithm
│   └── package.json                # Dépendances (peut être public)
│
├── public/                          # ✅ PUBLIC - Peut être sur GitHub
│   ├── pages/
│   │   ├── publish.html            # Formulaire (catégorie + tags)
│   │   └── search.html             # Page recherche (filtres)
│   │
│   └── js/
│       └── services/
│           └── search.js           # Simple API caller (PAS de scoring)
│
└── SEARCH_ARCHITECTURE.md          # Ce fichier (peut être public si générique)
```

---

## 🎓 Exemple Concret

### Recherche: "Orange Money" + Filtre: "Fintech"

#### Requête Firestore:
```javascript
db.collection('publications')
  .where('status', '==', 'approved')
  .where('category', '==', 'fintech')              // Hard Filter
  .where('searchKeywords', 'array-contains-any', ['orange', 'money'])
```

#### Scoring:
| Publication | Tags | Title | Score | Raison |
|------------|------|-------|-------|--------|
| "API Orange Money CI" | `['api-orange-money', 'mobile-money']` | "Intégration Orange Money" | **40 pts** | Exact tag (+25) + Title (+10) + Desc (+5) |
| "Paiement Mobile CI" | `['mtn-money', 'wave']` | "Solutions de paiement" | **5 pts** | Desc only (+5) |

#### Résultat:
"API Orange Money CI" apparaît en premier grâce au boost x5 sur les tags (+25 vs ancien +3).

---

## 📞 Support

Pour toute question sur l'architecture de recherche, consulter:
1. Ce fichier (`SEARCH_ARCHITECTURE.md`)
2. Commentaires dans `functions/index.js`
3. Commentaires dans `public/js/services/search.js`

---

**Dernière mise à jour:** 2025-11-21
**Architecture actuelle:** Option B (Custom JS + Firestore)
**Algolia:** Préparée mais non utilisée
