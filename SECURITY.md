# Guide de Sécurité - PublieDev

## Mesures de Sécurité Implémentées

### 1. Protection contre les Attaques XSS (Cross-Site Scripting)

#### Fonctions de sanitisation (`js/utils/security.js`)
- `escapeHtml()` - Échappe les caractères HTML dangereux
- `escapeAttr()` - Échappe les attributs HTML
- `sanitizeUrl()` - Valide et nettoie les URLs (bloque javascript:, data:)
- `sanitizeSlug()` - Nettoie les slugs pour les URLs
- `sanitizeHtml()` - Supprime les scripts et événements du HTML

#### Utilisation
```javascript
// Toujours échapper les données utilisateur avant affichage
const safeTitle = Security.escapeHtml(userInput);
const safeUrl = Security.sanitizeUrl(userUrl);
```

### 2. Règles de Sécurité Firestore

Les règles Firestore (`firestore.rules`) implémentent :

- **Validation des champs** : Longueur, type, format
- **Authentification** : Vérification de l'utilisateur connecté
- **Autorisation** : Seul l'auteur peut modifier ses publications
- **Validation des URLs** : Format https:// uniquement
- **Limites** : Maximum de tags, technologies, etc.

#### Exemple de validation
```javascript
function isValidString(field, minLen, maxLen) {
  return field is string && field.size() >= minLen && field.size() <= maxLen;
}
```

### 3. Règles de Sécurité Storage

Les règles Storage (`storage.rules`) implémentent :

- **Types de fichiers** : Uniquement JPEG, PNG, GIF, WebP
- **Taille maximale** : 2MB pour profils, 5MB pour publications
- **Validation d'extension** : Correspondance entre extension et type MIME
- **Isolation** : Les utilisateurs ne peuvent accéder qu'à leurs propres fichiers temp

### 4. Headers de Sécurité HTTP

Configurés dans `firebase.json` :

| Header | Description |
|--------|-------------|
| `X-Content-Type-Options: nosniff` | Empêche le MIME-sniffing |
| `X-Frame-Options: SAMEORIGIN` | Protection contre le clickjacking |
| `X-XSS-Protection: 1; mode=block` | Protection XSS navigateur |
| `Referrer-Policy` | Contrôle des informations de référence |
| `Permissions-Policy` | Désactive géolocalisation, micro, caméra |
| `Content-Security-Policy` | Contrôle strict des sources de contenu |

### 5. Protection de l'Authentification

#### Rate Limiting (côté client)
```javascript
// Maximum 5 tentatives de connexion par minute
if (!Security.checkRateLimit('login', 5, 60000)) {
    // Bloquer la tentative
}
```

#### Validation des entrées
- Validation email côté client et serveur
- Validation mot de passe (min 8 caractères, lettres + chiffres)

#### Logging de sécurité
```javascript
Security.logSecurityEvent('login_failed', { email, error: error.code });
```

### 6. Protection CSRF

```javascript
// Générer un token
const token = Security.setCsrfToken();

// Vérifier le token
if (!Security.verifyCsrfToken(submittedToken)) {
    // Rejeter la requête
}
```

### 7. Validation des Publications

Toutes les publications sont validées avec `Security.validatePublication()` :

- Titre : 3-200 caractères
- Description : 10-1000 caractères
- Contenu : 10-50000 caractères
- Type : app, api, program, tutorial, article uniquement
- URLs : Format valide uniquement
- Tags : Maximum 10
- Technologies : Maximum 20

### 8. Détection de Contenu Malveillant

```javascript
if (Security.containsMaliciousContent(content)) {
    // Rejeter le contenu
}
```

Détecte :
- Balises `<script>`
- Protocoles `javascript:`
- Événements inline (onclick, onerror, etc.)
- Iframes, objects, embeds

## Bonnes Pratiques pour les Développeurs

### À FAIRE

1. **Toujours échapper les données utilisateur**
   ```javascript
   element.innerHTML = Security.escapeHtml(userData);
   ```

2. **Valider toutes les URLs**
   ```javascript
   const safeUrl = Security.sanitizeUrl(userUrl);
   if (!safeUrl) {
       // URL invalide ou dangereuse
   }
   ```

3. **Utiliser les fonctions de validation**
   ```javascript
   if (!Security.isValidEmail(email)) {
       // Email invalide
   }
   ```

4. **Implémenter le rate limiting pour les actions sensibles**
   ```javascript
   if (!Security.checkRateLimit('action_name', maxAttempts, windowMs)) {
       // Trop de tentatives
   }
   ```

5. **Logger les événements de sécurité**
   ```javascript
   Security.logSecurityEvent('suspicious_activity', { details });
   ```

### À NE PAS FAIRE

1. **Ne jamais utiliser innerHTML avec des données non échappées**
   ```javascript
   // DANGEREUX
   element.innerHTML = userData;

   // SÉCURISÉ
   element.innerHTML = Security.escapeHtml(userData);
   ```

2. **Ne jamais construire des URLs sans validation**
   ```javascript
   // DANGEREUX
   window.location.href = userInput;

   // SÉCURISÉ
   const safeUrl = Security.sanitizeUrl(userInput);
   if (safeUrl) window.location.href = safeUrl;
   ```

3. **Ne jamais faire confiance aux données côté client**
   - Toujours valider côté serveur (règles Firestore/Storage)
   - La validation côté client est pour l'UX uniquement

## Tests de Sécurité Recommandés

### Tests Manuels

1. **Test XSS** : Essayer d'injecter `<script>alert('XSS')</script>` dans les champs
2. **Test CSRF** : Vérifier que les actions sensibles nécessitent un token
3. **Test d'autorisation** : Essayer de modifier les publications d'autres utilisateurs
4. **Test de rate limiting** : Faire plus de 5 tentatives de connexion en 1 minute

### Outils Recommandés

- [OWASP ZAP](https://www.zaproxy.org/) - Scanner de vulnérabilités
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit de sécurité
- [Security Headers](https://securityheaders.com/) - Test des headers HTTP

## Signalement de Vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, veuillez :

1. Ne pas la divulguer publiquement
2. Contacter l'équipe de développement en privé
3. Fournir des détails pour reproduire le problème

## Mises à Jour de Sécurité

- Mettre à jour régulièrement le SDK Firebase
- Surveiller les CVE liées aux dépendances
- Revoir les règles de sécurité périodiquement

## Ressources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
