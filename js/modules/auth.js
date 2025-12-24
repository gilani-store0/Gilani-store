// js/modules/auth.js

import { auth, db } from './firebase-config.js';
import { showCustomToast, showError, showLoading, hideLoading, validateAuthForm } from './utils.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signInAnonymously, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    serverTimestamp,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { showMainApp, showAuthScreen, updateAdminUI, closeAdminPanel, updateUserUI } from './ui.js';
import { loadStoreData } from './data.js';

// حالة التطبيق
export let currentUser = null;
export let isAdmin = false;
let isSignUpMode = false; // حالة جديدة للتبديل بين تسجيل الدخول وإنشاء الحساب

// =====================================
// وظائف تسجيل السجلات (تم إزالة getClientIP)
// =====================================

// تسجيل دخول الأدمن
async function logAdminLogin(adminId) {
    try {
        await addDoc(collection(db, 'adminLogs'), {
            adminId: adminId,
            action: 'LOGIN',
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging admin login:', error);
    }
}

// تسجيل إجراءات الأدمن
export async function logAdminAction(action, details = {}) {
    if (!currentUser || !isAdmin) return;
    
    try {
        await addDoc(collection(db, 'adminLogs'), {
            adminId: currentUser.uid,
            action: action,
            details: details,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

// تسجيل محاولات الدخول
async function logLoginAttempt(uid, success, email = null) {
    try {
        await addDoc(collection(db, 'loginAttempts'), {
            uid: uid,
            email: email,
            success: success,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
}

// =====================================
// وظائف المستخدم
// =====================================

// إنشاء سجل مستخدم جديد
async function createUserRecord(user) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || 'مستخدم',
            photoURL: user.photoURL || null,
            isAdmin: false,
            isBlocked: false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('تم إنشاء سجل مستخدم جديد');
    } catch (error) {
        console.error('خطأ في إنشاء سجل المستخدم:', error);
    }
}

// التحقق من حالة المسؤول
async function checkUserAdminStatus(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const now = new Date();
            
            // التحقق من حالة الحظر المؤقت
            if (userData.isBlocked) {
                const blockUntil = userData.blockedUntil?.toDate();
                if (blockUntil && now < blockUntil) {
                    showCustomToast("حسابك محظور مؤقتاً. حاول مرة أخرى لاحقاً", "error");
                    await handleSignOut();
                    return;
                } else if (userData.isBlocked) {
                    // إزالة الحظر إذا انتهت مدته
                    await updateDoc(userDocRef, {
                        isBlocked: false,
                        blockedUntil: null
                    });
                }
            }
            
            // تحديد إذا كان المستخدم مسؤولاً
            isAdmin = userData.isAdmin === true;
            
            // تحديث واجهة المستخدم بناءً على الصلاحية
            updateAdminUI(isAdmin);
            
            if (isAdmin) {
                await logAdminLogin(user.uid);
                showCustomToast("مرحباً بك مسؤول المتجر", "success");
            }
        } else {
            // إنشاء سجل جديد للمستخدم إذا لم يكن موجوداً
            await createUserRecord(user);
            isAdmin = false;
            updateAdminUI(false);
        }
        
    } catch (error) {
        console.error('خطأ في التحقق من حالة المسؤول:', error);
        isAdmin = false;
        updateAdminUI(false);
    }
}

// =====================================
// وظائف المصادقة
// =====================================

// تهيئة مصادقة Firebase
export function setupFirebaseAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await checkUserAdminStatus(user);
            
            // تحديث آخر دخول للمستخدم
            if (user.email) {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                }).catch(() => {});
            }
            
            await loadStoreData();
            updateUserUI();
            
            // إظهار التطبيق الرئيسي بعد المصادقة
            showMainApp();
            
        } else {
            currentUser = null;
            isAdmin = false;
            showAuthScreen();
        }
    });
}

// تسجيل الدخول بجوجل
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        showCustomToast("تم تسجيل الدخول بنجاح", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول بجوجل:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showCustomToast("تم إغلاق نافذة تسجيل الدخول", "warning");
        } else {
            showCustomToast("فشل تسجيل الدخول بجوجل", "error");
        }
        return null;
    }
}

// تبديل وضع المصادقة (تسجيل الدخول/إنشاء حساب)
export function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const displayNameInput = document.getElementById('displayNameInput');
    const signInBtn = document.getElementById('signInWithEmailBtn');
    const toggleBtn = document.getElementById('toggleSignUpMode');
    
    if (isSignUpMode) {
        displayNameInput.classList.remove('hidden');
        displayNameInput.required = true;
        signInBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب';
        signInBtn.id = 'signUpWithEmailBtn';
        toggleBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول بدلاً من ذلك';
    } else {
        displayNameInput.classList.add('hidden');
        displayNameInput.required = false;
        signInBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
        signInBtn.id = 'signInWithEmailBtn';
        toggleBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
    }
    
    // إعادة تعيين مستمعي الأحداث للزر الرئيسي
    const emailAuthForm = document.getElementById('emailAuthForm');
    emailAuthForm.removeEventListener('submit', handleAuthSubmit);
    emailAuthForm.addEventListener('submit', handleAuthSubmit);
}

// معالج إرسال نموذج المصادقة الموحد
export async function handleAuthSubmit(e) {
    e.preventDefault();
    
    if (isSignUpMode) {
        await handleEmailSignUp(e);
    } else {
        await handleEmailSignIn(e);
    }
}

// تسجيل الدخول بالبريد الإلكتروني
async function handleEmailSignIn(e) {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    const errors = validateAuthForm(email, password);
    if (errors.length > 0) {
        showError(errors[0]);
        return;
    }
    
    const signInBtn = document.getElementById('signInWithEmailBtn');
    showLoading(signInBtn);
    
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        showCustomToast("تم تسجيل الدخول بنجاح", "success");
        await logLoginAttempt(result.user.uid, true);
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        await logLoginAttempt(null, false, email);
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            showError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        } else if (error.code === 'auth/invalid-email') {
            showError("البريد الإلكتروني غير صالح", 'emailInput');
        } else if (error.code === 'auth/too-many-requests') {
            showError("تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى لاحقاً");
        } else {
            showError("حدث خطأ غير متوقع");
        }
    } finally {
        hideLoading(signInBtn);
    }
}

// إنشاء حساب جديد
async function handleEmailSignUp(e) {
    const displayNameInput = document.getElementById('displayNameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const displayName = displayNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!displayName) {
        showError("الرجاء إدخال اسمك الكامل", 'displayNameInput');
        return;
    }
    
    const errors = validateAuthForm(email, password);
    if (errors.length > 0) {
        showError(errors[0]);
        return;
    }
    
    const signUpBtn = document.getElementById('signUpWithEmailBtn');
    showLoading(signUpBtn);
    
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, {
            displayName: displayName
        });
        
        await createUserRecord(result.user);
        showCustomToast("تم إنشاء الحساب بنجاح", "success");
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showError("هذا البريد الإلكتروني مستخدم بالفعل", 'emailInput');
        } else if (error.code === 'auth/weak-password') {
            showError("كلمة المرور ضعيفة جداً", 'passwordInput');
        } else if (error.code === 'auth/invalid-email') {
            showError("البريد الإلكتروني غير صالح", 'emailInput');
        } else {
            showError("فشل إنشاء الحساب");
        }
    } finally {
        hideLoading(signUpBtn);
    }
}

// تسجيل الدخول كضيف
export async function signInAsGuest() {
    try {
        const result = await signInAnonymously(auth);
        showCustomToast("مرحباً بك كضيف", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول كضيف:', error);
        showCustomToast("فشل تسجيل الدخول كضيف", "error");
        return null;
    }
}

// إعادة تعيين كلمة المرور
export async function handleForgotPassword() {
    const email = document.getElementById('emailInput').value.trim();
    
    if (!email) {
        showError("الرجاء إدخال بريدك الإلكتروني لإعادة تعيين كلمة المرور");
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showCustomToast("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني", "success");
    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        
        if (error.code === 'auth/user-not-found') {
            showError("المستخدم غير موجود", 'emailInput');
        } else if (error.code === 'auth/invalid-email') {
            showError("البريد الإلكتروني غير صالح", 'emailInput');
        } else {
            showError("فشل إرسال رابط إعادة التعيين");
        }
    }
}

// تسجيل الخروج
export async function handleSignOut() {
    try {
        if (isAdmin) {
            await logAdminAction('LOGOUT');
        }
        
        await signOut(auth);
        showCustomToast("تم تسجيل الخروج بنجاح", "success");
        
        // مسح حالة المسؤول من الذاكرة المحلية
        if (currentUser) {
            localStorage.removeItem(`admin_${currentUser.uid}`);
            localStorage.removeItem(`admin_time_${currentUser.uid}`);
        }
        
        currentUser = null;
        isAdmin = false;
        closeAdminPanel();
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        showCustomToast("فشل تسجيل الخروج", "error");
    }
}
