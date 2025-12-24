// js/modules/ui.js

import { 
    currentUser, 
    isAdmin, 
    handleSignOut, 
    signInWithGoogle, 
    signInAsGuest, 
    handleForgotPassword, 
    handleAuthSubmit, 
    toggleAuthMode 
} from './auth.js';
import { 
    storeData, 
    renderProducts, 
    updateStoreUI, 
    handleProductSearch, 
    handleFilterChange, 
    handleSortChange, 
    handleSettingsSubmit, 
    loadAdminProducts, 
    fillSettingsForm 
} from './data.js';
import { showCustomToast } from './utils.js';

// =====================================
// وظائف عرض الشاشات
// =====================================

// إظهار صفحة المصادقة
export function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (authScreen) authScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    closeAdminPanel();
    closeUserProfile();
}

// إظهار التطبيق الرئيسي
export function showMainApp() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (authScreen) authScreen.classList.add('hidden');
    if (mainApp) {
        mainApp.classList.remove('hidden');
        
        // تحسين: إزالة setTimeout واستخدام CSS Transitions
        mainApp.style.opacity = '0';
        mainApp.style.transform = 'translateY(20px)';
        
        // تطبيق الانتقال مباشرة بعد إزالة فئة hidden
        setTimeout(() => {
            mainApp.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            mainApp.style.opacity = '1';
            mainApp.style.transform = 'translateY(0)';
        }, 50); // تأخير بسيط لضمان تطبيق الانتقال
    }
}

// =====================================
// وظائف واجهة المستخدم
// =====================================

// تحديث واجهة المستخدم للمستخدم
export function updateUserUI() {
    if (!currentUser) return;
    
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');
    const userRole = document.getElementById('userRole');
    
    if (userDisplayName) {
        userDisplayName.textContent = currentUser.displayName || 'مستخدم';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || 'مستخدم ضيف';
    }
    
    if (userPhoto) {
        if (currentUser.photoURL) {
            userPhoto.src = currentUser.photoURL;
        } else {
            // إنشاء صورة رمزية مخصصة
            const name = currentUser.displayName || 'مستخدم';
            const initials = name.charAt(0);
            userPhoto.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FF3366"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Cairo, sans-serif">${initials}</text></svg>`;
        }
    }
    
    if (userRole) {
        userRole.textContent = isAdmin ? 'مسؤول' : 'مستخدم عادي';
        userRole.className = isAdmin ? 'role-badge admin' : 'role-badge';
    }
}

// تحديث واجهة المستخدم للمسؤول
export function updateAdminUI(isAdminUser) {
    const adminBtn = document.getElementById('adminToggle');
    const mobileAdminBtn = document.getElementById('mobileAdminToggle');
    
    if (adminBtn) {
        if (isAdminUser) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }
    
    if (mobileAdminBtn) {
        if (isAdminUser) {
            mobileAdminBtn.classList.remove('hidden');
        } else {
            mobileAdminBtn.classList.add('hidden');
        }
    }
    
    // إخفاء لوحة التحكم إذا لم يعد المستخدم مسؤولاً
    if (!isAdminUser && document.getElementById('adminSidebar')?.classList.contains('active')) {
        closeAdminPanel();
        showCustomToast("ليس لديك صلاحية للوصول إلى لوحة التحكم", "error");
    }
}

// =====================================
// وظائف لوحة التحكم
// =====================================

// فتح لوحة التحكم
export function openAdminPanel() {
    if (!isAdmin) {
        showCustomToast("ليس لديك صلاحية للوصول إلى لوحة التحكم", "error");
        return;
    }
    
    // يجب أن يتم التحقق من الصلاحية على مستوى Firebase Security Rules
    // الكود هنا فقط لعرض الواجهة
    
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.add('active');
    if (adminOverlay) adminOverlay.classList.add('active');
    
    document.body.style.overflow = 'hidden';
    
    // تحميل بيانات الأدمن
    loadAdminProducts();
    fillSettingsForm();
}

// إغلاق لوحة التحكم
export function closeAdminPanel() {
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.remove('active');
    if (adminOverlay) adminOverlay.classList.remove('active');
    
    document.body.style.overflow = 'auto';
}

// =====================================
// وظائف ملف المستخدم
// =====================================

// فتح ملف المستخدم
function openUserProfile() {
    const sidebar = document.getElementById('userProfileSidebar');
    const overlay = document.getElementById('userProfileOverlay');
    
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق ملف المستخدم
export function closeUserProfile() {
    const sidebar = document.getElementById('userProfileSidebar');
    const overlay = document.getElementById('userProfileOverlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =====================================
// وظائف القائمة الجانبية للجوال
// =====================================

// فتح القائمة الجانبية للجوال
function openMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق القائمة الجانبية للجوال
function closeMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =====================================
// وظائف إضافية
// =====================================

// تبديل عرض كلمة المرور
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    
    if (!passwordInput || !toggleBtn) return;
    
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

// إنشاء جزيئات الخلفية المتحركة
function createBackgroundParticles() {
    const container = document.querySelector('.auth-background-elements');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        particle.style.width = Math.random() * 60 + 20 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + 100 + '%';
        particle.style.background = `linear-gradient(45deg, 
            rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1),
            rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.05)
        )`;
        particle.style.animationDuration = Math.random() * 30 + 20 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

// =====================================
// إعداد مستمعي الأحداث
// =====================================

export function setupEventListeners() {
    // 1. المصادقة
    document.getElementById('googleSignInBtn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('guestSignInBtn')?.addEventListener('click', signInAsGuest);
    document.getElementById('emailAuthForm')?.addEventListener('submit', handleAuthSubmit);
    document.getElementById('toggleSignUpMode')?.addEventListener('click', () => toggleAuthMode());
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', handleForgotPassword);
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);
    
    // تبديل نموذج البريد الإلكتروني
    document.getElementById('showEmailFormBtn')?.addEventListener('click', () => {
        document.getElementById('authOptions')?.classList.add('hidden');
        document.getElementById('emailAuthSection')?.classList.remove('hidden');
        // تعيين الوضع الافتراضي لتسجيل الدخول
        toggleAuthMode(false);
    });
    
    document.getElementById('backToOptions')?.addEventListener('click', () => {
        document.getElementById('emailAuthSection')?.classList.add('hidden');
        document.getElementById('authOptions')?.classList.remove('hidden');
    });
    
    // تبديل عرض كلمة المرور
    document.getElementById('togglePassword')?.addEventListener('click', togglePasswordVisibility);
    
    // 2. واجهة المستخدم الرئيسية
    document.getElementById('userToggle')?.addEventListener('click', openUserProfile);
    document.getElementById('closeUserProfileBtn')?.addEventListener('click', closeUserProfile);
    document.getElementById('userProfileOverlay')?.addEventListener('click', closeUserProfile);
    
    // 3. لوحة التحكم
    document.getElementById('adminToggle')?.addEventListener('click', openAdminPanel);
    document.getElementById('closeAdminSidebar')?.addEventListener('click', closeAdminPanel);
    document.getElementById('adminOverlay')?.addEventListener('click', closeAdminPanel);
    
    // 4. القائمة الجانبية للجوال
    document.getElementById('menuToggle')?.addEventListener('click', openMobileSidebar);
    document.getElementById('closeSidebar')?.addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
    
    // 5. المنتجات والبحث
    document.getElementById('productSearchHeader')?.addEventListener('input', handleProductSearch);
    document.getElementById('productSearch')?.addEventListener('input', handleProductSearch);
    document.getElementById('productSort')?.addEventListener('change', handleSortChange);
    
    // توحيد منطق التصفية
    document.querySelectorAll('.filter-tabs .filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    
    document.querySelectorAll('.categories-nav .cat-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    
    // 6. إعدادات المتجر
    document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsSubmit);
    
    // 7. التنقل في لوحة التحكم
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            
            // إزالة النشاط من جميع الأزرار
            document.querySelectorAll('.admin-nav-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // إضافة النشاط للزر الحالي
            this.classList.add('active');
            
            // إخفاء جميع الأقسام
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // إظهار القسم المطلوب
            document.getElementById(targetId)?.classList.add('active');
        });
    });
    
    // 8. وظائف إضافية
    createBackgroundParticles();
    
    // 9. مستمعي الأحداث للجوال
    document.getElementById('mobileUserToggle')?.addEventListener('click', () => {
        closeMobileSidebar();
        openUserProfile();
    });
    
    document.getElementById('mobileAdminToggle')?.addEventListener('click', () => {
        closeMobileSidebar();
        openAdminPanel();
    });
}