// Service d'authentification

// État de l'utilisateur actuel
let currentUser = null;
let userProfile = null;

// Écouter les changements d'état d'authentification
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        userProfile = await getUserProfile(user.uid);
        updateAuthUI(true);
    } else {
        userProfile = null;
        updateAuthUI(false);
    }
});

// Obtenir le profil utilisateur
async function getUserProfile(uid) {
    try {
        const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('Erreur getUserProfile:', error);
        return null;
    }
}

// Créer le profil utilisateur
async function createUserProfile(user, additionalData = {}) {
    const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
        await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || additionalData.displayName || '',
            photoURL: user.photoURL || '',
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
}

// Inscription avec email
async function signUpWithEmail(email, password, displayName) {
    try {
        const { user } = await auth.createUserWithEmailAndPassword(email, password);
        await user.updateProfile({ displayName });
        await createUserProfile(user, { displayName });
        return user;
    } catch (error) {
        console.error('Erreur inscription:', error);
        throw error;
    }
}

// Connexion avec email
async function signInWithEmail(email, password) {
    try {
        const { user } = await auth.signInWithEmailAndPassword(email, password);
        return user;
    } catch (error) {
        console.error('Erreur connexion:', error);
        throw error;
    }
}

// Connexion avec Google
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const { user } = await auth.signInWithPopup(provider);
        await createUserProfile(user);
        return user;
    } catch (error) {
        console.error('Erreur Google:', error);
        throw error;
    }
}

// Connexion avec GitHub
async function signInWithGithub() {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        const { user } = await auth.signInWithPopup(provider);
        await createUserProfile(user);
        return user;
    } catch (error) {
        console.error('Erreur GitHub:', error);
        throw error;
    }
}

// Déconnexion
async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        throw error;
    }
}

// Réinitialiser le mot de passe
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error) {
        console.error('Erreur reset password:', error);
        throw error;
    }
}

// Mettre à jour l'UI selon l'état d'authentification
function updateAuthUI(isLoggedIn) {
    const authNav = document.getElementById('authNav');
    const mobileAuthNav = document.getElementById('mobileAuthNav');

    if (isLoggedIn && currentUser) {
        // Échapper le nom d'utilisateur pour prévenir XSS
        const safeDisplayName = window.Security ?
            window.Security.escapeHtml(currentUser.displayName || 'Mon compte') :
            (currentUser.displayName || 'Mon compte').replace(/[<>&"']/g, '');

        const authHTML = `
            <a href="/pages/publish.html" class="btn btn-primary">
                + Soumettre
            </a>
            <div class="user-menu">
                <a href="/pages/profile.html">${safeDisplayName}</a>
                <button onclick="signOut()">Déconnexion</button>
            </div>
        `;
        const mobileAuthHTML = `
            <a href="/pages/publish.html" class="btn btn-primary btn-block">Publier</a>
            <button onclick="signOut()" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">Déconnexion</button>
        `;

        if (authNav) authNav.innerHTML = authHTML;
        if (mobileAuthNav) mobileAuthNav.innerHTML = mobileAuthHTML;
    } else {
        const authHTML = `<a href="/pages/login.html" class="btn btn-primary">Connexion</a>`;
        const mobileAuthHTML = `<a href="/pages/login.html" class="btn btn-primary btn-block">Connexion</a>`;

        if (authNav) authNav.innerHTML = authHTML;
        if (mobileAuthNav) mobileAuthNav.innerHTML = mobileAuthHTML;
    }
}

// Vérifier si l'utilisateur est connecté
function isAuthenticated() {
    return currentUser !== null;
}

// Obtenir l'utilisateur actuel
function getCurrentUser() {
    return currentUser;
}

// Obtenir le profil actuel
function getCurrentProfile() {
    return userProfile;
}
