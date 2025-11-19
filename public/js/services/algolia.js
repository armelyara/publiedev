/**
 * Algolia Search Integration
 * Client-side search functionality
 */

const ALGOLIA_APP_ID = '1JSU865M6S';
const ALGOLIA_SEARCH_KEY = 'ceae20e343367f95e726779b1707d529';
const ALGOLIA_INDEX_NAME = 'publications';

// Initialize Algolia search client
let searchClient = null;
let searchIndex = null;

function initAlgolia() {
    if (typeof algoliasearch === 'undefined') {
        console.error('Algolia library not loaded');
        return false;
    }

    searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    searchIndex = searchClient.initIndex(ALGOLIA_INDEX_NAME);
    return true;
}

/**
 * Search publications
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
async function searchPublications(query, options = {}) {
    if (!searchIndex) {
        if (!initAlgolia()) {
            throw new Error('Algolia not initialized');
        }
    }

    const defaultOptions = {
        hitsPerPage: 20,
        attributesToRetrieve: [
            'objectID',
            'title',
            'description',
            'abstract',
            'type',
            'authors',
            'tags',
            'createdAt',
            'views',
            'likes',
            'pdfUrl',
            'doi'
        ],
        attributesToHighlight: ['title', 'description', 'abstract'],
        facets: ['type', 'tags'],
        ...options
    };

    try {
        const results = await searchIndex.search(query, defaultOptions);
        return results;
    } catch (error) {
        console.error('Algolia search error:', error);
        throw error;
    }
}

/**
 * Search with filters
 * @param {string} query - Search query
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Search results
 */
async function searchWithFilters(query, filters = {}) {
    const filterStrings = [];

    if (filters.type) {
        filterStrings.push(`type:${filters.type}`);
    }

    if (filters.tags && filters.tags.length > 0) {
        const tagFilters = filters.tags.map(tag => `tags:${tag}`).join(' OR ');
        filterStrings.push(`(${tagFilters})`);
    }

    // Only show approved publications
    filterStrings.push('status:approved');

    const options = {
        filters: filterStrings.join(' AND '),
        page: filters.page || 0,
        hitsPerPage: filters.hitsPerPage || 20
    };

    return searchPublications(query, options);
}

/**
 * Get facet values for filtering
 * @param {string} facetName - Facet name (e.g., 'type', 'tags')
 * @returns {Promise<Array>} - Facet values
 */
async function getFacetValues(facetName) {
    if (!searchIndex) {
        if (!initAlgolia()) {
            throw new Error('Algolia not initialized');
        }
    }

    try {
        const results = await searchIndex.searchForFacetValues(facetName, '', {
            maxFacetHits: 100
        });
        return results.facetHits;
    } catch (error) {
        console.error('Algolia facet error:', error);
        throw error;
    }
}

// Export functions
window.AlgoliaSearch = {
    init: initAlgolia,
    search: searchPublications,
    searchWithFilters: searchWithFilters,
    getFacetValues: getFacetValues
};
