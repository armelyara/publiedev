// Configuration Firebase
// IMPORTANT: Copiez ce fichier vers config.js et remplacez par vos propres clés
// Obtenez-les depuis: https://console.firebase.google.com/
// Projet > Paramètres du projet > Général > Vos applications > Configuration SDK

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "000000000000",
    appId: "0:000000000000:web:0000000000000000",
    measurementId: "G-0000000000"
};

// Vérification de configuration
if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY_HERE") {
    console.warn("⚠️ PublieDev: Configuration Firebase non définie. Veuillez copier config.example.js vers config.js et ajouter vos clés Firebase.");
}

// Configuration de l'application
const APP_CONFIG = {
    name: 'PublieDev',
    version: '1.0.0',
    pageSize: 12,
    maxSearchResults: 50,
    supportedTypes: ['app', 'api', 'program', 'tutorial', 'article'],
    typeLabels: {
        app: 'Application',
        api: 'API',
        program: 'Programme',
        tutorial: 'Tutoriel',
        article: 'Article'
    }
};
