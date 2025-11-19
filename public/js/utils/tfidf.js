/**
 * TF-IDF Implementation for Related Articles
 * Lightweight client-side text similarity calculation
 */

class TFIDF {
    constructor() {
        this.documents = [];
        this.vocabulary = new Map();
        this.idf = new Map();
        this.tfidfVectors = [];
    }

    /**
     * Tokenize and normalize text
     */
    tokenize(text) {
        if (!text) return [];
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s]/g, ' ')     // Remove special chars
            .split(/\s+/)
            .filter(word => word.length > 2); // Remove short words
    }

    /**
     * Calculate term frequency for a document
     */
    termFrequency(tokens) {
        const tf = new Map();
        const totalTerms = tokens.length;

        tokens.forEach(token => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });

        // Normalize by document length
        tf.forEach((count, term) => {
            tf.set(term, count / totalTerms);
        });

        return tf;
    }

    /**
     * Add documents to the corpus
     * @param {Array} docs - Array of {id, text, metadata}
     */
    addDocuments(docs) {
        this.documents = docs;

        // Build vocabulary and document frequencies
        const docFrequency = new Map();

        docs.forEach((doc, index) => {
            const tokens = this.tokenize(doc.text);
            const uniqueTokens = new Set(tokens);

            uniqueTokens.forEach(token => {
                this.vocabulary.set(token, true);
                docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
            });
        });

        // Calculate IDF for each term
        const totalDocs = docs.length;
        docFrequency.forEach((df, term) => {
            // IDF with smoothing to avoid division by zero
            this.idf.set(term, Math.log((totalDocs + 1) / (df + 1)) + 1);
        });

        // Calculate TF-IDF vectors for all documents
        this.tfidfVectors = docs.map(doc => {
            const tokens = this.tokenize(doc.text);
            const tf = this.termFrequency(tokens);
            const vector = new Map();

            tf.forEach((tfValue, term) => {
                const idfValue = this.idf.get(term) || 0;
                vector.set(term, tfValue * idfValue);
            });

            return { id: doc.id, vector, metadata: doc.metadata };
        });
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        vec1.forEach((value, term) => {
            const value2 = vec2.get(term) || 0;
            dotProduct += value * value2;
            norm1 += value * value;
        });

        vec2.forEach((value) => {
            norm2 += value * value;
        });

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Find similar documents to a given document
     * @param {string} docId - Document ID to find similar docs for
     * @param {number} limit - Maximum number of results
     * @returns {Array} - Array of {id, score, metadata}
     */
    findSimilar(docId, limit = 5) {
        const sourceDoc = this.tfidfVectors.find(d => d.id === docId);
        if (!sourceDoc) return [];

        const similarities = this.tfidfVectors
            .filter(doc => doc.id !== docId)
            .map(doc => ({
                id: doc.id,
                score: this.cosineSimilarity(sourceDoc.vector, doc.vector),
                metadata: doc.metadata
            }))
            .filter(doc => doc.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return similarities;
    }

    /**
     * Search documents by query text
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @returns {Array} - Array of {id, score, metadata}
     */
    search(query, limit = 10) {
        const queryTokens = this.tokenize(query);
        const queryTf = this.termFrequency(queryTokens);
        const queryVector = new Map();

        queryTf.forEach((tfValue, term) => {
            const idfValue = this.idf.get(term) || 0;
            queryVector.set(term, tfValue * idfValue);
        });

        const results = this.tfidfVectors
            .map(doc => ({
                id: doc.id,
                score: this.cosineSimilarity(queryVector, doc.vector),
                metadata: doc.metadata
            }))
            .filter(doc => doc.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return results;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TFIDF;
} else {
    window.TFIDF = TFIDF;
}
