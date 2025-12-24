// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

// Initialize Firebase
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}
const auth = firebase.auth();
const db = firebase.firestore();

// بيانات المتجر
let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249123456789",
        phone: "+249 123 456 789",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
    },
    products: [],
    categories: [
        { id: "featured", name: "المميز", icon: "fa-star" },
        { id: "new", name: "الجديد", icon: "fa-bolt" },
        { id: "sale", name: "العروض", icon: "fa-percentage" },
        { id: "best", name: "الأكثر مبيعاً", icon: "fa-fire" }
    ]
};

// حالة التطبيق
let currentUser = null;
let isAdmin = false;
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

// تهيئة المتجر
document.addEventListener('DOMContentLoaded', function() {
    setupFirebaseAuth();
    setupEventListeners();
    checkInitialAuth();
    setupFullscreenMobile();
    setupSimpleAuthUI(); // تهيئة واجهة تسجيل الدخول الجديدة
});

// تهيئة واجهة تسجيل الدخول الجديدة
function setupSimpleAuthUI() {
    const showEmailBtn = document.getElementById('showEmailFormBtn');
    const backBtn = document.getElementById('backToOptions');
    const emailSection = document.getElementById('emailAuthSection');
    const authOptions = document.getElementById('authOptions');

    if (showEmailBtn && authOptions && emailSection) {
        showEmailBtn.addEventListener('click', () => {
            authOptions.classList.add('hidden');
            emailSection.classList.remove('hidden');
        });
    }

    if (backBtn && authOptions && emailSection) {
        backBtn.addEventListener('click', () => {
            emailSection.classList.add('hidden');
            authOptions.classList.remove('hidden');
        });
    }

    // إضافة مستمع لتبديل عرض كلمة المرور
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
}

// إعداد مصادقة Firebase
function setupFirebaseAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await checkUserAdminStatus(user);

            // التوجيه حسب نوع المستخدم
            if (isAdmin) {
                const shouldRedirect = localStorage.getItem('redirectToAdmin') !== 'false';
                if (shouldRedirect) {
                    openAdminPanel();
                } else {
                    showMainApp();
                }
            } else {
                showMainApp();
            }
            
            await loadStoreData();
            updateUserUI();
            
            // تحديث آخر دخول للمستخدم
            if (user.email) {
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {});
            }
        } else {
            showAuthScreen();
        }
    });
}

// =====================================
// نظام التحقق من صحة البيانات
// =====================================

// التحقق من صحة البيانات قبل الإرسال
function validateAuthForm(email, password, isSignUp = false) {
    const errors = [];
    
    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        errors.push("البريد الإلكتروني مطلوب");
    } else if (!emailRegex.test(email)) {
        errors.push("البريد الإلكتروني غير صالح");
    }
    
    // التحقق من كلمة المرور
    if (!password) {
        errors.push("كلمة المرور مطلوبة");
    } else if (password.length < 6) {
        errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    } else if (isSignUp && !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        errors.push("كلمة المرور يجب أن تحتوي على أحرف وأرقام");
    }
    
    return errors;
}

// عرض رسائل الخطأ المخصصة
function showError(message, elementId = null) {
    // إخفاء جميع رسائل الخطأ السابقة
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    
    // عرض رسالة الخطأ العامة
    const generalError = document.getElementById('generalError');
    if (generalError) {
        generalError.textContent = message;
        generalError.classList.add('show');
        
        setTimeout(() => {
            generalError.classList.remove('show');
        }, 5000);
    }
    
    // إضافة رسالة خطأ لحقل معين إذا تم تحديده
    if (elementId) {
        const input = document.getElementById(elementId);
        if (input) {
            input.style.borderColor = '#EF4444';
            
            // إنشاء عنصر خطأ أسفل الحقل
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message show';
            errorDiv.textContent = message;
            errorDiv.id = `${elementId}-error`;
            
            // إزالة رسالة الخطأ القديمة إذا كانت موجودة
            const oldError = document.getElementById(`${elementId}-error`);
            if (oldError) oldError.remove();
            
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
            
            // استعادة اللون عند التركيز
            input.addEventListener('focus', function() {
                this.style.borderColor = '';
                errorDiv.remove();
            });
        }
    }
}

// عرض مؤشر التحميل
function showLoading(element = null) {
    let button;
    if (element) {
        button = element;
    } else {
        button = document.getElementById('signInWithEmailBtn');
    }
    
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
    }
    
    // إضافة طبقة تحميل عامة
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    loadingOverlay.id = 'globalLoading';
    document.body.appendChild(loadingOverlay);
}

// إخفاء مؤشر التحميل
function hideLoading(element = null) {
    let button;
    if (element) {
        button = element;
    } else {
        button = document.getElementById('signInWithEmailBtn');
    }
    
    if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
    }
    
    const loadingOverlay = document.getElementById('globalLoading');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// =====================================
// نظام الإشعارات المخصصة
// =====================================

// عرض إشعار مخصص
function showCustomToast(message, type = 'info') {
    // إخفاء الإشعارات السابقة
    const oldToasts = document.querySelectorAll('.custom-toast');
    oldToasts.forEach(toast => toast.remove());
    
    // إنشاء إشعار جديد
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let icon = 'fa-info-circle';
    let color = '#9D4EDD';
    
    if (type === 'success') {
        icon = 'fa-check-circle';
        color = '#06D6A0';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
        color = '#EF4444';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
        color = '#F59E0B';
    }
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas ${icon}" style="color: ${color}; font-size: 1.2rem;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// =====================================
// نظام الصلاحيات المحسّن للأدمن
// =====================================

// التحقق من حالة المسؤول مع ذاكرة التخزين المؤقت
async function checkUserAdminStatus(user) {
    try {
        // التحقق من ذاكرة التخزين المؤقت أولاً
        const cachedAdmin = localStorage.getItem(`admin_${user.uid}`);
        if (cachedAdmin === 'true') {
            isAdmin = true;
            updateAdminUI(true);
            return;
        }
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const now = new Date();
            
            // التحقق من حالة الحظر المؤقت
            if (userData.isBlocked) {
                const blockUntil = userData.blockedUntil?.toDate();
                if (blockUntil && now < blockUntil) {
                    showCustomToast("حسابك محظور مؤقتاً. حاول مرة أخرى لاحقاً", "error");
                    await signOut();
                    return;
                } else {
                    await db.collection('users').doc(user.uid).update({
                        isBlocked: false,
                        blockedUntil: null
                    });
                }
            }
            
            isAdmin = userData.isAdmin === true;
            
            // تخزين في ذاكرة التخزين المؤقت
            if (isAdmin) {
                localStorage.setItem(`admin_${user.uid}`, 'true');
                localStorage.setItem(`admin_time_${user.uid}`, now.getTime().toString());
            }
            
            updateAdminUI(isAdmin);
            
            if (isAdmin) {
                await logAdminLogin(user.uid);
                showCustomToast("مرحباً بك مسؤول المتجر", "success");
                
                const shouldRedirect = localStorage.getItem('redirectToAdmin') === 'true';
                if (shouldRedirect) {
                    setTimeout(() => openAdminPanel(), 1000);
                    localStorage.removeItem('redirectToAdmin');
                }
            }
        } else {
            await createUserRecord(user);
            isAdmin = false;
            updateAdminUI(false);
        }
        
        setTimeout(() => {
            localStorage.removeItem(`admin_${user.uid}`);
            localStorage.removeItem(`admin_time_${user.uid}`);
        }, 3600000);
        
    } catch (error) {
        console.error('خطأ في التحقق من حالة المسؤول:', error);
        isAdmin = false;
        updateAdminUI(false);
    }
}

// تحديث واجهة الأدمن
function updateAdminUI(isAdminUser) {
    const adminBtn = document.getElementById('adminToggle');
    const mobileAdminBtn = document.getElementById('mobileAdminToggle');
    
    if (isAdminUser) {
        if (adminBtn) {
            adminBtn.classList.remove('hidden');
            adminBtn.style.backgroundColor = 'var(--accent-color)';
            adminBtn.style.color = '#000';
            adminBtn.innerHTML = '<i class="fas fa-user-shield"></i><span>الإدارة</span>';
        }
        if (mobileAdminBtn) {
            mobileAdminBtn.classList.remove('hidden');
            mobileAdminBtn.style.backgroundColor = 'var(--accent-color)';
            mobileAdminBtn.style.color = '#000';
        }
    } else {
        if (adminBtn) adminBtn.classList.add('hidden');
        if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
    }
}

// تسجيل دخول الأدمن
async function logAdminLogin(adminId) {
    try {
        await db.collection('adminLogs').add({
            adminId: adminId,
            action: 'LOGIN',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await getClientIP(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging admin login:', error);
    }
}

// تسجيل إجراءات الأدمن
async function logAdminAction(action, details = {}) {
    if (!currentUser || !isAdmin) return;
    
    try {
        await db.collection('adminLogs').add({
            adminId: currentUser.uid,
            action: action,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await getClientIP(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

// تسجيل محاولات الدخول
async function logLoginAttempt(uid, success, email = null) {
    try {
        await db.collection('loginAttempts').add({
            uid: uid,
            email: email,
            success: success,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await getClientIP(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
}

// تسجيل الوصول غير المصرح به
async function logUnauthorizedAccess() {
    try {
        await db.collection('securityLogs').add({
            uid: currentUser?.uid || 'anonymous',
            action: 'UNAUTHORIZED_ADMIN_ACCESS',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await getClientIP(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    } catch (error) {
        console.error('Error logging unauthorized access:', error);
    }
}

// =====================================
// الوظائف الأساسية
// =====================================

// التحقق من المصادقة الأولية
function checkInitialAuth() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// إظهار صفحة المصادقة
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    closeAdminPanel();
    closeUserProfile();
}

// إظهار التطبيق الرئيسي
function showMainApp() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    mainApp.style.opacity = '0';
    setTimeout(() => {
        mainApp.style.transition = 'opacity 0.5s ease';
        mainApp.style.opacity = '1';
    }, 50);
}

// تحديث واجهة المستخدم
function updateUserUI() {
    if (!currentUser) return;
    
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');
    const userRole = document.getElementById('userRole');
    
    if (userNameDisplay) {
        userNameDisplay.textContent = currentUser.displayName || 'حسابي';
    }
    
    if (userDisplayName) {
        userDisplayName.textContent = currentUser.displayName || 'مستخدم';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || 'مستخدم ضيف';
    }
    
    if (userPhoto && currentUser.photoURL) {
        userPhoto.src = currentUser.photoURL;
    } else if (userPhoto) {
        userPhoto.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FF6B8B"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">👤</text></svg>';
    }
    
    if (userRole) {
        userRole.textContent = isAdmin ? 'مسؤول' : 'مستخدم عادي';
        userRole.className = isAdmin ? 'role-badge admin' : 'role-badge';
    }
}

// إنشاء سجل مستخدم جديد
async function createUserRecord(user) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || 'مستخدم',
            photoURL: user.photoURL || null,
            isAdmin: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        console.log('تم إنشاء سجل مستخدم جديد');
    } catch (error) {
        console.error('خطأ في إنشاء سجل المستخدم:', error);
    }
}

// =====================================
// نظام تسجيل الدخول المحسّن
// =====================================

// تسجيل الدخول بجوجل
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
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

// تسجيل الدخول بالبريد الإلكتروني
async function signInWithEmail(email, password) {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        showCustomToast("تم تسجيل الدخول بنجاح", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        
        if (error.code === 'auth/user-not-found') {
            showError("المستخدم غير موجود. هل تريد إنشاء حساب جديد؟");
        } else if (error.code === 'auth/wrong-password') {
            showError("كلمة المرور غير صحيحة", 'passwordInput');
        } else if (error.code === 'auth/invalid-email') {
            showError("البريد الإلكتروني غير صالح", 'emailInput');
        } else if (error.code === 'auth/too-many-requests') {
            showError("تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى لاحقاً");
        } else {
            showError("حدث خطأ غير متوقع");
        }
        
        throw error;
    }
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, displayName) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({
            displayName: displayName || email.split('@')[0]
        });
        
        await createUserRecord(result.user);
        showCustomToast("تم إنشاء الحساب بنجاح", "success");
        return result.user;
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
        
        throw error;
    }
}

// تسجيل الدخول كضيف
async function signInAsGuest() {
    try {
        const result = await auth.signInAnonymously();
        showCustomToast("مرحباً بك كضيف", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول كضيف:', error);
        showCustomToast("فشل تسجيل الدخول كضيف", "error");
        return null;
    }
}

// إعادة تعيين كلمة المرور
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        showCustomToast("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني", "success");
        return true;
    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        
        if (error.code === 'auth/user-not-found') {
            showError("المستخدم غير موجود", 'emailInput');
        } else if (error.code === 'auth/invalid-email') {
            showError("البريد الإلكتروني غير صالح", 'emailInput');
        } else {
            showError("فشل إرسال رابط إعادة التعيين");
        }
        
        return false;
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        if (isAdmin) {
            await logAdminAction('LOGOUT');
        }
        
        await auth.signOut();
        showCustomToast("تم تسجيل الخروج بنجاح", "success");
        currentUser = null;
        isAdmin = false;
        
        if (currentUser) {
            localStorage.removeItem(`admin_${currentUser.uid}`);
            localStorage.removeItem(`admin_time_${currentUser.uid}`);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        showCustomToast("فشل تسجيل الخروج", "error");
    }
}

// =====================================
// معالجة أحداث تسجيل الدخول
// =====================================

// تسجيل الدخول بالبريد
async function handleEmailSignIn(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // التحقق من صحة البيانات
    const errors = validateAuthForm(email, password);
    if (errors.length > 0) {
        showError(errors[0]);
        return;
    }
    
    showLoading();
    
    try {
        const user = await signInWithEmail(email, password);
        if (user) {
            await logLoginAttempt(user.uid, true);
        }
    } catch (error) {
        await logLoginAttempt(null, false, email);
    } finally {
        hideLoading();
    }
}

// إنشاء حساب بالبريد
async function handleEmailSignUp() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
        return;
    }
    
    if (password.length < 6) {
        showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل", 'passwordInput');
        return;
    }
    
    const displayName = prompt("الرجاء إدخال اسمك:");
    if (!displayName || displayName.trim() === '') {
        showError("الرجاء إدخال اسم صحيح");
        return;
    }
    
    showLoading(document.getElementById('signUpWithEmailBtn'));
    
    try {
        await signUpWithEmail(email, password, displayName.trim());
    } catch (error) {
        // تم عرض الخطأ في الدالة signUpWithEmail
    } finally {
        hideLoading(document.getElementById('signUpWithEmailBtn'));
    }
}

// إعادة تعيين كلمة المرور
async function handleForgotPassword() {
    const email = document.getElementById('emailInput').value.trim();
    
    if (!email) {
        showError("الرجاء إدخال بريدك الإلكتروني", 'emailInput');
        return;
    }
    
    const confirmReset = confirm(`هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى ${email}؟`);
    if (!confirmReset) return;
    
    showLoading(document.getElementById('forgotPasswordBtn'));
    
    await resetPassword(email);
    
    hideLoading(document.getElementById('forgotPasswordBtn'));
}

// =====================================
// نظام إدارة الأدمن المحسّن
// =====================================

// فتح لوحة التحكم مع التحقق الأمني
async function openAdminPanel() {
    // التحقق من الصلاحية أولاً
    if (!currentUser || !isAdmin) {
        showCustomToast("ليس لديك صلاحية للوصول إلى لوحة التحكم", "error");
        await logUnauthorizedAccess();
        return;
    }
    
    // التحقق الأمني الإضافي
    const requiresReauth = await shouldReauthenticate();
    if (requiresReauth) {
        showCustomToast("الرجاء إعادة تسجيل الدخول للوصول إلى لوحة التحكم", "warning");
        return;
    }
    
    await logAdminAction('ADMIN_PANEL_ACCESS');
    
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.add('active');
    if (adminOverlay) adminOverlay.classList.add('active');
    
    document.addEventListener('click', handleAdminPanelClick);
    
    loadAdminProducts();
    fillSettingsForm();
    document.body.style.overflow = 'hidden';
}

// التحقق مما إذا كان يحتاج إلى إعادة المصادقة
async function shouldReauthenticate() {
    if (!currentUser) return true;
    
    const lastAuthTime = localStorage.getItem(`last_auth_${currentUser.uid}`);
    if (!lastAuthTime) return true;
    
    const now = new Date().getTime();
    const hoursSinceLastAuth = (now - parseInt(lastAuthTime)) / (1000 * 60 * 60);
    
    return hoursSinceLastAuth > 12;
}

// معالجة النقرات في لوحة التحكم
function handleAdminPanelClick(e) {
    const adminSidebar = document.getElementById('adminSidebar');
    if (!adminSidebar || !adminSidebar.classList.contains('active')) {
        document.removeEventListener('click', handleAdminPanelClick);
        return;
    }
    
    if (!adminSidebar.contains(e.target) && !e.target.closest('.admin-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('هل تريد إغلاق لوحة التحكم؟')) {
            closeAdminPanel();
        }
    }
}

// إغلاق لوحة التحكم
function closeAdminPanel() {
    if (isAdmin) {
        logAdminAction('ADMIN_PANEL_CLOSE');
    }
    
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.remove('active');
    if (adminOverlay) adminOverlay.classList.remove('active');
    
    document.removeEventListener('click', handleAdminPanelClick);
    document.body.style.overflow = 'auto';
}

// =====================================
// وظائف إضافية
// =====================================

// الحصول على IP العميل
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// دعم العرض بشاشة كاملة على الجوال
function setupFullscreenMobile() {
    if ('standalone' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
        document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
    }
    
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    window.addEventListener('resize', () => {
        vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
}

// تبديل عرض كلمة المرور
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleBtn.setAttribute('aria-label', 'إخفاء كلمة المرور');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleBtn.setAttribute('aria-label', 'إظهار كلمة المرور');
    }
}

// تحميل البيانات
async function loadStoreData() {
    try {
        // تحميل الإعدادات
        const settingsDoc = await db.collection('settings').doc('store').get();
        if (settingsDoc.exists) {
            storeData.settings = settingsDoc.data();
        }
        
        // تحميل المنتجات
        const productsSnapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        storeData.products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            storeData.products.push(product);
        });
        
        console.log('تم تحميل البيانات:', storeData.products.length, 'منتج');
        
        updateStoreUI();
        renderProducts();
        updateCategoryCounts();
        
    } catch (e) {
        console.error('خطأ في تحميل البيانات:', e);
        loadDefaultProducts();
    }
}

// تحديث الواجهة
function updateStoreUI() {
    // تحديث اسم المتجر
    document.querySelectorAll('.store-name-text').forEach(el => {
        el.textContent = storeData.settings.storeName;
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) {
        footerDesc.textContent = storeData.settings.description;
    }
    
    // تحديث رقم الهاتف
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        contactPhone.textContent = storeData.settings.phone;
    }
    
    // تحديث روابط الواتساب
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=مرحباً%20${encodeURIComponent(storeData.settings.storeName)}%20،%20أود%20الاستفسار%20عن%20المنتجات`;
    
    ['whatsappNavLink', 'mobileWhatsappLink', 'floatingWhatsapp', 'contactWhatsappBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = waLink;
    });
    
    // تحديث السنة
    updateCurrentYear();
}

// عرض المنتجات
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // فلترة المنتجات
    let filtered = storeData.products.filter(product => {
        const matchesFilter = currentFilter === 'all' || product.category === currentFilter;
        const matchesSearch = searchQuery ? 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
            true;
        return matchesFilter && matchesSearch;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // إذا لم توجد منتجات
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>${searchQuery ? 'لا توجد نتائج' : 'لا توجد منتجات'}</h3>
                <p>${searchQuery ? 'لم يتم العثور على منتجات تطابق بحثك' : 'لم تتم إضافة منتجات بعد'}</p>
            </div>
        `;
        return;
    }

    // عرض المنتجات
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            <div class="product-image">
                <div class="image-square-container">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</span>
                <h3 class="product-name">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <p class="product-price">${formatPrice(product.price)}</p>
                <div class="product-stock-info">
                    <small><i class="fas fa-cubes"></i> المتوفر: ${product.stock || 0}</small>
                </div>
                <div class="product-quantity-selector">
                    <button onclick="changeQty('${product.id}', -1)"><i class="fas fa-minus"></i></button>
                    <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock || 99}" readonly>
                    <button onclick="changeQty('${product.id}', 1)"><i class="fas fa-plus"></i></button>
                </div>
                <div class="product-actions">
                    <button class="buy-btn" onclick="orderViaWhatsapp('${product.id}')">
                        <i class="fab fa-whatsapp"></i> اطلب الآن
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// تنسيق السعر
function formatPrice(price) {
    return new Intl.NumberFormat('ar-SD').format(price) + ' ج.س';
}

// =====================================
// إعداد المستمعين للأحداث
// =====================================

function setupEventListeners() {
    // تسجيل الدخول
    document.getElementById('googleSignInBtn')?.addEventListener('click', () => signInWithGoogle());
    document.getElementById('emailAuthForm')?.addEventListener('submit', handleEmailSignIn);
    document.getElementById('signUpWithEmailBtn')?.addEventListener('click', handleEmailSignUp);
    document.getElementById('guestSignInBtn')?.addEventListener('click', () => signInAsGuest());
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', handleForgotPassword);
    
    // البحث في الهيدر
    const productSearchHeader = document.getElementById('productSearchHeader');
    if (productSearchHeader) {
        productSearchHeader.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }
    
    // تسجيل الخروج
    document.getElementById('profileLogoutBtn')?.addEventListener('click', () => signOut());
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => signOut());
    
    // القائمة الجانبية للجوال
    setupMobileMenu();
    
    // البحث والفلترة
    setupSearchAndFilter();
    
    // لوحة التحكم
    setupAdminPanel();
    
    // حساب المستخدم
    setupUserProfile();
    
    // بطاقات الفئات
    setupCategoryCards();
    
    // الأحداث الأخرى
    setupOtherListeners();
    
    // التحقق من محاولة الوصول للوحة التحكم
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        localStorage.setItem('redirectToAdmin', 'true');
    }
}

// القائمة الجانبية للجوال
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeMobileMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // زر الإدارة في الجوال
    document.getElementById('mobileAdminToggle')?.addEventListener('click', () => {
        closeMobileMenu();
        openAdminPanel();
    });
    
    // زر حساب المستخدم في الجوال
    document.getElementById('mobileUserToggle')?.addEventListener('click', () => {
        closeMobileMenu();
        openUserProfile();
    });
}

function closeMobileMenu() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// البحث والفلترة
function setupSearchAndFilter() {
    const productSearch = document.getElementById('productSearch');
    const productSort = document.getElementById('productSort');
    
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }
    
    if (productSort) {
        productSort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }
    
    // أزرار الفلترة
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });
}

// لوحة التحكم الأساسية
function setupAdminPanel() {
    const adminToggle = document.getElementById('adminToggle');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (adminToggle) {
        adminToggle.addEventListener('click', openAdminPanel);
    }
    
    if (adminOverlay) {
        adminOverlay.addEventListener('click', closeAdminPanel);
    }
    
    // تبويبات لوحة التحكم
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
            this.classList.add('active');
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');
            
            if (this.dataset.tab === 'products-list') {
                loadAdminProducts();
            } else if (this.dataset.tab === 'users') {
                loadAdminUsers();
            } else if (this.dataset.tab === 'settings') {
                fillSettingsForm();
            } else if (this.dataset.tab === 'statistics') {
                loadAdminStatistics();
            }
        });
    });
    
    // نموذج إضافة منتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }
    
    // نموذج الإعدادات
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
}

// حساب المستخدم
function setupUserProfile() {
    const userToggle = document.getElementById('userToggle');
    const userProfileModal = document.getElementById('userProfileModal');
    
    if (userToggle) {
        userToggle.addEventListener('click', openUserProfile);
    }
}

function openUserProfile() {
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal) {
        userProfileModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        updateUserUI();
    }
}

function closeUserProfile() {
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal) {
        userProfileModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// إعداد بطاقات الفئات
function setupCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            currentFilter = category;
            renderProducts();
            
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// الأحداث الأخرى
function setupOtherListeners() {
    // تحديث السنة
    updateCurrentYear();
    
    // إغلاق لوحات التحكم بمفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeAdminPanel();
            closeUserProfile();
            closeEditModal();
        }
    });
    
    // إغلاق النوافذ المنبثقة بالنقر خارجها
    document.addEventListener('click', (e) => {
        const userProfileModal = document.getElementById('userProfileModal');
        const editProductModal = document.getElementById('editProductModal');
        
        if (userProfileModal && !userProfileModal.classList.contains('hidden') && 
            e.target === userProfileModal) {
            closeUserProfile();
        }
        
        if (editProductModal && !editProductModal.classList.contains('hidden') && 
            e.target === editProductModal) {
            closeEditModal();
        }
    });
}

// تحديث السنة الحالية
function updateCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// تحديث عدد المنتجات في الفئات
function updateCategoryCounts() {
    storeData.categories.forEach(cat => {
        const count = storeData.products.filter(p => p.category === cat.id).length;
        const el = document.getElementById(`${cat.id}Count`);
        if (el) el.textContent = `${count} منتج`;
    });
}

// الطلب عبر الواتساب
function orderViaWhatsapp(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) {
        showCustomToast("المنتج غير موجود", "error");
        return;
    }
    
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    const totalPrice = product.price * quantity;
    
    const userName = currentUser?.displayName || 'عميل';
    const userContact = currentUser?.email ? `\nالبريد الإلكتروني: ${currentUser.email}` : '';
    
    const message = `مرحباً ${storeData.settings.storeName}، 

أنا ${userName}، أود طلب المنتج التالي:

المنتج: ${product.name}
الكمية: ${quantity}
السعر الإجمالي: ${formatPrice(totalPrice)}
الفئة: ${storeData.categories.find(c => c.id === product.category)?.name || product.category}
${product.description ? `الوصف: ${product.description}` : ''}
${userContact}

يرجى التواصل معي للتفاصيل.`;
    
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

// تحميل المنتجات في لوحة التحكم
async function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    if (storeData.products.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>لا توجد منتجات</h3>
                <p>قم بإضافة منتجك الأول</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = storeData.products.map(product => `
        <div class="admin-product-item">
            <div class="product-info-small">
                <div class="admin-product-image-container">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <p>${formatPrice(product.price)}</p>
                    <small>${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</small>
                </div>
            </div>
            <div class="product-actions-small">
                <button class="edit-btn" onclick="openEditModal('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// حذف منتج
async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        await db.collection('products').doc(id).delete();
        
        storeData.products = storeData.products.filter(p => p.id !== id);
        
        loadAdminProducts();
        renderProducts();
        updateCategoryCounts();
        
        showCustomToast("تم حذف المنتج", "success");
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        showCustomToast("حدث خطأ في حذف المنتج", "error");
    }
}

// إضافة منتج جديد
async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const category = document.getElementById('pCategory').value;
    const imageBase64 = document.getElementById('pImageBase64').value;
    const badge = document.getElementById('pBadge').value.trim();
    const description = document.getElementById('pDesc').value.trim();
    const stock = parseInt(document.getElementById('pStock').value) || 0;
    
    if (!name || !price || !imageBase64) {
        showCustomToast("الرجاء ملء جميع الحقول المطلوبة (بما في ذلك الصورة)", "error");
        return;
    }
    
    if (price <= 0) {
        showCustomToast("الرجاء إدخال سعر صحيح", "error");
        return;
    }
    
    try {
        const newProduct = {
            name: name,
            price: price,
            category: category,
            image: imageBase64,
            stock: stock,
            badge: badge || null,
            description: description || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('products').add(newProduct);
        
        newProduct.id = docRef.id;
        
        storeData.products.unshift(newProduct);
        
        e.target.reset();
        removeSelectedImage();
        
        renderProducts();
        loadAdminProducts();
        updateCategoryCounts();
        
        const productsTab = document.querySelector('.admin-tab-btn[data-tab="products-list"]');
        if (productsTab) productsTab.click();
        
        showCustomToast("تم إضافة المنتج بنجاح", "success");
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        showCustomToast("حدث خطأ في إضافة المنتج", "error");
    }
}

// تعبئة نموذج الإعدادات
function fillSettingsForm() {
    document.getElementById('sName').value = storeData.settings.storeName;
    document.getElementById('sWhatsapp').value = storeData.settings.whatsapp;
    document.getElementById('sDescription').value = storeData.settings.description;
    document.getElementById('sPhone').value = storeData.settings.phone;
}

// تحديث الإعدادات
async function handleUpdateSettings(e) {
    e.preventDefault();
    
    storeData.settings.storeName = document.getElementById('sName').value.trim();
    storeData.settings.whatsapp = document.getElementById('sWhatsapp').value.trim();
    storeData.settings.description = document.getElementById('sDescription').value.trim();
    storeData.settings.phone = document.getElementById('sPhone').value.trim();
    
    try {
        await db.collection('settings').doc('store').set(storeData.settings, { merge: true });
        updateStoreUI();
        e.target.reset();
        fillSettingsForm();
        showCustomToast("تم تحديث الإعدادات بنجاح", "success");
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        showCustomToast("حدث خطأ في حفظ البيانات", "error");
    }
}

// إدارة المستخدمين
async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        if (users.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h3>لا توجد مستخدمين</h3>
                </div>
            `;
            return;
        }
        
        list.innerHTML = users.map(user => `
            <div class="admin-user-item">
                <div class="user-info-small">
                    <div class="admin-user-image-container">
                        <img src="${user.photoURL || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23FF6B8B%22/><text x=%2250%22 y=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>👤</text></svg>'}" alt="${user.displayName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23FF6B8B%22/><text x=%2250%22 y=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>👤</text></svg>'">
                    </div>
                    <div class="user-details">
                        <h4>${user.displayName}</h4>
                        <p>${user.email || 'بريد غير متوفر'}</p>
                        <small style="display: block; margin-top: 5px;">
                            <i class="fas fa-calendar"></i> 
                            ${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('ar-SA') : 'غير معروف'}
                        </small>
                        <span class="role-badge ${user.isAdmin ? 'admin' : ''}" style="margin-top: 5px;">
                            ${user.isAdmin ? 'مسؤول' : 'مستخدم عادي'}
                        </span>
                    </div>
                </div>
                <div class="user-actions-small">
                    <button class="role-btn ${user.isAdmin ? 'admin-btn' : 'user-btn'}" 
                            onclick="toggleUserRole('${user.id}', ${user.isAdmin})">
                        ${user.isAdmin ? 'إلغاء الإدارة' : 'تعيين كمسؤول'}
                    </button>
                    ${!user.isAdmin ? `
                    <button class="delete-btn" style="background: #FF6B8B;" 
                            onclick="toggleUserBlock('${user.id}', ${user.isBlocked || false})">
                        <i class="fas ${user.isBlocked ? 'fa-unlock' : 'fa-ban'}"></i>
                    </button>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        list.innerHTML = `<p style="color: #ff4757; padding: 20px; text-align: center;">خطأ في تحميل المستخدمين</p>`;
    }
}

// تبديل صلاحية المستخدم
async function toggleUserRole(userId, isCurrentlyAdmin) {
    if (!confirm(`هل تريد ${isCurrentlyAdmin ? 'إلغاء صلاحية الإدارة' : 'تعيين كمشرف'} لهذا المستخدم؟`)) return;
    
    try {
        await db.collection('users').doc(userId).update({
            isAdmin: !isCurrentlyAdmin
        });
        
        showCustomToast("تم تحديث صلاحية المستخدم", "success");
        loadAdminUsers();
    } catch (error) {
        console.error('خطأ في تحديث صلاحية المستخدم:', error);
        showCustomToast("حدث خطأ في تحديث الصلاحية", "error");
    }
}

// حظر/إلغاء حظر المستخدم
async function toggleUserBlock(userId, isCurrentlyBlocked) {
    if (!confirm(`هل تريد ${isCurrentlyBlocked ? 'إلغاء حظر' : 'حظر'} هذا المستخدم؟`)) return;
    
    try {
        const action = isCurrentlyBlocked ? 'UNBLOCK_USER' : 'BLOCK_USER';
        await logAdminAction(action, { userId });
        
        if (isCurrentlyBlocked) {
            await db.collection('users').doc(userId).update({
                isBlocked: false,
                blockedUntil: null
            });
            showCustomToast("تم إلغاء حظر المستخدم", "success");
        } else {
            const blockDuration = prompt("مدة الحظر بالأيام:", "1");
            const days = parseInt(blockDuration) || 1;
            const blockedUntil = new Date();
            blockedUntil.setDate(blockedUntil.getDate() + days);
            
            await db.collection('users').doc(userId).update({
                isBlocked: true,
                blockedUntil: firebase.firestore.Timestamp.fromDate(blockedUntil),
                blockReason: "حظر بواسطة المسؤول"
            });
            showCustomToast(`تم حظر المستخدم لمدة ${days} أيام`, "warning");
        }
        
        loadAdminUsers();
    } catch (error) {
        console.error('خطأ في تحديث حالة الحظر:', error);
        showCustomToast("حدث خطأ في تحديث حالة المستخدم", "error");
    }
}

// تحميل إحصائيات الأدمن
async function loadAdminStatistics() {
    try {
        const [usersCount, productsCount, ordersCount, recentLogs] = await Promise.all([
            db.collection('users').count().get(),
            db.collection('products').count().get(),
            db.collection('orders').count().get(),
            db.collection('adminLogs').orderBy('timestamp', 'desc').limit(10).get()
        ]);
        
        const statsHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 0.9rem;">المستخدمين</h5>
                    <p style="font-size: 2rem; font-weight: bold; margin: 0;">${usersCount.data().count}</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 0.9rem;">المنتجات</h5>
                    <p style="font-size: 2rem; font-weight: bold; margin: 0;">${productsCount.data().count}</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 0.9rem;">الطلبات</h5>
                    <p style="font-size: 2rem; font-weight: bold; margin: 0;">${ordersCount.data().count}</p>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin-top: 20px;">
                <h5 style="margin: 0 0 15px 0; color: var(--secondary-color);">
                    <i class="fas fa-history"></i> آخر نشاطات المسؤولين
                </h5>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${recentLogs.docs.map(doc => {
                        const log = doc.data();
                        return `
                        <div style="padding: 10px; border-bottom: 1px solid #eee;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: bold;">${log.action}</span>
                                <small style="color: #666;">${log.timestamp?.toDate().toLocaleString('ar-SA')}</small>
                            </div>
                            <small style="color: #888;">${log.ip}</small>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('statsContent').innerHTML = statsHTML;
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        document.getElementById('statsContent').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                <p>خطأ في تحميل الإحصائيات</p>
            </div>
        `;
    }
}

// تصدير البيانات
async function exportData() {
    try {
        const [productsSnapshot, settingsDoc] = await Promise.all([
            db.collection('products').get(),
            db.collection('settings').doc('store').get()
        ]);
        
        const products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        
        const settings = settingsDoc.exists ? settingsDoc.data() : storeData.settings;
        
        const exportData = {
            settings: settings,
            products: products,
            categories: storeData.categories,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `beauty-store-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showCustomToast("تم تصدير البيانات", "success");
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showCustomToast("حدث خطأ في تصدير البيانات", "error");
    }
}

// استيراد البيانات
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.settings && Array.isArray(importedData.products)) {
                    if (confirm('هل تريد استيراد البيانات الجديدة؟ سيتم استبدال البيانات الحالية.')) {
                        await db.collection('settings').doc('store').set(importedData.settings);
                        
                        const batch = db.batch();
                        const productsRef = db.collection('products');
                        
                        const oldProducts = await productsRef.get();
                        oldProducts.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        
                        importedData.products.forEach(product => {
                            const { id, ...productData } = product;
                            const newRef = productsRef.doc();
                            batch.set(newRef, {
                                ...productData,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        });
                        
                        await batch.commit();
                        
                        await loadStoreData();
                        showCustomToast("تم استيراد البيانات بنجاح", "success");
                    }
                } else {
                    showCustomToast("ملف غير صالح", "error");
                }
            } catch (err) {
                console.error('خطأ في قراءة الملف:', err);
                showCustomToast("خطأ في قراءة الملف", "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// وظائف معالجة الصور
document.addEventListener('DOMContentLoaded', function() {
    const imageFileInput = document.getElementById('pImageFile');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                showCustomToast("حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)", "error");
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                document.getElementById('pImageBase64').value = base64String;
                
                const preview = document.getElementById('imagePreview');
                const placeholder = document.querySelector('.upload-placeholder');
                
                preview.querySelector('img').src = base64String;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        });
    }
});

function removeSelectedImage() {
    const imageFileInput = document.getElementById('pImageFile');
    const imageBase64Input = document.getElementById('pImageBase64');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.querySelector('.upload-placeholder');
    
    if (imageFileInput) imageFileInput.value = '';
    if (imageBase64Input) imageBase64Input.value = '';
    if (preview) {
        preview.classList.add('hidden');
        const img = preview.querySelector('img');
        if (img) img.src = '';
    }
    if (placeholder) placeholder.classList.remove('hidden');
}

// وظائف تعديل المنتج
async function openEditModal(id) {
    const product = storeData.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editPId').value = product.id;
    document.getElementById('editPName').value = product.name;
    document.getElementById('editPPrice').value = product.price;
    document.getElementById('editPCategory').value = product.category;
    document.getElementById('editPStock').value = product.stock || 0;
    document.getElementById('editPBadge').value = product.badge || '';
    document.getElementById('editPDesc').value = product.description || '';

    document.getElementById('editProductModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editProductModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// تحديث المنتج
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const id = document.getElementById('editPId').value;
            const name = document.getElementById('editPName').value.trim();
            const price = parseFloat(document.getElementById('editPPrice').value);
            const category = document.getElementById('editPCategory').value;
            const stock = parseInt(document.getElementById('editPStock').value) || 0;
            const badge = document.getElementById('editPBadge').value.trim();
            const description = document.getElementById('editPDesc').value.trim();

            try {
                await db.collection('products').doc(id).update({
                    name,
                    price,
                    category,
                    stock,
                    badge: badge || null,
                    description,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                const index = storeData.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    storeData.products[index] = {
                        ...storeData.products[index],
                        name,
                        price,
                        category,
                        stock,
                        badge: badge || null,
                        description
                    };
                }
                
                renderProducts();
                loadAdminProducts();
                updateCategoryCounts();
                closeEditModal();
                
                showCustomToast("تم تحديث المنتج بنجاح", "success");
            } catch (error) {
                console.error('خطأ في تحديث المنتج:', error);
                showCustomToast("حدث خطأ في تحديث المنتج", "error");
            }
        });
    }
});

// وظيفة تغيير الكمية
function changeQty(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    
    let val = parseInt(input.value) + delta;
    const max = parseInt(input.getAttribute('max')) || 99;
    
    if (val < 1) val = 1;
    if (val > max) val = max;
    
    input.value = val;
}

// منتجات افتراضية (للحالات الطارئة)
function loadDefaultProducts() {
    storeData.products = [
        {
            id: "1",
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة يدوم طويلاً",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop&crop=center",
            badge: "الأكثر طلباً",
            stock: 10,
            createdAt: new Date().toISOString()
        }
    ];
    
    renderProducts();
    updateCategoryCounts();
}

// إعداد التطبيق بعد تحميل الصفحة
setTimeout(() => {
    if (!currentUser) {
        showAuthScreen();
    }
}, 100);

// إضافة تأثيرات CSS إضافية
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .feature-item, .social-auth-btn, .auth-input {
            transform: translateY(0);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature-item:hover, .social-auth-btn:hover {
            transform: translateY(-3px);
        }
        
        .auth-input:focus {
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);
});

// إضافة حدث لمعالجة الأخطاء العامة
window.addEventListener('error', function(e) {
    console.error('حدث خطأ:', e.error);
    showCustomToast(`حدث خطأ: ${e.error.message}`, 'error');
});

