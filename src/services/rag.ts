import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Publication, RAGQuery, RAGResponse } from '../types';

const PUBLICATIONS_COLLECTION = 'publications';

// Simple RAG implementation using keyword matching and relevance scoring
// For production, integrate with a proper vector database and LLM API

interface DocumentChunk {
  publicationId: string;
  title: string;
  content: string;
  score: number;
}

// Extract relevant chunks from publications
const extractChunks = (publications: Publication[], query: string): DocumentChunk[] => {
  const queryTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  const chunks: DocumentChunk[] = [];

  publications.forEach(pub => {
    // Score based on keyword matching
    let score = 0;
    const contentLower = (pub.content + ' ' + pub.description).toLowerCase();

    queryTerms.forEach(term => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    });

    if (score > 0) {
      chunks.push({
        publicationId: pub.id,
        title: pub.title,
        content: pub.description + '\n\n' + pub.content.substring(0, 1000),
        score
      });
    }
  });

  return chunks.sort((a, b) => b.score - a.score);
};

// Build context from top chunks
const buildContext = (chunks: DocumentChunk[], maxLength: number = 3000): string => {
  let context = '';
  let currentLength = 0;

  for (const chunk of chunks) {
    if (currentLength + chunk.content.length > maxLength) break;
    context += `\n\n---\nSource: ${chunk.title}\n${chunk.content}`;
    currentLength += chunk.content.length;
  }

  return context;
};

// RAG Query - Retrieval Augmented Generation
export const ragQuery = async (ragRequest: RAGQuery): Promise<RAGResponse> => {
  const { query: userQuery, filters } = ragRequest;

  // Step 1: Retrieve relevant documents
  const keywords = userQuery.toLowerCase().split(' ').filter(k => k.length > 2);

  if (keywords.length === 0) {
    return {
      answer: 'Veuillez fournir une question plus détaillée.',
      sources: [],
      confidence: 0
    };
  }

  const constraints = [
    where('status', '==', 'published'),
    where('searchKeywords', 'array-contains-any', keywords),
    orderBy('views', 'desc'),
    limit(20)
  ];

  if (filters?.type) {
    constraints.unshift(where('type', '==', filters.type));
  }

  const q = query(collection(db, PUBLICATIONS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  const publications = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];

  if (publications.length === 0) {
    return {
      answer: 'Aucun résultat trouvé pour votre recherche. Essayez avec d\'autres termes.',
      sources: [],
      confidence: 0
    };
  }

  // Step 2: Extract and rank chunks
  const chunks = extractChunks(publications, userQuery);
  const topChunks = chunks.slice(0, 5);

  // Step 3: Build context
  const context = buildContext(topChunks);

  // Step 4: Generate response
  // Note: In production, this would call an LLM API (e.g., OpenAI, Anthropic)
  // For now, we return a structured summary

  const topSources = topChunks.map(chunk =>
    publications.find(p => p.id === chunk.publicationId)!
  ).filter(Boolean);

  // Generate a simple answer based on top results
  const answer = generateSimpleAnswer(userQuery, topSources, topChunks);

  const confidence = Math.min(
    topChunks.length > 0 ? topChunks[0].score / 10 : 0,
    1
  );

  return {
    answer,
    sources: topSources,
    confidence
  };
};

// Generate a simple answer without LLM
const generateSimpleAnswer = (
  query: string,
  sources: Publication[],
  chunks: DocumentChunk[]
): string => {
  if (sources.length === 0) {
    return 'Aucune information pertinente trouvée.';
  }

  const primarySource = sources[0];
  let answer = `Basé sur les ressources disponibles, voici ce que j'ai trouvé concernant "${query}":\n\n`;

  answer += `**${primarySource.title}**\n${primarySource.description}\n\n`;

  if (sources.length > 1) {
    answer += `Autres ressources pertinentes:\n`;
    sources.slice(1, 4).forEach(source => {
      answer += `- ${source.title}\n`;
    });
  }

  answer += `\n\nPour plus de détails, consultez les sources ci-dessous.`;

  return answer;
};

// Get popular topics for RAG suggestions
export const getPopularTopics = async (): Promise<string[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('views', 'desc'),
    limit(50)
  );

  const querySnapshot = await getDocs(q);

  const tagCounts = new Map<string, number>();

  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    data.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
};

// Semantic similarity placeholder
// In production, use embeddings from OpenAI, Cohere, or similar
export const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size; // Jaccard similarity
};
