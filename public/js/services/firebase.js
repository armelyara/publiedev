// Initialisation Firebase
firebase.initializeApp(firebaseConfig);

// Services Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

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
