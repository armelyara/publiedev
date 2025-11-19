// Service de gestion des publications

// Créer une publication
async function createPublication(data) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Non authentifié');

        const publication = {
            ...data,
            authorId: user.uid,
            authorName: userProfile?.displayName || user.displayName || 'Anonyme',
            authorPhoto: userProfile?.photoURL || user.photoURL || '',
            views: 0,
            likes: 0,
            bookmarks: 0,
            citations: 0,
            searchKeywords: generateSearchKeywords(data),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection(COLLECTIONS.PUBLICATIONS).add(publication);
        return docRef.id;
    } catch (error) {
        console.error('Erreur création publication:', error);
        throw error;
    }
}

// Obtenir une publication par ID
async function getPublication(id) {
    try {
        const doc = await db.collection(COLLECTIONS.PUBLICATIONS).doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Erreur getPublication:', error);
        return null;
    }
}

// Obtenir une publication par slug
async function getPublicationBySlug(slug) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('slug', '==', slug)
            .where('status', '==', 'approved')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Erreur getPublicationBySlug:', error);
        return null;
    }
}

// Obtenir les publications récentes
async function getRecentPublications(limit = 6) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .orderBy('publishedAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur getRecentPublications:', error);
        return [];
    }
}

// Obtenir les publications tendances
async function getTrendingPublications(limit = 4) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .orderBy('views', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur getTrendingPublications:', error);
        return [];
    }
}

// Obtenir les publications par type
async function getPublicationsByType(type, limit = 20) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('status', '==', 'approved')
            .where('type', '==', type)
            .orderBy('publishedAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur getPublicationsByType:', error);
        return [];
    }
}

// Obtenir les publications d'un utilisateur
async function getUserPublications(userId, limit = 20) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PUBLICATIONS)
            .where('authorId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur getUserPublications:', error);
        return [];
    }
}

// Mettre à jour une publication
async function updatePublication(id, data) {
    try {
        await db.collection(COLLECTIONS.PUBLICATIONS).doc(id).update({
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Erreur updatePublication:', error);
        throw error;
    }
}

// Supprimer une publication
async function deletePublication(id) {
    try {
        await db.collection(COLLECTIONS.PUBLICATIONS).doc(id).delete();
    } catch (error) {
        console.error('Erreur deletePublication:', error);
        throw error;
    }
}

// Incrémenter les vues
async function incrementViews(id) {
    try {
        await db.collection(COLLECTIONS.PUBLICATIONS).doc(id).update({
            views: increment(1)
        });
    } catch (error) {
        console.error('Erreur incrementViews:', error);
    }
}

// Toggle like
async function toggleLike(id, liked) {
    try {
        await db.collection(COLLECTIONS.PUBLICATIONS).doc(id).update({
            likes: increment(liked ? 1 : -1)
        });
    } catch (error) {
        console.error('Erreur toggleLike:', error);
    }
}

// Générer les mots-clés pour la recherche
function generateSearchKeywords(data) {
    const text = [
        data.title || '',
        data.description || '',
        data.abstract || '',
        ...(data.tags || []),
        ...(data.technologies || []),
        ...(data.categories || [])
    ].join(' ').toLowerCase();

    const words = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

    const keywords = new Set();
    words.forEach(word => {
        keywords.add(word);
        // Ajouter les préfixes pour la recherche partielle
        for (let i = 3; i <= Math.min(word.length, 8); i++) {
            keywords.add(word.substring(0, i));
        }
    });

    return Array.from(keywords);
}

// Générer un slug
function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
