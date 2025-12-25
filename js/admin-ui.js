// js/app.js - التطبيق الرئيسي

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { initAuth, signInWithGoogle, signInWithEmail, createAccount, signInAsGuest, logout, onAuthChange, AuthState } from './auth.js';
import { initProducts, loadProducts, filterProducts, searchProducts, updateStoreUI, ProductsState } from './products.js';
import { UI } from './ui.js';

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
        // يمكن إضافة فتح صفحة المستخدم هنا
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

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('تطبيق المتجر يعمل...');
    
    // متابعة حالة المصادقة
    onAuthChange(async (state) => {
        if (state.currentUser) {
            // تحميل المنتجات والإعدادات
            await loadProducts();
            UI.renderProducts(ProductsState.filteredProducts);
            UI.showMainApp();
            
            // تحميل إعدادات المتجر (يمكن إضافتها لاحقاً)
            updateStoreUI({
                storeName: 'جمالك',
                description: 'متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية',
                phone: '+249 123 456 789',
                whatsapp: '249123456789'
            });
        } else {
            UI.showAuthScreen();
        }
    });
    
    // إعداد الأحداث
    setTimeout(setupEventListeners, 100);
});