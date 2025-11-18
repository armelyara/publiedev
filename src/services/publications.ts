import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Publication, PublicationType, SearchFilters } from '../types';

const PUBLICATIONS_COLLECTION = 'publications';
const PAGE_SIZE = 20;

// Create publication
export const createPublication = async (
  publication: Omit<Publication, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'bookmarks' | 'citations'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, PUBLICATIONS_COLLECTION), {
    ...publication,
    views: 0,
    likes: 0,
    bookmarks: 0,
    citations: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

// Get publication by ID
export const getPublication = async (id: string): Promise<Publication | null> => {
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Publication;
  }
  return null;
};

// Get publication by slug
export const getPublicationBySlug = async (slug: string): Promise<Publication | null> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('slug', '==', slug),
    where('status', '==', 'published'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Publication;
  }
  return null;
};

// Get publications with filters
export const getPublications = async (
  filters: Partial<SearchFilters>,
  lastDoc?: DocumentSnapshot,
  pageSize: number = PAGE_SIZE
): Promise<{ publications: Publication[]; lastDoc: DocumentSnapshot | null }> => {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published')
  ];

  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }

  if (filters.categories && filters.categories.length > 0) {
    constraints.push(where('categories', 'array-contains-any', filters.categories));
  }

  // Sort
  switch (filters.sortBy) {
    case 'date':
      constraints.push(orderBy('publishedAt', filters.sortOrder || 'desc'));
      break;
    case 'views':
      constraints.push(orderBy('views', filters.sortOrder || 'desc'));
      break;
    case 'likes':
      constraints.push(orderBy('likes', filters.sortOrder || 'desc'));
      break;
    case 'citations':
      constraints.push(orderBy('citations', filters.sortOrder || 'desc'));
      break;
    default:
      constraints.push(orderBy('publishedAt', 'desc'));
  }

  constraints.push(limit(pageSize));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, PUBLICATIONS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  const publications = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];

  const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  return { publications, lastDoc: newLastDoc };
};

// Get publications by type
export const getPublicationsByType = async (
  type: PublicationType,
  pageSize: number = PAGE_SIZE
): Promise<Publication[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('type', '==', type),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(pageSize)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];
};

// Get user publications
export const getUserPublications = async (
  userId: string,
  pageSize: number = PAGE_SIZE
): Promise<Publication[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];
};

// Update publication
export const updatePublication = async (
  id: string,
  updates: Partial<Publication>
): Promise<void> => {
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Delete publication
export const deletePublication = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, PUBLICATIONS_COLLECTION, id));
};

// Increment view count
export const incrementViews = async (id: string): Promise<void> => {
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    views: increment(1)
  });
};

// Toggle like
export const toggleLike = async (id: string, liked: boolean): Promise<void> => {
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    likes: increment(liked ? 1 : -1)
  });
};

// Get trending publications
export const getTrendingPublications = async (
  pageSize: number = 10
): Promise<Publication[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('views', 'desc'),
    limit(pageSize)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];
};

// Get recent publications
export const getRecentPublications = async (
  pageSize: number = 10
): Promise<Publication[]> => {
  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(pageSize)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];
};

// Search publications (basic text search)
export const searchPublications = async (
  searchQuery: string,
  pageSize: number = PAGE_SIZE
): Promise<Publication[]> => {
  // Note: For full-text search, consider using Algolia or Elasticsearch
  // This is a basic implementation using keywords
  const keywords = searchQuery.toLowerCase().split(' ').filter(k => k.length > 2);

  if (keywords.length === 0) {
    return [];
  }

  const q = query(
    collection(db, PUBLICATIONS_COLLECTION),
    where('status', '==', 'published'),
    where('searchKeywords', 'array-contains-any', keywords),
    orderBy('views', 'desc'),
    limit(pageSize)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Publication[];
};
