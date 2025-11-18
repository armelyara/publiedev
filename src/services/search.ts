import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Publication, SearchFilters, SearchResult } from '../types';

const PUBLICATIONS_COLLECTION = 'publications';

// Generate search keywords from text
export const generateSearchKeywords = (text: string): string[] => {
  const words = text.toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  const keywords = new Set<string>();

  words.forEach(word => {
    keywords.add(word);
    // Add prefixes for partial matching
    for (let i = 3; i <= word.length; i++) {
      keywords.add(word.substring(0, i));
    }
  });

  return Array.from(keywords);
};

// Index publication for search
export const indexPublication = (publication: Partial<Publication>): string[] => {
  const textToIndex = [
    publication.title || '',
    publication.description || '',
    publication.abstract || '',
    ...(publication.tags || []),
    ...(publication.technologies || []),
    ...(publication.categories || [])
  ].join(' ');

  return generateSearchKeywords(textToIndex);
};

// Advanced search with scoring
export const advancedSearch = async (
  filters: SearchFilters
): Promise<SearchResult[]> => {
  const { query: searchQuery, type, categories, sortBy, sortOrder } = filters;

  // Build query constraints
  const constraints = [
    where('status', '==', 'published')
  ];

  if (type) {
    constraints.push(where('type', '==', type));
  }

  if (categories && categories.length > 0) {
    constraints.push(where('categories', 'array-contains-any', categories));
  }

  // Search by keywords
  if (searchQuery) {
    const keywords = searchQuery.toLowerCase().split(' ').filter(k => k.length > 2);
    if (keywords.length > 0) {
      constraints.push(where('searchKeywords', 'array-contains-any', keywords));
    }
  }

  // Sorting
  let sortField = 'publishedAt';
  switch (sortBy) {
    case 'views':
      sortField = 'views';
      break;
    case 'likes':
      sortField = 'likes';
      break;
    case 'citations':
      sortField = 'citations';
      break;
    case 'date':
      sortField = 'publishedAt';
      break;
  }

  constraints.push(orderBy(sortField, sortOrder || 'desc'));
  constraints.push(limit(50));

  const q = query(collection(db, PUBLICATIONS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  const results: SearchResult[] = querySnapshot.docs.map(doc => {
    const publication = { id: doc.id, ...doc.data() } as Publication;

    // Calculate relevance score
    let score = 0;
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      if (publication.title.toLowerCase().includes(queryLower)) score += 10;
      if (publication.description.toLowerCase().includes(queryLower)) score += 5;
      if (publication.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 3;
    }

    // Boost by engagement
    score += Math.log10(publication.views + 1);
    score += Math.log10(publication.likes + 1) * 2;
    score += Math.log10(publication.citations + 1) * 3;

    return {
      publication,
      score,
      highlights: {
        title: publication.title,
        description: publication.description
      }
    };
  });

  // Sort by score for relevance
  if (sortBy === 'relevance') {
    results.sort((a, b) => b.score - a.score);
  }

  return results;
};

// Get suggestions for autocomplete
export const getSuggestions = async (
  prefix: string,
  maxResults: number = 5
): Promise<string[]> => {
  if (prefix.length < 2) return [];

  const prefixLower = prefix.toLowerCase();

  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    where('searchKeywords', 'array-contains', prefixLower),
    limit(maxResults * 3)
  );

  const querySnapshot = await getDocs(q);

  const suggestions = new Set<string>();

  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    // Add title if matches
    if (data.title.toLowerCase().includes(prefixLower)) {
      suggestions.add(data.title);
    }
    // Add matching tags
    data.tags?.forEach((tag: string) => {
      if (tag.toLowerCase().includes(prefixLower)) {
        suggestions.add(tag);
      }
    });
  });

  return Array.from(suggestions).slice(0, maxResults);
};

// Get related publications
export const getRelatedPublications = async (
  publication: Publication,
  maxResults: number = 5
): Promise<Publication[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    where('tags', 'array-contains-any', publication.tags.slice(0, 3)),
    limit(maxResults + 1)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }) as Publication)
    .filter(p => p.id !== publication.id)
    .slice(0, maxResults);
};
