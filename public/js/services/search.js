// Service de recherche et RAG

// Recherche de publications
async function searchPublications(query, options = {}) {
    try {
        const { type, category, sortBy = 'relevance', limit = 20 } = options;

        const keywords = query.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .split(/\s+/)
            .filter(k => k.length > 2);

        if (keywords.length === 0 && !category) {
            return [];
        }

        let queryRef = db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved');

        // Hard Filter: Category (Filtre Dur)
        if (category) {
            queryRef = queryRef.where('category', '==', category);
        }

        // Type filter
        if (type) {
            queryRef = queryRef.where('type', '==', type);
        }

        // Get all matching documents
        let snapshot;
        if (keywords.length > 0) {
            queryRef = queryRef.where('searchKeywords', 'array-contains-any', keywords);
            snapshot = await queryRef.limit(limit * 2).get();
        } else {
            // Category-only filter
            snapshot = await queryRef.limit(limit).get();
        }

        let results = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };

            // Calculer le score de pertinence (TF-IDF inspired)
            let score = 0;
            const queryLower = query.toLowerCase();

            // Title match: +10 points
            if (data.title && data.title.toLowerCase().includes(queryLower)) score += 10;

            // Description match: +5 points
            if (data.description && data.description.toLowerCase().includes(queryLower)) score += 5;

            // Tags match: +15 points (5x multiplier - was +3, now +15)
            if (data.tags && data.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 15;

            // Exact tag match: +25 points (extra boost for exact matches)
            if (data.tags && data.tags.some(tag => tag.toLowerCase() === queryLower)) score += 25;

            // Category match: +8 points
            if (data.category && data.category.toLowerCase().includes(queryLower)) score += 8;

            // Engagement metrics (logarithmic scale)
            score += Math.log10((data.views || 0) + 1);
            score += Math.log10((data.likes || 0) + 1) * 2;

            return { ...data, score };
        });

        // Trier selon l'option choisie
        switch (sortBy) {
            case 'date':
                results.sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0));
                break;
            case 'views':
                results.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'likes':
                results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            default: // relevance
                results.sort((a, b) => b.score - a.score);
        }

        return results.slice(0, limit);
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
