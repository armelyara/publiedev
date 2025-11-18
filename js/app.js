// Application principale PublieDev

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialisation de l'application
function initApp() {
    // Menu mobile
    initMobileMenu();

    // Formulaires de recherche
    initSearchForms();

    // Charger le contenu de la page d'accueil
    if (document.getElementById('trendingPublications')) {
        loadHomeContent();
    }
}

// Initialiser le menu mobile
function initMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');

            // Changer l'icône
            const isOpen = mobileMenu.classList.contains('active');
            menuBtn.innerHTML = isOpen ? `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            ` : `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
        });
    }
}

// Initialiser les formulaires de recherche
function initSearchForms() {
    const forms = [
        { form: 'searchForm', input: 'searchInput' },
        { form: 'mobileSearchForm', input: 'mobileSearchInput' },
        { form: 'heroSearchForm', input: 'heroSearchInput' }
    ];

    forms.forEach(({ form, input }) => {
        const formEl = document.getElementById(form);
        const inputEl = document.getElementById(input);

        if (formEl && inputEl) {
            formEl.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = inputEl.value.trim();
                if (query) {
                    window.location.href = `/pages/search.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
    });
}

// Charger le contenu de la page d'accueil
async function loadHomeContent() {
    await Promise.all([
        loadTrendingPublications(),
        loadRecentPublications()
    ]);
}

// Charger les publications tendances
async function loadTrendingPublications() {
    const container = document.getElementById('trendingPublications');
    if (!container) return;

    try {
        const publications = await getTrendingPublications(4);

        if (publications.length === 0) {
            container.innerHTML = createEmptyState(
                'Aucune publication',
                'Soyez le premier à partager votre projet!',
                'Publier maintenant',
                '/pages/publish.html'
            );
            return;
        }

        container.innerHTML = publications.map(pub => createPublicationCard(pub)).join('');
    } catch (error) {
        console.error('Erreur chargement tendances:', error);
        container.innerHTML = '<p class="loading">Erreur de chargement</p>';
    }
}

// Charger les publications récentes
async function loadRecentPublications() {
    const container = document.getElementById('recentPublications');
    if (!container) return;

    try {
        const publications = await getRecentPublications(6);

        if (publications.length === 0) {
            container.innerHTML = createEmptyState(
                'Aucune publication récente',
                'Les publications apparaîtront ici.',
                'Explorer',
                '/pages/explore.html'
            );
            return;
        }

        container.innerHTML = publications.map(pub => createPublicationCard(pub)).join('');
    } catch (error) {
        console.error('Erreur chargement récentes:', error);
        container.innerHTML = '<p class="loading">Erreur de chargement</p>';
    }
}

// Gestion de l'installation PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Afficher un bouton d'installation personnalisé si souhaité
    console.log('PWA peut être installée');
});

// Partager une publication
async function sharePublication(title, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                url: url
            });
        } catch (error) {
            console.log('Erreur partage:', error);
        }
    } else {
        // Fallback: copier le lien
        await navigator.clipboard.writeText(url);
        showToast('Lien copié!', 'success');
    }
}

console.log('PublieDev initialisé');
