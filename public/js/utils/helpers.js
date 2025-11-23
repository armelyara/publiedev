// Utilitaires

// Formater une date relative
function formatRelativeDate(timestamp) {
    if (!timestamp) return 'Récemment';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: days > 365 ? 'numeric' : undefined
    });
}

// Formater une date complète
function formatDate(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Formater un nombre
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Tronquer un texte
function truncate(text, length = 100) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
}

// Échapper le HTML (utiliser Security.escapeHtml si disponible)
function escapeHtml(text) {
    if (window.Security && window.Security.escapeHtml) {
        return window.Security.escapeHtml(text);
    }
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Échapper les attributs
function escapeAttr(text) {
    if (window.Security && window.Security.escapeAttr) {
        return window.Security.escapeAttr(text);
    }
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
    if (window.Security && window.Security.sanitizeUrl) {
        return window.Security.sanitizeUrl(url);
    }
    if (!url) return '';
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        return parsed.href;
    } catch {
        return '';
    }
}

// Créer une carte de publication HTML
function createPublicationCard(publication) {
    const typeLabels = APP_CONFIG.typeLabels;
    const date = formatRelativeDate(publication.publishedAt);

    // Construire l'URL de la publication (utiliser slug si disponible, sinon id)
    const safeSlug = escapeAttr(publication.slug || '').replace(/[^a-z0-9-]/g, '');
    const publicationUrl = safeSlug
        ? `/pages/publication.html?slug=${safeSlug}`
        : `/pages/publication.html?id=${escapeAttr(publication.id || '')}`;

    // Sécuriser les URLs
    const safeCoverImage = sanitizeUrl(publication.coverImage);
    const safeAuthorPhoto = sanitizeUrl(publication.authorPhoto);

    return `
        <article class="publication-card">
            ${safeCoverImage ? `
                <a href="${publicationUrl}">
                    <img src="${escapeAttr(safeCoverImage)}" alt="${escapeAttr(publication.title)}" loading="lazy">
                </a>
            ` : ''}
            <div class="publication-card-content">
                <div class="publication-card-header">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="publication-type ${escapeAttr(publication.type)}">
                            ${escapeHtml(typeLabels[publication.type] || publication.type)}
                        </span>
                        ${publication.certificate?.pdid ? `
                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--bluesky-600); font-weight: 600;" title="Certificat disponible">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                        </span>
                        ` : ''}
                    </div>
                    <span class="publication-date">${escapeHtml(date)}</span>
                </div>
                <a href="${publicationUrl}">
                    <h3>${escapeHtml(publication.title)}</h3>
                </a>
                <p>${escapeHtml(truncate(publication.description, 120))}</p>
                ${publication.technologies && publication.technologies.length > 0 ? `
                    <div class="publication-tags">
                        ${publication.technologies.slice(0, 3).map(tech =>
                            `<span>${escapeHtml(tech)}</span>`
                        ).join('')}
                        ${publication.technologies.length > 3 ?
                            `<span>+${publication.technologies.length - 3}</span>` : ''
                        }
                    </div>
                ` : ''}
                <div class="publication-card-footer">
                    <div class="publication-author">
                        <div class="publication-author-avatar">
                            ${safeAuthorPhoto ?
                                `<img src="${escapeAttr(safeAuthorPhoto)}" alt="" loading="lazy">` :
                                escapeHtml(publication.authorName?.charAt(0) || '?')
                            }
                        </div>
                        <span>${escapeHtml(publication.authorName || 'Anonyme')}</span>
                    </div>
                    <div class="publication-stats">
                        <span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            ${formatNumber(publication.views || 0)}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// Créer un état vide HTML
function createEmptyState(title, message, actionText, actionUrl) {
    return `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            ${actionText && actionUrl ? `
                <a href="${actionUrl}" class="btn btn-primary">${escapeHtml(actionText)}</a>
            ` : ''}
        </div>
    `;
}

// Obtenir les paramètres URL
function getUrlParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

// Mettre à jour l'URL sans recharger
function updateUrl(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Afficher un message toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#0ea5e9'};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
