import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

const USERS_COLLECTION = 'users';

// Create user profile in Firestore
const createUserProfile = async (
  firebaseUser: FirebaseUser,
  additionalData?: Partial<User>
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || additionalData?.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      bio: '',
      location: 'Côte d\'Ivoire',
      github: '',
      linkedin: '',
      website: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...additionalData
    });
  }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// Sign up with email
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await createUserProfile(user, { displayName });
  return user;
};

// Sign in with email
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await createUserProfile(user);
  return user;
};

// Sign in with GitHub
export const signInWithGithub = async (): Promise<FirebaseUser> => {
  const provider = new GithubAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await createUserProfile(user);
  return user;
};

// Sign out
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
