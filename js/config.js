// Configuration Firebase - À remplacer par vos propres clés
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    measurementId: "G-XXXXXXX"
};

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
