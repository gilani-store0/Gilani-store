// js/auth.js - معالجة المصادقة

import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInAnonymously, 
    signOut, 
    onAuthStateChanged, 
    updateProfile,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let auth, db;

export function initAuth(firebaseApp) {
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    auth.languageCode = 'ar';
}

// حالة المصادقة
export const AuthState = {
    currentUser: null,
    isAdmin: false,
    isSignUpMode: false
};

// دوال مساعدة
const Utils = {
    showError(message) {
        const errorDiv = document.getElementById('generalError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            setTimeout(() => errorDiv.classList.remove('show'), 5000);
        }
    },

    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    validatePassword(password) {
        return password.length >= 6;
    }
};

// المصادقة بجوجل
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await createUserRecord(result.user);
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        Utils.showError('فشل تسجيل الدخول');
        return null;
    }
}

// إنشاء حساب جديد
async function createUserRecord(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email || null,
                displayName: user.displayName || 'مستخدم',
                photoURL: user.photoURL || null,
                isAdmin: false,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        } else {
            // تحديث آخر دخول فقط
            await setDoc(userRef, {
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('خطأ في إنشاء حساب:', error);
    }
}

// التحقق من صلاحية الأدمن وجلب بيانات المستخدم الإضافية
export async function getUserData(user) {
    try {
        if (!user) return null;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        return null;
    }
}

// التحقق من صلاحية الأدمن
export async function checkAdminStatus(user) {
    const userData = await getUserData(user);
    return userData ? userData.isAdmin === true : false;
}

// تحديث بيانات المستخدم
export async function updateUserData(uid, data) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        // إذا كان هناك تحديث للاسم في Firebase Auth
        if (data.displayName && auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// تسجيل الدخول بالبريد
export async function signInWithEmail(email, password) {
    if (!Utils.validateEmail(email)) {
        Utils.showError('البريد الإلكتروني غير صالح');
        return null;
    }

    if (!Utils.validatePassword(password)) {
        Utils.showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return null;
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await createUserRecord(result.user);
        return result.user;
    } catch (error) {
        Utils.showError('البريد أو كلمة المرور غير صحيحة');
        return null;
    }
}

// إنشاء حساب جديد
export async function createAccount(email, password, displayName) {
    if (!Utils.validateEmail(email)) {
        Utils.showError('البريد الإلكتروني غير صالح');
        return null;
    }

    if (!Utils.validatePassword(password)) {
        Utils.showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return null;
    }

    if (!displayName || displayName.trim().length < 2) {
        Utils.showError('الرجاء إدخال اسم صحيح');
        return null;
    }

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await createUserRecord(result.user);
        return result.user;
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            Utils.showError('هذا البريد مستخدم بالفعل');
        } else {
            Utils.showError('فشل إنشاء الحساب');
        }
        return null;
    }
}

// تسجيل الدخول كضيف
export async function signInAsGuest() {
    try {
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (error) {
        Utils.showError('فشل تسجيل الدخول كضيف');
        return null;
    }
}

// تسجيل الخروج
export async function logout() {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return false;
    }
}

// إعادة تعيين كلمة المرور
export async function resetPassword(email) {
    if (!Utils.validateEmail(email)) {
        Utils.showError('البريد الإلكتروني غير صالح');
        return false;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        Utils.showError('البريد الإلكتروني غير مسجل');
        return false;
    }
}

// متابعة حالة المصادقة
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        AuthState.currentUser = user;
        if (user) {
            AuthState.isAdmin = await checkAdminStatus(user);
        } else {
            AuthState.isAdmin = false;
        }
        callback(AuthState);
    });
}