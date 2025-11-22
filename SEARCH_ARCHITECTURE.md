# PublieDev - Architecture de Recherche

## 📋 Vue d'ensemble

PublieDev utilise actuellement **Option B: Custom JS Search** avec Firestore + TF-IDF manuel côté client.

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
**Fichier:** `public/js/services/search.js`

#### Étape A: Hard Filter (SQL WHERE)
```javascript
let queryRef = db.collection(COLLECTIONS.PUBLICATIONS)
    .where('status', '==', 'approved');

// Hard Filter sur catégorie (pas de scoring)
if (category) {
    queryRef = queryRef.where('category', '==', category);
}

// Filter sur type
if (type) {
    queryRef = queryRef.where('type', '==', type);
}

// Recherche textuelle
if (keywords.length > 0) {
    queryRef = queryRef.where('searchKeywords', 'array-contains-any', keywords);
}
```

#### Étape B: TF-IDF Scoring Manuel
```javascript
let score = 0;

// Exact tag match: +25 points (boost maximum)
if (data.tags && data.tags.some(tag => tag.toLowerCase() === queryLower))
    score += 25;

// Tags contains query: +15 points (5x multiplier)
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

#### Étape C: Tri et Affichage
```javascript
results.sort((a, b) => b.score - a.score);
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

### Option B: Custom JS (ACTUEL ✓)
**Fichiers:** `public/js/services/search.js`

✅ **Avantages:**
- Gratuit
- Contrôle total du scoring
- Simple à debugger
- Pas de dépendance externe

❌ **Inconvénients:**
- Pas de typo-tolerance
- Moins performant pour gros volumes
- Pas de synonymes

**Parfait pour:**
- MVP et lancement
- Budget limité
- < 10,000 publications

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

## 📁 Structure des Fichiers

```
publiedev/
├── functions/
│   └── index.js                    # Firebase Functions (Algolia - FUTURE USE)
│
├── public/
│   ├── pages/
│   │   ├── publish.html            # Formulaire de soumission (catégorie + tags)
│   │   └── search.html             # Page de recherche (avec filtres catégorie)
│   │
│   └── js/
│       └── services/
│           └── search.js           # Logique TF-IDF manuel (CURRENT)
│
└── SEARCH_ARCHITECTURE.md          # Ce fichier
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
