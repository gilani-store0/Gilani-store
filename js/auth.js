// js/auth.js - النسخة المُعدّلة

// حالة المستخدم
let currentUser = null;
let currentUserData = null;
let isUserAdminFlag = false;

// تهيئة المصادقة
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
                createdAt: new Date().toISOString()
            };
            
            currentUser = guestUser;
            currentUserData = guestUser;
            isUserAdminFlag = false;
            
            resolve({ 
                success: true, 
                user: guestUser, 
                userData: guestUser, 
                isAdmin: false,
                isGuest: true
            });
            return;
        }
        
        const unsubscribe = window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('المستخدم مسجل الدخول من Firebase:', user.email);
                currentUser = user;
                
                try {
                    // الاعتماد على checkAndUpdateAdminStatus لتحديد حالة الأدمن
                    const isAdmin = await checkAndUpdateAdminStatus();
                    
                    // currentUserData يتم تحديثه داخل getUserData
                    const userData = await getUserData(user);
                    
                    console.log('بيانات المستخدم المحملة:', userData);
                    console.log('حالة المسؤول النهائية:', isAdmin);
                    
                    // تحديث الحالة بعد تسجيل الدخول بدون تمرير حالة الأدمن
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
                    isUserAdminFlag = false; // التأكد من أن الحالة false عند الخطأ
                    
                    const userState = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
                        photoURL: user.photoURL,
                        isAdmin: false, // القيمة هنا يجب أن تكون false دائمًا
                        createdAt: new Date().toISOString(),
                        isGuest: false
                    };
                    
                    localStorage.setItem('jamalek_user', JSON.stringify(userState));
                    
                    resolve({ 
                        success: true, 
                        user, 
                        userData: userState, 
                        isAdmin: false,
                        isGuest: false
                    });
                }
            } else {
                console.log('لا يوجد مستخدم مسجل من Firebase');
                currentUser = null;
                currentUserData = null;
                isUserAdminFlag = false;
                localStorage.removeItem('jamalek_user');
                document.body.classList.remove('admin-mode');
                resolve({ success: false, user: null, isGuest: true });
            }
        }, (error) => {
            console.error('خطأ في مراقبة حالة المصادقة:', error);
            reject(error);
        });
    });
}

// تسجيل الدخول باستخدام Google
async function signInWithGoogle() {
    try {
        console.log('بدء تسجيل الدخول باستخدام Google...');
        
        if (!window.auth || !firebase) {
            throw new Error('Firebase غير متاح');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        console.log('تم تسجيل الدخول بنجاح باستخدام Google:', user.email);
        
        await saveUserData(user);
        await updateUserStatusAfterLogin(user, false);
        const isAdmin = await checkAndUpdateAdminStatus();
        
        console.log('حالة المسؤول بعد تسجيل الدخول:', isAdmin);
        
        return { 
            success: true, 
            user,
            userData: currentUserData,
            isAdmin: isAdmin,
            isGuest: false
        };
    } catch (error) {
        console.error('تفاصيل خطأ تسجيل الدخول باستخدام Google:', error);
        return { 
            success: false, 
            error: getErrorMessage(error),
            isGuest: true
        };
    }
}

// تسجيل الدخول باستخدام البريد الإلكتروني
async function signInWithEmail(email, password) {
    try {
        console.log('محاولة تسجيل الدخول بالبريد:', email);
        
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        if (!email || !password) {
            throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
        }
        
        const result = await window.auth.signInWithEmailAndPassword(email.trim(), password);
        const user = result.user;
        console.log('تم تسجيل الدخول بنجاح:', user.email);
        
        await updateLastLogin(user.uid);
        await updateUserStatusAfterLogin(user, false);
        const isAdmin = await checkAndUpdateAdminStatus();
        
        return { 
            success: true, 
            user,
            userData: currentUserData,
            isAdmin: isAdmin,
            isGuest: false
        };
    } catch (error) {
        console.error('تفاصيل خطأ تسجيل الدخول:', error);
        return { 
            success: false, 
            error: getErrorMessage(error),
            isGuest: true
        };
    }
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, displayName) {
    try {
        console.log('إنشاء حساب جديد:', email);
        
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        if (!email || !password) {
            throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
        }
        
        if (password.length < 6) {
            throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        
        const result = await window.auth.createUserWithEmailAndPassword(email.trim(), password);
        const user = result.user;
        console.log('تم إنشاء الحساب:', user.email);
        
        if (displayName && displayName.trim()) {
            await user.updateProfile({ 
                displayName: displayName.trim() 
            });
            console.log('تم تحديث اسم المستخدم:', displayName);
        }
        
        await saveUserData(user);
        await updateUserStatusAfterLogin(user, false);
        const isAdmin = await checkAndUpdateAdminStatus();
        
        return { 
            success: true, 
            user,
            userData: currentUserData,
            isAdmin: isAdmin,
            isGuest: false
        };
    } catch (error) {
        console.error('تفاصيل خطأ إنشاء الحساب:', error);
        return { 
            success: false, 
            error: getErrorMessage(error),
            isGuest: true
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
        console.log('تم تحديث آخر وقت دخول للمستخدم:', userId);
    } catch (error) {
        console.error('خطأ في تحديث آخر وقت دخول:', error);
    }
}

// تسجيل الدخول كضيف
function signInAsGuest() {
    try {
        console.log('تسجيل الدخول كضيف...');
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
        console.log('تم تسجيل الدخول كضيف');
        
        return { 
            success: true, 
            user: guestUser, 
            userData: guestUser,
            isAdmin: false,
            isGuest: true
        };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول كضيف:', error);
        return { 
            success: false, 
            error: 'خطأ في تسجيل الدخول كضيف',
            isGuest: true
        };
    }
}

// استعادة كلمة المرور
async function resetPassword(email) {
    try {
        console.log('إعادة تعيين كلمة المرور لـ:', email);
        
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        if (!email || !email.includes('@')) {
            throw new Error('البريد الإلكتروني غير صحيح');
        }
        
        await window.auth.sendPasswordResetEmail(email.trim());
        console.log('تم إرسال رابط إعادة التعيين');
        
        return { success: true };
    } catch (error) {
        console.error('تفاصيل خطأ إعادة تعيين كلمة المرور:', error);
        return { 
            success: false, 
            error: getErrorMessage(error) 
        };
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        console.log('تسجيل الخروج...');
        
        if (currentUser && !currentUser.isGuest && window.auth) {
            await window.auth.signOut();
            console.log('تم تسجيل الخروج من Firebase');
        }
        
        currentUser = null;
        currentUserData = null;
        isUserAdminFlag = false;
        
        localStorage.removeItem('jamalek_user');
        document.body.classList.remove('admin-mode');
        console.log('تم مسح بيانات المستخدم من localStorage');
        
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
        const userSnap = await userRef.get();
        
        const isFirstLogin = !userSnap.exists();
        
        const adminEmails = [
            "yxr.249@gmail.com", 
            "admin@qb-store.com"
        ];
        
        const shouldBeAdmin = adminEmails.includes(user.email?.toLowerCase());
        
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
            photoURL: user.photoURL,
            createdAt: isFirstLogin ? firebase.firestore.FieldValue.serverTimestamp() : userSnap.data().createdAt,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: shouldBeAdmin || (userSnap.exists() ? userSnap.data().isAdmin : false),
            phone: userSnap.exists() ? userSnap.data().phone || '' : '',
            address: userSnap.exists() ? userSnap.data().address || '' : '',
            isGuest: false 
        };
        
        console.log(`حفظ بيانات المستخدم: ${user.email}, isAdmin: ${userData.isAdmin}`);
        await userRef.set(userData, { merge: true });
        
        if (currentUserData && currentUserData.uid === user.uid) {
            currentUserData = { ...currentUserData, ...userData };
        }
        
        // لا نحدد حالة الأدمن هنا مباشرة
        console.log('تم حفظ بيانات المستخدم بنجاح');
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return { success: false };
    }
}

// جلب بيانات المستخدم من Firestore
async function getUserData(user) {
    try {
        if (user.isGuest) {
            console.log('المستخدم ضيف، إرجاع بيانات محلية');
            currentUserData = user;
            return user;
        }
        
        if (!window.db) {
            console.warn('Firestore غير متاح، استخدام بيانات محلية');
            const localData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'مستخدم',
                photoURL: user.photoURL,
                isAdmin: false,
                isGuest: false,
                createdAt: new Date()
            };
            currentUserData = localData;
            return localData;
        }
        
        const userRef = window.db.collection("users").doc(user.uid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists()) {
            console.log('تم جلب بيانات المستخدم من Firestore');
            const userData = userSnap.data();
            userData.isGuest = false;
            currentUserData = userData; // تحديث الحالة العامة
            return userData;
        } else {
            console.log('المستخدم غير موجود في Firestore، سيتم إنشاؤه');
            await saveUserData(user);
            const newSnap = await userRef.get();
            const newData = newSnap.data();
            newData.isGuest = false;
            currentUserData = newData; // تحديث الحالة العامة
            return newData;
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        const errorData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'مستخدم',
            photoURL: user.photoURL,
            isAdmin: false,
            isGuest: false,
            createdAt: new Date()
        };
        currentUserData = errorData;
        return errorData;
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
    console.log('تم تعيين حالة المسؤول إلى:', status);
    
    // تحديث class الأدمن للـ body
    if (status) {
        document.body.classList.add('admin-mode');
    } else {
        document.body.classList.remove('admin-mode');
    }
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
        'auth/invalid-credential': 'بيانات الاعتماد غير صالحة. تحقق من البريد الإلكتروني وكلمة المرور',
        'auth/invalid-login-credentials': 'بيانات تسجيل الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور',
        'default': 'حدث خطأ غير متوقع: ' + (error.message || 'يرجى المحاولة مرة أخرى')
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
            // لا نثق بحالة الأدمن من localStorage
            isUserAdminFlag = false; 
            console.log('تم تحميل المستخدم من localStorage:', userData.displayName);
            
            // لا تقم بإضافة admin-mode هنا، انتظر التحقق من Firestore
            
            return { 
                success: true, 
                user: userData, 
                isAdmin: false, // القيمة الأولية دائمًا false
                isGuest: userData.isGuest || false
            };
        }
        console.log('لا يوجد مستخدم محفوظ في localStorage');
        return { success: false, user: null, isGuest: true };
    } catch (error) {
        console.error('خطأ في تحميل حالة المستخدم:', error);
        return { success: false, user: null, isGuest: true };
    }
}

// اختبار اتصال Firebase
async function testFirebaseConnection() {
    try {
        console.log('اختبار اتصال Firebase...');
        
        if (!window.auth || !window.db) {
            return { success: false, error: 'Firebase غير مهيأ' };
        }
        
        const authUser = window.auth.currentUser;
        console.log('المستخدم الحالي في Auth:', authUser?.email || 'لا يوجد');
        
        return { success: true };
    } catch (error) {
        console.error('❌ فشل اختبار اتصال Firebase:', error);
        return { success: false, error: error.message };
    }
}

// التحقق من صلاحية المسؤول وتحديث الواجهة (مصدر الحقيقة الوحيد)
async function checkAndUpdateAdminStatus() {
    try {
        const user = getCurrentUser();
        
        if (!user || user.isGuest) {
            console.log('المستخدم ضيف أو غير مسجل، لا يمكن أن يكون مسؤولاً');
            setAdminStatus(false);
            return false;
        }
        
        // جلب أحدث البيانات من Firestore
        const userDataFromDb = await getUserData(user);
        
        if (userDataFromDb && userDataFromDb.isAdmin) {
            console.log('✅ التحقق من Firestore: المستخدم مسؤول:', user.email);
            setAdminStatus(true);
            isUserAdminFlag = true; // تحديث الحالة العامة
            return true;
        } else {
            console.log('❌ التحقق من Firestore: المستخدم ليس مسؤولاً:', user.email);
            setAdminStatus(false);
            isUserAdminFlag = false; // تحديث الحالة العامة
            return false;
        }
    } catch (error) {
        console.error('خطأ في التحقق من حالة المسؤول من Firestore:', error);
        setAdminStatus(false);
        isUserAdminFlag = false;
        return false;
    }
}

// تحديث حالة المستخدم بعد تسجيل الدخول
async function updateUserStatusAfterLogin(user, isGuest = false) {
    try {
        currentUser = user;
        
        if (!isGuest) {
            // حفظ البيانات الأساسية فقط بدون حالة الأدمن
            const userState = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
                photoURL: user.photoURL,
                isAdmin: false, // القيمة المحفوظة دائمًا false للأمان
                createdAt: user.createdAt || new Date().toISOString(),
                isGuest: false
            };
            
            localStorage.setItem('jamalek_user', JSON.stringify(userState));
        }
        
        console.log('تم تحديث حالة المستخدم الأساسية في localStorage:', user.displayName);
        return true;
    } catch (error) {
        console.error('خطأ في تحديث حالة المستخدم:', error);
        return false;
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
window.testFirebaseConnection = testFirebaseConnection;
window.checkAndUpdateAdminStatus = checkAndUpdateAdminStatus;
window.updateUserStatusAfterLogin = updateUserStatusAfterLogin;
