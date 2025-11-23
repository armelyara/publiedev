// Initialisation Firebase
firebase.initializeApp(firebaseConfig);

// Services Firebase
const auth = firebase.auth();
const db = firebase.firestore();
// Initialize storage only if SDK is loaded
const storage = firebase.storage ? firebase.storage() : null;

// Collections
const COLLECTIONS = {
    USERS: 'users',
    PUBLICATIONS: 'publications',
    COMMENTS: 'comments',
    CATEGORIES: 'categories'
};

// Helpers Firestore
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
const increment = firebase.firestore.FieldValue.increment;

console.log('Firebase initialisé');
