// js/auth.js - معالجة المصادقة
import { 
    auth,
    db
} from './firebase.js';

import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// حالة المستخدم
let currentUser = null;
let currentUserData = null;
let isUserAdminFlag = false;

// تهيئة المصادقة
export function initAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // مستخدم مسجل الدخول
                console.log('المستخدم مسجل الدخول:', user.email);
                currentUser = user;
                
                try {
                    currentUserData = await getUserData(user);
                    isUserAdminFlag = currentUserData?.isAdmin || false;
                    resolve({ success: true, user, isAdmin: isUserAdminFlag });
                } catch (error) {
                    console.error('خطأ في تحميل بيانات المستخدم:', error);
                    resolve({ success: false, error: error.message });
                }
            } else {
                // لا يوجد مستخدم مسجل
                console.log('لا يوجد مستخدم مسجل');
                currentUser = null;
                currentUserData = null;
                isUserAdminFlag = false;
                resolve({ success: false, user: null });
            }
        });
    });
}

// تسجيل الدخول باستخدام Google
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // حفظ بيانات المستخدم في Firestore
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول باستخدام Google:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code) 
        };
    }
}

// تسجيل الدخول باستخدام البريد الإلكتروني
export async function signInWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code) 
        };
    }
}

// إنشاء حساب جديد
export async function signUpWithEmail(email, password, displayName) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        // تحديث اسم المستخدم
        await updateProfile(user, { displayName });
        
        // حفظ بيانات المستخدم في Firestore
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code) 
        };
    }
}

// تسجيل الدخول كضيف
export function signInAsGuest() {
    try {
        const guestUser = {
            uid: 'guest_' + Date.now(),
            email: null,
            displayName: 'ضيف',
            photoURL: null,
            isGuest: true
        };
        
        currentUser = guestUser;
        currentUserData = guestUser;
        isUserAdminFlag = false;
        
        updateLocalUserState(guestUser, false);
        
        return { success: true, user: guestUser };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول كضيف:', error);
        return { success: false, error: 'خطأ في تسجيل الدخول كضيف' };
    }
}

// استعادة كلمة المرور
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('خطأ في إرسال رابط إعادة التعيين:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code) 
        };
    }
}

// تسجيل الخروج
export async function signOut() {
    try {
        if (currentUser && !currentUser.isGuest) {
            await auth.signOut();
        }
        
        currentUser = null;
        currentUserData = null;
        isUserAdminFlag = false;
        
        clearLocalUserState();
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return { success: false, error: 'خطأ في تسجيل الخروج' };
    }
}

// حفظ بيانات المستخدم في Firestore
async function saveUserData(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isAdmin: false
        };
        
        await setDoc(userRef, userData, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return { success: false };
    }
}

// جلب بيانات المستخدم من Firestore
export async function getUserData(user) {
    try {
        if (user.isGuest) {
            return user;
        }
        
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            await saveUserData(user);
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAdmin: false,
                createdAt: serverTimestamp()
            };
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        return null;
    }
}

// تحديث بيانات المستخدم
export async function updateUserData(userId, userData) {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            ...userData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على المستخدم الحالي
export function getCurrentUser() {
    return currentUser;
}

// التحقق إذا كان المستخدم مسؤولاً
export function isUserAdmin() {
    return isUserAdminFlag;
}

// تحديث حالة المستخدم في الذاكرة المحلية
export function updateLocalUserState(user, isAdmin) {
    try {
        const userState = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: isAdmin,
            lastLogin: new Date().toISOString(),
            isGuest: user.isGuest || false
        };
        localStorage.setItem('jamalek_user', JSON.stringify(userState));
    } catch (error) {
        console.error('خطأ في حفظ حالة المستخدم:', error);
    }
}

// مسح حالة المستخدم من الذاكرة المحلية
export function clearLocalUserState() {
    localStorage.removeItem('jamalek_user');
    localStorage.removeItem('jamalek_cart');
}

// دالة مساعدة لتحويل كود الخطأ إلى رسالة مفهومة
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
        'auth/user-disabled': 'هذا الحساب معطل',
        'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/email-already-in-use': 'هذا البريد الإلكتروني مستخدم بالفعل',
        'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل',
        'auth/operation-not-allowed': 'طريقة التسجيل هذه غير مفعلة',
        'auth/too-many-requests': 'تم إجراء محاولات كثيرة، يرجى الانتظار والمحاولة لاحقاً',
        'auth/network-request-failed': 'خطأ في الاتصال بالشبكة',
        'auth/popup-closed-by-user': 'تم إغلاق نافذة التسجيل',
        'auth/cancelled-popup-request': 'تم إلغاء عملية التسجيل',
        'default': 'حدث خطأ غير متوقع'
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
}

// تصدير الدوال
export { 
    initAuth,
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    signOut,
    signInAsGuest,
    getCurrentUser,
    isUserAdmin,
    updateUserData
};