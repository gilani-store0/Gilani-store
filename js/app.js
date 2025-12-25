// js/app.js - التطبيق الرئيسي

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { initAuth, signInWithGoogle, signInWithEmail, createAccount, signInAsGuest, logout, onAuthChange, AuthState, updateUserData, getUserData } from './auth.js';
import { initProducts, loadProducts, filterProducts, searchProducts, updateStoreUI, ProductsState } from './products.js';
import { UI } from './ui.js';
import { initAdmin } from './admin.js';
import { AdminUI } from './admin-ui.js';

// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
initAuth(app);
initProducts(app);
initAdmin(app);

// إعداد الأحداث
function setupEventListeners() {
    // مصادقة جوجل
    document.getElementById('googleSignInBtn')?.addEventListener('click', async () => {
        await signInWithGoogle();
    });

    // إظهار نموذج البريد
    document.getElementById('showEmailFormBtn')?.addEventListener('click', UI.showEmailForm);

    // تسجيل الدخول كضيف
    document.getElementById('guestSignInBtn')?.addEventListener('click', async () => {
        await signInAsGuest();
    });

    // نموذج البريد الإلكتروني
    document.getElementById('emailAuthForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        
        if (AuthState.isSignUpMode) {
            const displayName = document.getElementById('displayNameInput').value;
            await createAccount(email, password, displayName);
        } else {
            await signInWithEmail(email, password);
        }
    });

    // تبديل وضع التسجيل
    document.getElementById('toggleSignUpMode')?.addEventListener('click', UI.toggleAuthMode);

    // العودة للخيارات
    document.getElementById('backToOptions')?.addEventListener('click', UI.backToOptions);

    // تبديل عرض كلمة المرور
    document.getElementById('togglePassword')?.addEventListener('click', UI.togglePasswordVisibility);

    // قائمة الجوال
    document.getElementById('menuToggle')?.addEventListener('click', UI.toggleMobileNav);
    document.getElementById('closeNav')?.addEventListener('click', UI.closeMobileNav);
    document.getElementById('mobileUserBtn')?.addEventListener('click', () => {
        UI.closeMobileNav();
        UI.showAuthScreen();
    });

    // زر المستخدم (للانتقال إلى صفحة الحساب)
    document.getElementById('userToggle')?.addEventListener('click', () => {
        if (AuthState.currentUser) {
            UI.showSection('profileSection');
        } else {
            UI.showAuthScreen();
        }
    });

    // تسجيل الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });

    document.getElementById('mobileLogoutBtn')?.addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });

    // التنقل بين الأقسام
    // (تم نقل منطق زر الحساب إلى userToggle)
    document.getElementById('ordersLink')?.addEventListener('click', () => {
        UI.showSection('ordersSection');
    });

    document.getElementById('adminToggle')?.addEventListener('click', () => {
        UI.showSection('adminSection');
    });

    document.querySelectorAll('a[href="#adminSection"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UI.showSection('adminSection');
            UI.closeMobileNav();
        });
    });

    document.querySelectorAll('a[href="#home"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UI.showSection('home');
            UI.closeMobileNav();
        });
    });

    // تحديث الملف الشخصي
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('editDisplayName').value;
        const phone = document.getElementById('editPhone').value;
        const address = document.getElementById('editAddress').value;
        
        const result = await updateUserData(AuthState.currentUser.uid, {
            displayName,
            phone,
            address
        });
        
        if (result.success) {
            showToast('تم تحديث البيانات بنجاح');
            // تحديث الواجهة بالبيانات الجديدة
            UI.updateUserUI(AuthState.currentUser, AuthState.isAdmin);
        } else {
            showToast('فشل تحديث البيانات', 'error');
        }
    });

    // البحث
    document.getElementById('productSearch')?.addEventListener('input', (e) => {
        const results = searchProducts(e.target.value);
        UI.renderProducts(results);
    });

    // التصفية
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            UI.updateFilterButtons(filter);
            const products = filterProducts(filter);
            UI.renderProducts(products);
        });
    });

    // الترتيب
    document.getElementById('productSort')?.addEventListener('change', (e) => {
        ProductsState.currentSort = e.target.value;
        const products = filterProducts(ProductsState.currentFilter);
        UI.renderProducts(products);
    });

    // إضافة للسلة
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn')) {
            const productId = e.target.closest('.add-to-cart-btn').dataset.id;
            showToast('تمت إضافة المنتج إلى السلة');
        }
    });
}

// عرض رسائل Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#C89B3C' : '#c00'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// التحكم في عرض الأدمن
function setupAdminControls(isAdmin) {
    if (isAdmin) {
        // إظهار عناصر الأدمن
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
        
        // تهيئة لوحة الإدارة
        AdminUI.init();
        
        // حدث زر الأدمن في الهيدر
        const adminToggle = document.getElementById('adminToggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                const adminSection = document.getElementById('adminSection');
                const isHidden = adminSection.classList.contains('hidden');
                
                adminSection.classList.toggle('hidden');
                
                if (isHidden) {
                    // إذا كانت مخفية، اظهرها
                    adminSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // إغلاق قائمة الجوال إذا كانت مفتوحة
                UI.closeMobileNav();
            });
        }
        
    } else {
        // إخفاء عناصر الأدمن
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.add('hidden');
        });
        document.getElementById('adminSection')?.classList.add('hidden');
    }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('تطبيق المتجر يعمل...');
    
    // متابعة حالة المصادقة
    onAuthChange(async (state) => {
        if (state.currentUser) {
            // جلب بيانات المستخدم الإضافية من Firestore
            const userData = await getUserData(state.currentUser);
            
            // تحديث واجهة المستخدم ببيانات المستخدم وصلاحياته
            UI.updateUserUI(state.currentUser, state.isAdmin);
            
            if (userData) {
                // تحديث الحقول في صفحة الحساب
                document.getElementById('editPhone').value = userData.phone || '';
                document.getElementById('editAddress').value = userData.address || '';
            }
            
            // التحكم الفوري في عرض لوحة الإدارة
            setupAdminControls(state.isAdmin);
            
            // تحميل المنتجات والإعدادات
            await loadProducts();
            UI.renderProducts(ProductsState.filteredProducts);
            UI.showMainApp();
            
            // تحميل إعدادات المتجر
            updateStoreUI({
                storeName: 'جمالك',
                description: 'متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية',
                phone: '+249 123 456 789',
                whatsapp: '249123456789'
            });
            
        } else {
            // التأكد من أننا لسنا في حالة تحميل أولية قبل إظهار شاشة الدخول
            setTimeout(() => {
                if (!AuthState.currentUser) {
                    UI.showAuthScreen();
                    setupAdminControls(false);
                }
            }, 1000);
        }
    });
    
    // إعداد الأحداث
    setTimeout(setupEventListeners, 100);
});