// js/auth.js - النهائي

let currentUser = null;
let currentUserData = null;
let isUserAdminFlag = false;

function initAuth() {
    return new Promise((resolve, reject) => {
        if (!window.auth) {
            console.warn('Firebase Auth غير متاح، استخدام وضع الضيف');
            const guestUser = {
                uid: 'guest_' + Date.now(),
                email: null,
                displayName: 'ضيف',
                photoURL: null,
                isGuest: true,
                isAdmin: false,
                createdAt: new Date().toISOString()
            };
            
            currentUser = guestUser;
            currentUserData = guestUser;
            isUserAdminFlag = false;
            
            resolve({ success: true, user: guestUser, isAdmin: false, isGuest: true });
            return;
        }
        
        const unsubscribe = window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                try {
                    const isAdmin = await checkAndUpdateAdminStatus();
                    const userData = await getUserData(user);
                    
                    await updateUserStatusAfterLogin(user, false);
                    
                    resolve({ 
                        success: true, 
                        user, 
                        userData: currentUserData, 
                        isAdmin: isAdmin,
                        isGuest: false
                    });
                } catch (error) {
                    console.error('خطأ في تحميل بيانات المستخدم:', error);
                    resolve({ success: true, user, isAdmin: false, isGuest: false });
                }
            } else {
                currentUser = null;
                currentUserData = null;
                isUserAdminFlag = false;
                localStorage.removeItem('jamalek_user');
                document.body.classList.remove('admin-mode');
                resolve({ success: false, user: null, isGuest: true });
            }
        });
    });
}

async function signInWithGoogle() {
    try {
        if (!window.auth || !firebase) throw new Error('Firebase غير متاح');
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        
        await saveUserData(user);
        const isAdmin = await checkAndUpdateAdminStatus();
        await updateUserStatusAfterLogin(user, false);
        
        return { success: true, user, userData: currentUserData, isAdmin, isGuest: false };
    } catch (error) {
        console.error('خطأ Google Sign-In:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

async function signInWithEmail(email, password) {
    try {
        if (!window.auth) throw new Error('Firebase Auth غير متاح');
        
        const result = await window.auth.signInWithEmailAndPassword(email.trim(), password);
        const user = result.user;
        
        const isAdmin = await checkAndUpdateAdminStatus();
        await updateUserStatusAfterLogin(user, false);
        
        return { success: true, user, userData: currentUserData, isAdmin, isGuest: false };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

async function signUpWithEmail(email, password, displayName) {
    try {
        if (!window.auth) throw new Error('Firebase Auth غير متاح');
        
        const result = await window.auth.createUserWithEmailAndPassword(email.trim(), password);
        const user = result.user;
        
        if (displayName) await user.updateProfile({ displayName: displayName.trim() });
        
        await saveUserData(user);
        const isAdmin = await checkAndUpdateAdminStatus();
        await updateUserStatusAfterLogin(user, false);
        
        return { success: true, user, userData: currentUserData, isAdmin, isGuest: false };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

async function saveUserData(user) {
    if (!window.db) return;
    try {
        const userRef = window.db.collection("users").doc(user.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'مستخدم جديد',
                photoURL: user.photoURL || '',
                isAdmin: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
    }
}

async function getUserData(user) {
    if (!user) return null;
    if (user.isGuest) return user;
    
    if (!window.db) return user;
    
    try {
        const userRef = window.db.collection("users").doc(user.uid);
        const doc = await userRef.get();
        if (doc.exists) {
            const data = doc.data();
            currentUserData = { ...user, ...data };
            isUserAdminFlag = data.isAdmin || false;
            return currentUserData;
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
    }
    return user;
}

async function checkAndUpdateAdminStatus() {
    const user = window.auth ? window.auth.currentUser : currentUser;
    if (!user || user.isGuest) {
        setAdminStatus(false);
        return false;
    }
    
    try {
        const userData = await getUserData(user);
        const isAdmin = userData && userData.isAdmin === true;
        setAdminStatus(isAdmin);
        return isAdmin;
    } catch (error) {
        setAdminStatus(false);
        return false;
    }
}

function setAdminStatus(status) {
    isUserAdminFlag = status;
    if (status) {
        document.body.classList.add('admin-mode');
    } else {
        document.body.classList.remove('admin-mode');
    }
}

function isUserAdmin() {
    return isUserAdminFlag;
}

function getCurrentUser() {
    return window.auth ? window.auth.currentUser || currentUser : currentUser;
}

async function updateUserStatusAfterLogin(user, isGuest = false) {
    currentUser = user;
    const userData = await getUserData(user);
    const userState = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || user.displayName || 'مستخدم',
        photoURL: userData.photoURL || user.photoURL || '',
        isAdmin: isUserAdminFlag,
        isGuest: isGuest,
        lastUpdated: Date.now()
    };
    localStorage.setItem('jamalek_user', JSON.stringify(userState));
}

function loadUserFromLocalStorage() {
    try {
        const saved = localStorage.getItem('jamalek_user');
        if (saved) {
            const user = JSON.parse(saved);
            currentUser = user;
            isUserAdminFlag = user.isAdmin || false;
            if (isUserAdminFlag) document.body.classList.add('admin-mode');
            return { success: true, user };
        }
    } catch (e) {
        console.error('خطأ في تحميل المستخدم من LocalStorage:', e);
    }
    return { success: false };
}

async function signOut() {
    if (window.auth) await window.auth.signOut();
    localStorage.removeItem('jamalek_user');
    location.reload();
}

function getErrorMessage(error) {
    if (!error) return 'حدث خطأ غير متوقع';
    const code = error.code;
    const messages = {
        'auth/user-not-found': 'المستخدم غير موجود',
        'auth/wrong-password': 'كلمة المرور خاطئة',
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/invalid-email': 'بريد إلكتروني غير صالح',
        'auth/weak-password': 'كلمة المرور ضعيفة جداً'
    };
    return messages[code] || error.message || 'فشل العملية';
}

window.initAuth = initAuth;
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signOut = signOut;
window.isUserAdmin = isUserAdmin;
window.getCurrentUser = getCurrentUser;
window.getUserData = getUserData;
window.checkAndUpdateAdminStatus = checkAndUpdateAdminStatus;
window.updateUserStatusAfterLogin = updateUserStatusAfterLogin;
window.loadUserFromLocalStorage = loadUserFromLocalStorage;
window.signInAsGuest = () => {
    const guest = { uid: 'guest_'+Date.now(), displayName: 'ضيف', isGuest: true, isAdmin: false };
    currentUser = guest;
    updateUserStatusAfterLogin(guest, true);
    return { success: true, user: guest, isGuest: true, isAdmin: false };
};