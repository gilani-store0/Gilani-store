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
    updateProfile,
    updateEmail,
    updatePassword
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    where,
    orderBy
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
                // مستخدم مسجل الدخول من Firebase
                console.log('المستخدم مسجل الدخول:', user.email);
                currentUser = user;
                
                try {
                    currentUserData = await getUserData(user);
                    isUserAdminFlag = currentUserData?.isAdmin || false;
                    resolve({ success: true, user, userData: currentUserData, isAdmin: isUserAdminFlag });
                } catch (error) {
                    console.error('خطأ في تحميل بيانات المستخدم:', error);
                    resolve({ success: false, error: error.message });
                }
            } else {
                // لا يوجد مستخدم مسجل من Firebase
                console.log('لا يوجد مستخدم مسجل من Firebase');
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
        if (displayName) {
            await updateProfile(user, { displayName });
        }
        
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
            isGuest: true,
            createdAt: new Date().toISOString()
        };
        
        currentUser = guestUser;
        currentUserData = guestUser;
        isUserAdminFlag = false;
        
        // حفظ حالة المستخدم في localStorage
        const userState = {
            uid: guestUser.uid,
            email: guestUser.email,
            displayName: guestUser.displayName,
            photoURL: guestUser.photoURL,
            isAdmin: false,
            createdAt: guestUser.createdAt,
            isGuest: true
        };
        
        localStorage.setItem('jamalek_user', JSON.stringify(userState));
        
        return { success: true, user: guestUser, userData: guestUser };
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
        
        // مسح حالة المستخدم من localStorage
        localStorage.removeItem('jamalek_user');
        
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
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isAdmin: false,
            phone: '',
            address: ''
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
        // إذا كان ضيفاً، ارجع بياناته المحلية
        if (user.isGuest) {
            return user;
        }
        
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            await saveUserData(user);
            const newSnap = await getDoc(userRef);
            return newSnap.data();
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
        
        // تحديث الذاكرة المحلية
        if (currentUserData && currentUserData.uid === userId) {
            currentUserData = { ...currentUserData, ...userData };
        }
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// تحديث البريد الإلكتروني
export async function updateUserEmail(newEmail) {
    try {
        await updateEmail(auth.currentUser, newEmail);
        await updateUserData(auth.currentUser.uid, { email: newEmail });
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث البريد الإلكتروني:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// تحديث كلمة المرور
export async function updateUserPassword(newPassword) {
    try {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث كلمة المرور:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// جلب جميع المستخدمين (للأدمن فقط)
export async function getAllUsers() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const users = [];
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        return users;
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        return [];
    }
}

// جلب عدد المستخدمين
export async function getUsersCount() {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        return snapshot.size;
    } catch (error) {
        console.error('خطأ في جلب عدد المستخدمين:', error);
        return 0;
    }
}

// الحصول على المستخدم الحالي
export function getCurrentUser() {
    return currentUser;
}

// الحصول على بيانات المستخدم الحالي
export function getCurrentUserData() {
    return currentUserData;
}

// التحقق إذا كان المستخدم مسؤولاً
export function isUserAdmin() {
    return isUserAdminFlag;
}

// تعيين حالة المسؤول
export function setAdminStatus(status) {
    isUserAdminFlag = status;
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
        'auth/requires-recent-login': 'يجب تسجيل الدخول مرة أخرى لإكمال هذه العملية',
        'auth/invalid-credential': 'بيانات الاعتماد غير صالحة',
        'default': 'حدث خطأ غير متوقع'
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
}

// تحميل حالة المستخدم من localStorage
export function loadUserFromLocalStorage() {
    try {
        const savedUser = localStorage.getItem('jamalek_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            currentUser = userData;
            currentUserData = userData;
            isUserAdminFlag = userData.isAdmin || false;
            return { success: true, user: userData, isAdmin: isUserAdminFlag };
        }
        return { success: false, user: null };
    } catch (error) {
        console.error('خطأ في تحميل حالة المستخدم:', error);
        return { success: false, user: null };
    }
}

// تصدير جميع الدوال
export { 
    initAuth,
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    signOut,
    signInAsGuest,
    getCurrentUser,
    getCurrentUserData,
    getUserData,
    isUserAdmin,
    setAdminStatus,
    updateUserData,
    updateUserEmail,
    updateUserPassword,
    getAllUsers,
    getUsersCount,
    loadUserFromLocalStorage
};