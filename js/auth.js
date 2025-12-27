// js/auth.js - النسخة الكاملة المحدثة

// حالة المستخدم
let currentUser = null;
let currentUserData = null;
let isUserAdminFlag = false;

// تهيئة المصادقة
function initAuth() {
    return new Promise((resolve, reject) => {
        if (!window.auth) {
            console.warn('⚠️ Firebase Auth غير متاح، استخدام وضع الضيف');
            const guestUser = createGuestUser();
            currentUser = guestUser;
            currentUserData = guestUser;
            isUserAdminFlag = false;
            resolve({ success: true, user: guestUser, userData: guestUser, isAdmin: false });
            return;
        }
        
        console.log('🔐 بدء مراقبة حالة المصادقة Firebase');
        
        // مراقبة حالة المصادقة
        const unsubscribe = window.auth.onAuthStateChanged(async (user) => {
            unsubscribe();
            
            if (user) {
                console.log('✅ Firebase Auth: مستخدم مسجل -', user.email);
                
                try {
                    // حفظ بيانات المستخدم أولاً
                    await saveUserData(user);
                    
                    // جلب البيانات المحدثة
                    const userData = await getUserData(user);
                    currentUser = user;
                    currentUserData = userData;
                    
                    // التحقق من صلاحيات المسؤول
                    const isAdmin = await verifyAdminStatus(user);
                    isUserAdminFlag = isAdmin;
                    
                    console.log('✅ حالة المسؤول النهائية:', isAdmin);
                    
                    // حفظ في localStorage
                    const userState = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
                        photoURL: user.photoURL,
                        isAdmin: isAdmin,
                        createdAt: userData.createdAt || new Date().toISOString(),
                        isGuest: false
                    };
                    localStorage.setItem('jamalek_user', JSON.stringify(userState));
                    
                    resolve({ success: true, user, userData, isAdmin });
                    
                } catch (error) {
                    console.error('❌ خطأ في معالجة بيانات المستخدم:', error);
                    resolve({ success: false, error: 'خطأ في معالجة بيانات المستخدم' });
                }
            } else {
                console.log('👤 Firebase Auth: لا يوجد مستخدم مسجل');
                currentUser = null;
                currentUserData = null;
                isUserAdminFlag = false;
                resolve({ success: false, user: null });
            }
        }, (error) => {
            console.error('❌ خطأ في مراقبة حالة المصادقة:', error);
            reject(error);
        });
    });
}

// إنشاء مستخدم ضيف
function createGuestUser() {
    return {
        uid: 'guest_' + Date.now(),
        email: null,
        displayName: 'ضيف',
        photoURL: null,
        isGuest: true,
        createdAt: new Date().toISOString()
    };
}

// تحقق من صلاحيات المسؤول
async function verifyAdminStatus(user = null) {
    try {
        const targetUser = user || getCurrentUser();
        
        if (!targetUser || targetUser.isGuest) {
            console.log('👤 المستخدم ضيف أو غير موجود');
            return false;
        }
        
        console.log('🔍 التحقق من صلاحيات المسؤول لـ:', targetUser.email);
        
        const userData = await getUserData(targetUser);
        
        if (!userData) {
            console.warn('⚠️ لا توجد بيانات مستخدم');
            return false;
        }
        
        const isAdmin = userData.isAdmin === true;
        setAdminStatus(isAdmin);
        
        console.log(`✅ نتيجة التحقق: ${targetUser.email} - isAdmin: ${isAdmin}`);
        return isAdmin;
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من صلاحيات المسؤول:', error);
        return false;
    }
}

// تسجيل الدخول باستخدام Google
async function signInWithGoogle() {
    try {
        console.log('🌐 بدء تسجيل الدخول باستخدام Google...');
        
        if (!window.auth || !firebase) {
            throw new Error('Firebase غير متاح');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('✅ تم تسجيل الدخول بـ Google:', user.email);
        
        // حفظ بيانات المستخدم
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ خطأ تسجيل الدخول بـ Google:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

// تسجيل الدخول باستخدام البريد الإلكتروني
async function signInWithEmail(email, password) {
    try {
        console.log('📧 محاولة تسجيل الدخول بالبريد:', email);
        
        if (!window.auth) {
            throw new Error('Firebase Auth غير متاح');
        }
        
        if (!email || !password) {
            throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
        }
        
        const result = await window.auth.signInWithEmailAndPassword(email.trim(), password);
        const user = result.user;
        
        console.log('✅ تم تسجيل الدخول بنجاح:', user.email);
        
        // حفظ بيانات المستخدم
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ خطأ تسجيل الدخول:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, displayName) {
    try {
        console.log('👤 إنشاء حساب جديد:', email);
        
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
        
        console.log('✅ تم إنشاء الحساب:', user.email);
        
        // تحديث اسم المستخدم
        if (displayName && displayName.trim()) {
            await user.updateProfile({ displayName: displayName.trim() });
            console.log('✅ تم تحديث اسم المستخدم:', displayName);
        }
        
        // حفظ بيانات المستخدم
        await saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ خطأ إنشاء الحساب:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

// تسجيل الدخول كضيف
function signInAsGuest() {
    try {
        console.log('👤 تسجيل الدخول كضيف...');
        
        const guestUser = createGuestUser();
        currentUser = guestUser;
        currentUserData = guestUser;
        isUserAdminFlag = false;
        
        // حفظ في localStorage
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
        console.log('✅ تم تسجيل الدخول كضيف');
        
        return { success: true, user: guestUser, userData: guestUser };
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول كضيف:', error);
        return { success: false, error: 'خطأ في تسجيل الدخول كضيف' };
    }
}

// حفظ بيانات المستخدم في Firestore
async function saveUserData(user) {
    try {
        if (!window.db) {
            console.warn('⚠️ Firestore غير متاح، تجاهل حفظ بيانات المستخدم');
            return { success: false };
        }
        
        const userRef = window.db.collection("users").doc(user.uid);
        const userSnap = await userRef.get();
        
        // قائمة المسؤولين
        const adminEmails = [
            "yxr.249@gmail.com", 
            "admin@qb-store.com",
            "admin@qb.com"
        ].map(email => email.toLowerCase());
        
        // تحديد حالة المسؤول
        const isFirstLogin = !userSnap.exists();
        let isAdmin = false;
        
        if (isFirstLogin) {
            // أول دخول: تحقق من البريد
            isAdmin = adminEmails.includes(user.email?.toLowerCase());
            console.log(`📝 أول دخول للمستخدم ${user.email}: isAdmin = ${isAdmin}`);
        } else {
            // مستخدم قديم: استخدم الصلاحية المحفوظة
            isAdmin = userSnap.data()?.isAdmin === true;
            console.log(`📝 مستخدم قديم ${user.email}: isAdmin = ${isAdmin}`);
        }
        
        // بيانات المستخدم
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
            photoURL: user.photoURL,
            createdAt: userSnap.exists() ? userSnap.data().createdAt : firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: isAdmin,
            phone: userSnap.exists() ? userSnap.data().phone || '' : '',
            address: userSnap.exists() ? userSnap.data().address || '' : ''
        };
        
        console.log(`💾 حفظ بيانات المستخدم: ${user.email}, isAdmin: ${userData.isAdmin}`);
        await userRef.set(userData, { merge: true });
        
        // تحديث البيانات المحلية
        currentUserData = userData;
        setAdminStatus(isAdmin);
        
        console.log('✅ تم حفظ بيانات المستخدم');
        return { success: true };
        
    } catch (error) {
        console.error('❌ خطأ في حفظ بيانات المستخدم:', error);
        return { success: false, error: error.message };
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
            console.warn('⚠️ Firestore غير متاح، استخدام بيانات محلية');
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
            console.log('✅ تم جلب بيانات المستخدم من Firestore');
            return userSnap.data();
        } else {
            console.log('⚠️ المستخدم غير موجود في Firestore، سيتم إنشاؤه');
            await saveUserData(user);
            const newSnap = await userRef.get();
            return newSnap.data();
        }
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', error);
        return null;
    }
}

// تحديث بيانات المستخدم
async function updateUserData(userId, userData) {
    try {
        if (!window.db) {
            console.warn('⚠️ Firestore غير متاح');
            return { success: false, error: 'Firestore غير متاح' };
        }
        
        const userRef = window.db.collection("users").doc(userId);
        await userRef.update({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ تم تحديث بيانات المستخدم');
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// جلب جميع المستخدمين
async function getAllUsers() {
    try {
        if (!window.db) return [];
        
        const snapshot = await window.db.collection("users").get();
        const users = [];
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        return users;
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        return [];
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
    console.log(`🔄 تم تعيين حالة المسؤول إلى: ${status}`);
    
    if (currentUserData) {
        currentUserData.isAdmin = status;
        // تحديث localStorage
        const savedUser = localStorage.getItem('jamalek_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                userData.isAdmin = status;
                localStorage.setItem('jamalek_user', JSON.stringify(userData));
            } catch (e) {
                console.error('❌ خطأ في تحديث localStorage:', e);
            }
        }
    }
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
            console.log('✅ تم تحميل المستخدم من localStorage:', userData.displayName);
            return { success: true, user: userData, isAdmin: isUserAdminFlag };
        }
        console.log('📭 لا يوجد مستخدم محفوظ في localStorage');
        return { success: false, user: null };
    } catch (error) {
        console.error('❌ خطأ في تحميل حالة المستخدم:', error);
        return { success: false, user: null };
    }
}

// التحقق من المصادقة وتحديث الواجهة
async function checkAndUpdateAuth() {
    try {
        console.log('🔄 التحقق من حالة المصادقة...');
        
        if (!window.auth) {
            console.warn('⚠️ Firebase Auth غير متاح');
            return { success: false, isGuest: true };
        }
        
        const user = window.auth.currentUser;
        
        if (user) {
            console.log('✅ مستخدم Firebase مسجل:', user.email);
            
            // تحديث البيانات
            await saveUserData(user);
            const userData = await getUserData(user);
            const isAdmin = await verifyAdminStatus(user);
            
            currentUser = user;
            currentUserData = userData;
            setAdminStatus(isAdmin);
            
            // حفظ في localStorage
            const userState = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
                photoURL: user.photoURL,
                isAdmin: isAdmin,
                createdAt: userData.createdAt || new Date().toISOString(),
                isGuest: false
            };
            localStorage.setItem('jamalek_user', JSON.stringify(userState));
            
            return { success: true, user, userData, isAdmin, isGuest: false };
        } else {
            console.log('👤 لا يوجد مستخدم Firebase مسجل');
            return { success: false, isGuest: true };
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من المصادقة:', error);
        return { success: false, isGuest: true };
    }
}

// دالة طوارئ لجعل مستخدم مسؤولاً
function emergencyMakeAdmin(email) {
    if (!window.db) {
        console.error('❌ Firestore غير متاح');
        alert('Firestore غير متاح');
        return;
    }
    
    if (!confirm(`هل أنت متأكد من جعل ${email} مسؤولاً؟`)) return;
    
    window.db.collection("users")
        .where("email", "==", email.toLowerCase())
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                alert(`المستخدم ${email} غير موجود`);
                return;
            }
            
            snapshot.forEach(doc => {
                window.db.collection("users").doc(doc.id).update({
                    isAdmin: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert(`✅ تم جعل ${email} مسؤولاً`);
                    
                    // تحديث الواجهة إذا كان المستخدم الحالي
                    if (currentUser && currentUser.email === email) {
                        setAdminStatus(true);
                        if (window.UI && window.UI.updateUserUI) {
                            window.UI.updateUserUI(currentUser, true);
                        }
                    }
                });
            });
        })
        .catch(error => {
            console.error('❌ خطأ في البحث:', error);
            alert(`خطأ: ${error.message}`);
        });
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
        'auth/invalid-login-credentials': 'بيانات تسجيل الدخول غير صحيحة',
        'auth/unauthorized-domain': 'الدومين غير مصرح به. أضف ' + window.location.hostname + ' إلى Firebase Console',
        'default': 'حدث خطأ غير متوقع: ' + (error.message || 'يرجى المحاولة مرة أخرى')
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
}

// ========== جعل الدوال متاحة عالمياً ==========
window.initAuth = initAuth;
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signInAsGuest = signInAsGuest;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserData = getCurrentUserData;
window.getUserData = getUserData;
window.isUserAdmin = isUserAdmin;
window.setAdminStatus = setAdminStatus;
window.updateUserData = updateUserData;
window.getAllUsers = getAllUsers;
window.loadUserFromLocalStorage = loadUserFromLocalStorage;
window.checkAndUpdateAuth = checkAndUpdateAuth;
window.verifyAdminStatus = verifyAdminStatus;
window.emergencyMakeAdmin = emergencyMakeAdmin;
window.getErrorMessage = getErrorMessage;