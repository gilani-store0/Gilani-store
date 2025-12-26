// js/auth.js - معالجة المصادقة (النسخة المصححة)

// حالة المستخدم
let currentUser = null;
let currentUserData = null;
let isUserAdminFlag = false;

// تهيئة المصادقة
function initAuth() {
    return new Promise((resolve) => {
        if (!window.auth) {
            console.warn('Firebase Auth غير متاح، استخدام وضع الضيف');
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
            
            resolve({ 
                success: true, 
                user: guestUser, 
                userData: guestUser, 
                isAdmin: false 
            });
            return;
        }
        
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // مستخدم مسجل الدخول من Firebase
                console.log('المستخدم مسجل الدخول:', user.email);
                currentUser = user;
                
                try {
                    currentUserData = await getUserData(user);
                    isUserAdminFlag = currentUserData?.isAdmin || false;
                    resolve({ 
                        success: true, 
                        user, 
                        userData: currentUserData, 
                        isAdmin: isUserAdminFlag 
                    });
                } catch (error) {
                    console.error('خطأ في تحميل بيانات المستخدم:', error);
                    resolve({ 
                        success: false, 
                        error: 'خطأ في تحميل بيانات المستخدم' 
                    });
                }
            } else {
                // لا يوجد مستخدم مسجل من Firebase
                console.log('لا يوجد مستخدم مسجل من Firebase');
                currentUser = null;
                currentUserData = null;
                isUserAdminFlag = false;
                resolve({ success: false, user: null });
            }
        }, (error) => {
            console.error('خطأ في مراقبة حالة المصادقة:', error);
            resolve({ success: false, error: error.message });
        });
    });
}

// تسجيل الدخول باستخدام Google
async function signInWithGoogle() {
    try {
        if (!window.auth || !firebase) {
            throw new Error('Firebase غير متاح');
        }
        
        // استخدام firebase من النافذة العامة
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        
        // حفظ بيانات المستخدم في Firestore
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول باستخدام Google:', error);
        return { 
            success: false, 
            error: getErrorMessage(error) 
        };
    }
}

// تسجيل الدخول باستخدام البريد الإلكتروني
async function signInWithEmail(email, password) {
    try {
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        const result = await window.auth.signInWithEmailAndPassword(email, password);
        const user = result.user;
        
        // تحديث آخر وقت دخول
        await updateLastLogin(user.uid);
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { 
            success: false, 
            error: getErrorMessage(error) 
        };
    }
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, displayName) {
    try {
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        const result = await window.auth.createUserWithEmailAndPassword(email, password);
        const user = result.user;
        
        // تحديث اسم المستخدم
        if (displayName) {
            await user.updateProfile({ displayName });
        }
        
        // حفظ بيانات المستخدم في Firestore
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        return { 
            success: false, 
            error: getErrorMessage(error) 
        };
    }
}

// تحديث آخر وقت دخول
async function updateLastLogin(userId) {
    try {
        if (!window.db) return;
        
        const userRef = window.db.collection("users").doc(userId);
        await userRef.update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('خطأ في تحديث آخر وقت دخول:', error);
    }
}

// تسجيل الدخول كضيف
function signInAsGuest() {
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
async function resetPassword(email) {
    try {
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        await window.auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('خطأ في إرسال رابط إعادة التعيين:', error);
        return { 
            success: false, 
            error: getErrorMessage(error) 
        };
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        if (currentUser && !currentUser.isGuest && window.auth) {
            await window.auth.signOut();
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
        if (!window.db) {
            console.warn('Firestore غير متاح، تجاهل حفظ بيانات المستخدم');
            return { success: false };
        }
        
        const userRef = window.db.collection("users").doc(user.uid);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
            photoURL: user.photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false,
            phone: '',
            address: ''
        };
        
        await userRef.set(userData, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return { success: false };
    }
}

// جلب بيانات المستخدم من Firestore
async function getUserData(user) {
    try {
        // إذا كان ضيفاً، ارجع بياناته المحلية
        if (user.isGuest) {
            return user;
        }
        
        if (!window.db) {
            console.warn('Firestore غير متاح، استخدام بيانات محلية');
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'مستخدم',
                photoURL: user.photoURL,
                isAdmin: false,
                createdAt: new Date()
            };
        }
        
        const userRef = window.db.collection("users").doc(user.uid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            await saveUserData(user);
            const newSnap = await userRef.get();
            return newSnap.data();
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        return null;
    }
}

// تحديث بيانات المستخدم
async function updateUserData(userId, userData) {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، تجاهل تحديث البيانات');
            return { success: false, error: 'Firestore غير متاح' };
        }
        
        const userRef = window.db.collection("users").doc(userId);
        await userRef.update({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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

// جلب جميع المستخدمين (للأدمن فقط)
async function getAllUsers() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، ارجاع قائمة فارغة');
            return [];
        }
        
        const snapshot = await window.db.collection("users").get();
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
async function getUsersCount() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، ارجاع 0');
            return 0;
        }
        
        const snapshot = await window.db.collection("users").get();
        return snapshot.size;
    } catch (error) {
        console.error('خطأ في جلب عدد المستخدمين:', error);
        return 0;
    }
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    return currentUser;
}

// الحصول على بيانات المستخدم الحالي
function getCurrentUserData() {
    return currentUserData;
}

// التحقق إذا كان المستخدم مسؤولاً
function isUserAdmin() {
    return isUserAdminFlag;
}

// تعيين حالة المسؤول
function setAdminStatus(status) {
    isUserAdminFlag = status;
}

// دالة مساعدة لتحويل كود الخطأ إلى رسالة مفهومة
function getErrorMessage(error) {
    if (!error) return 'حدث خطأ غير متوقع';
    
    const errorCode = error.code || '';
    
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
        'auth/app-deleted': 'تم حذف التطبيق',
        'auth/app-not-authorized': 'التطبيق غير مصرح له',
        'auth/argument-error': 'خطأ في المدخلات',
        'auth/invalid-api-key': 'مفتاح API غير صالح',
        'auth/invalid-user-token': 'رمز المستخدم غير صالح',
        'auth/user-token-expired': 'انتهت صلاحية رمز المستخدم',
        'auth/unauthorized-domain': 'نطاق غير مصرح به',
        'auth/web-storage-unsupported': 'التخزين عبر الويب غير مدعوم',
        'default': error.message || 'حدث خطأ غير متوقع'
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
}

// تحميل حالة المستخدم من localStorage
function loadUserFromLocalStorage() {
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

// جعل الدوال متاحة عالمياً
window.initAuth = initAuth;
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signInAsGuest = signInAsGuest;
window.resetPassword = resetPassword;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserData = getCurrentUserData;
window.getUserData = getUserData;
window.isUserAdmin = isUserAdmin;
window.setAdminStatus = setAdminStatus;
window.updateUserData = updateUserData;
window.getAllUsers = getAllUsers;
window.getUsersCount = getUsersCount;
window.loadUserFromLocalStorage = loadUserFromLocalStorage;
window.getErrorMessage = getErrorMessage;