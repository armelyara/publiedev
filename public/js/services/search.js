// Service de recherche et RAG
//
// ============================================================================
// SECURE SERVER-SIDE SEARCH (SECRET SAUCE PROTECTED 🔒)
// ============================================================================
//
// La logique de scoring TF-IDF est maintenant côté serveur (Firebase Functions)
// pour protéger l'algorithme propriétaire.
//
// WORKFLOW:
// 1. Client envoie query + filters → Firebase Function
// 2. Server calcule les scores (SECRET SAUCE 🔒)
// 3. Server retourne les résultats triés (sans exposer les scores)
//
// AVANTAGES:
// - Algorithme secret (pas visible sur GitHub)
// - Pas de reverse engineering possible
// - Contrôle total côté serveur
// - Peut être modifié sans redéployer le frontend
//
// ============================================================================

// Get Firebase Functions URL from config
const FUNCTIONS_URL = window.FIREBASE_CONFIG?.functionsUrl ||
    'https://us-central1-publiedev-ci.cloudfunctions.net';

// Recherche de publications (via Firebase Function)
async function searchPublications(query, options = {}) {
    try {
        const {type, category, sortBy = 'relevance', limit = 20} = options;

        // Build query parameters
        const params = new URLSearchParams({
            q: query || '',
            sortBy,
            limit: limit.toString(),
        });

        if (category) params.append('category', category);
        if (type) params.append('type', type);

        // Call server-side search function
        const response = await fetch(
            `${FUNCTIONS_URL}/searchPublications?${params.toString()}`,
        );

        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Search failed');
        }

        return data.results || [];
    } catch (error) {
        console.error('Erreur searchPublications:', error);
        return [];
    }
}

// Obtenir des suggestions d'autocomplétion
async function getSuggestions(prefix, maxResults = 5) {
    if (prefix.length < 2) return [];

    try {
        const prefixLower = prefix.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .where('searchKeywords', 'array-contains', prefixLower)
            .limit(maxResults * 3)
            .get();

        const suggestions = new Set();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.title && data.title.toLowerCase().includes(prefixLower)) {
                suggestions.add(data.title);
            }
            if (data.tags) {
                data.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(prefixLower)) {
                        suggestions.add(tag);
                    }
                });
            }
        });

        return Array.from(suggestions).slice(0, maxResults);
    } catch (error) {
        console.error('Erreur getSuggestions:', error);
        return [];
    }
}

// Obtenir des publications similaires
async function getRelatedPublications(publication, maxResults = 3) {
    if (!publication.tags || publication.tags.length === 0) {
        return [];
    }

    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .where('tags', 'array-contains-any', publication.tags.slice(0, 3))
            .limit(maxResults + 1)
            .get();

        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(pub => pub.id !== publication.id)
            .slice(0, maxResults);
    } catch (error) {
        console.error('Erreur getRelatedPublications:', error);
        return [];
    }
}

// RAG - Retrieval Augmented Generation
async function ragQuery(query, options = {}) {
    try {
        const { type, limit = 10 } = options;

        // Rechercher les documents pertinents
        const publications = await searchPublications(query, { type, limit });

        if (publications.length === 0) {
            return {
                answer: 'Aucun résultat trouvé pour votre recherche. Essayez avec d\'autres termes.',
                sources: [],
                confidence: 0
            };
        }

        // Extraire les chunks de contenu
        const chunks = publications.map(pub => ({
            id: pub.id,
            title: pub.title,
            content: pub.description + '\n\n' + (pub.content || '').substring(0, 500),
            score: pub.score
        }));

        // Générer une réponse basée sur les sources
        const primarySource = publications[0];
        let answer = `Basé sur les ressources disponibles, voici ce que j'ai trouvé concernant "${query}":\n\n`;
        answer += `**${primarySource.title}**\n${primarySource.description}\n\n`;

        if (publications.length > 1) {
            answer += `Autres ressources pertinentes:\n`;
            publications.slice(1, 4).forEach(pub => {
                answer += `- ${pub.title}\n`;
            });
        }

        answer += `\nPour plus de détails, consultez les sources ci-dessous.`;

        const confidence = Math.min(chunks[0]?.score / 10 || 0, 1);

        return {
            answer,
            sources: publications.slice(0, 5),
            confidence
        };
    } catch (error) {
        console.error('Erreur ragQuery:', error);
        return {
            answer: 'Une erreur est survenue lors de la recherche.',
            sources: [],
            confidence: 0
        };
    }
}

// Obtenir les sujets populaires
async function getPopularTopics(limit = 10) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .orderBy('views', 'desc')
            .limit(50)
            .get();

        const tagCounts = new Map();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.tags) {
                data.tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            }
        });

        return Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag]) => tag);
    } catch (error) {
        console.error('Erreur getPopularTopics:', error);
        return [];
    }
}
