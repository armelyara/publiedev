export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicationType = 'app' | 'api' | 'program' | 'tutorial' | 'article';
export type PublicationStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface Publication {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  type: PublicationType;
  status: PublicationStatus;

  // Metadata
  authorId: string;
  authorName: string;
  authorPhoto?: string;

  // Categorization
  tags: string[];
  categories: string[];

  // Technical details (for apps/apis/programs)
  technologies?: string[];
  githubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;
  version?: string;
  license?: string;

  // Media
  coverImage?: string;
  screenshots?: string[];

  // Metrics
  views: number;
  likes: number;
  bookmarks: number;
  citations: number;

  // Search & Index
  searchKeywords: string[];
  abstract?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Comment {
  id: string;
  publicationId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  parentId?: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  parentId?: string;
  publicationCount: number;
}

export interface SearchFilters {
  query: string;
  type?: PublicationType;
  categories?: string[];
  tags?: string[];
  technologies?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'relevance' | 'date' | 'views' | 'likes' | 'citations';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  publication: Publication;
  score: number;
  highlights: {
    title?: string;
    description?: string;
    content?: string;
  };
}

export interface RAGQuery {
  query: string;
  context?: string;
  filters?: Partial<SearchFilters>;
}

export interface RAGResponse {
  answer: string;
  sources: Publication[];
  confidence: number;
}
