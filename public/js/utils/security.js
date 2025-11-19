// Utilitaires de sécurité

// ===== Sanitization =====

// Échapper le HTML pour prévenir les XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Échapper les attributs HTML
function escapeAttr(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Valider et nettoyer une URL
function sanitizeUrl(url) {
    if (!url) return '';

    try {
        const parsed = new URL(url);
        // Autoriser uniquement http et https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        // Bloquer les URLs potentiellement dangereuses
        if (parsed.hostname.includes('javascript:') ||
            parsed.href.toLowerCase().includes('javascript:')) {
            return '';
        }
        return parsed.href;
    } catch {
        return '';
    }
}

// Nettoyer un slug
function sanitizeSlug(slug) {
    if (!slug) return '';
    return String(slug)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 250);
}

// ===== Validation =====

// Valider une adresse email
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Valider une URL
function isValidUrl(url) {
    if (!url) return true; // URLs optionnelles
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Valider la longueur d'une chaîne
function isValidLength(str, min, max) {
    if (!str) return min === 0;
    const len = String(str).length;
    return len >= min && len <= max;
}

// Valider un mot de passe (min 8 chars, lettres et chiffres)
function isValidPassword(password) {
    if (!password || password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
}

// Valider un nom d'utilisateur
function isValidUsername(username) {
    if (!username) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
}

// ===== Validation des publications =====

function validatePublication(data) {
    const errors = [];

    // Titre
    if (!data.title || !isValidLength(data.title, 3, 200)) {
        errors.push('Le titre doit contenir entre 3 et 200 caractères');
    }

    // Description
    if (!data.description || !isValidLength(data.description, 10, 1000)) {
        errors.push('La description doit contenir entre 10 et 1000 caractères');
    }

    // Contenu
    if (!data.content || !isValidLength(data.content, 10, 50000)) {
        errors.push('Le contenu doit contenir entre 10 et 50000 caractères');
    }

    // Type
    const validTypes = ['article', 'app-mobile', 'app-web', 'api'];
    if (!validTypes.includes(data.type)) {
        errors.push('Type de publication invalide');
    }

    // URLs optionnelles
    if (data.githubUrl && !isValidUrl(data.githubUrl)) {
        errors.push('URL GitHub invalide');
    }
    if (data.demoUrl && !isValidUrl(data.demoUrl)) {
        errors.push('URL de démo invalide');
    }
    if (data.coverImage && !isValidUrl(data.coverImage)) {
        errors.push('URL d\'image invalide');
    }

    // Tags et technologies
    if (data.tags && data.tags.length > 10) {
        errors.push('Maximum 10 tags autorisés');
    }
    if (data.technologies && data.technologies.length > 20) {
        errors.push('Maximum 20 technologies autorisées');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ===== Protection CSRF =====

// Générer un token CSRF
function generateCsrfToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Stocker le token CSRF
function setCsrfToken() {
    const token = generateCsrfToken();
    sessionStorage.setItem('csrf_token', token);
    return token;
}

// Vérifier le token CSRF
function verifyCsrfToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken && storedToken === token;
}

// ===== Rate Limiting (côté client) =====

const rateLimitStore = new Map();

function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const key = action;

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, firstAttempt: now });
        return true;
    }

    const record = rateLimitStore.get(key);

    if (now - record.firstAttempt > windowMs) {
        // Reset window
        rateLimitStore.set(key, { count: 1, firstAttempt: now });
        return true;
    }

    if (record.count >= maxAttempts) {
        return false;
    }

    record.count++;
    return true;
}

// ===== Content Security =====

// Vérifier si le contenu contient des scripts malveillants
function containsMaliciousContent(content) {
    if (!content) return false;

    const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // onclick, onerror, etc.
        /data:text\/html/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<form\s+action/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
}

// Nettoyer le contenu HTML (version basique)
function sanitizeHtml(html) {
    if (!html) return '';

    // Supprimer les scripts et événements
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '');
}

// ===== Logging de sécurité =====

function logSecurityEvent(event, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    // En production, envoyer à un service de logging
    console.warn('[SECURITY]', logEntry);

    // Optionnel: envoyer à Firebase Analytics
    if (typeof gtag === 'function') {
        gtag('event', 'security_event', {
            event_category: 'security',
            event_label: event
        });
    }
}

// Export pour utilisation globale
window.Security = {
    escapeHtml,
    escapeAttr,
    sanitizeUrl,
    sanitizeSlug,
    sanitizeHtml,
    isValidEmail,
    isValidUrl,
    isValidLength,
    isValidPassword,
    isValidUsername,
    validatePublication,
    setCsrfToken,
    verifyCsrfToken,
    checkRateLimit,
    containsMaliciousContent,
    logSecurityEvent
};
