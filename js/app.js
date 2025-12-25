// js/app.js - التطبيق الرئيسي

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { initAuth, signInWithGoogle, signInWithEmail, createAccount, signInAsGuest, logout, onAuthChange, AuthState, updateUserData, getUserData, resetPassword } from './auth.js';
import { initProducts, loadProducts, filterProducts, searchProducts, updateStoreUI, ProductsState } from './products.js';
import { UI } from './ui.js';
import { initAdmin } from './admin.js';
import { AdminUI } from './admin-ui.js';
import { initCart, addToCart, removeFromCart, updateCartQuantity, getCartItems, clearCart, CartState } from './cart.js';
import { OrdersUI } from './orders-ui.js';

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
initCart();

// متغيرات التطبيق
let currentSection = 'home';

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

    // استعادة كلمة المرور
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', UI.showResetPasswordForm);
    document.getElementById('backToSignIn')?.addEventListener('click', UI.showEmailForm);

    // إرسال رابط استعادة كلمة المرور
    document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmailInput').value;
        const success = await resetPassword(email);
        if (success) {
            showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
            UI.showEmailForm();
        }
    });

    // تبديل عرض كلمة المرور
    document.getElementById('togglePassword')?.addEventListener('click', UI.togglePasswordVisibility);

    // قائمة الجوال
    document.getElementById('menuToggle')?.addEventListener('click', UI.toggleMobileNav);
    document.getElementById('closeNav')?.addEventListener('click', UI.closeMobileNav);
    
    // زر تسجيل الدخول في الجوال
    document.getElementById('mobileAuthBtn')?.addEventListener('click', () => {
        UI.closeMobileNav();
        UI.showAuthScreen();
    });

    // زر الحساب
    document.getElementById('userToggle')?.addEventListener('click', () => {
        if (AuthState.currentUser) {
            UI.showSection('profileSection');
            currentSection = 'profile';
        } else {
            UI.showAuthScreen();
        }
    });

    // زر السلة
    document.getElementById('cartBtn')?.addEventListener('click', () => {
        UI.showSection('cartSection');
        currentSection = 'cart';
        updateCartUI();
    });

    // زر الطلبات
    document.getElementById('ordersBtn')?.addEventListener('click', () => {
        UI.showSection('ordersSection');
        currentSection = 'orders';
        OrdersUI.renderUserOrders();
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

    // التنقل بين الأقسام في القائمة الجوالية
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            UI.showSection(section === 'home' ? 'home' : section + 'Section');
            currentSection = section;
            
            // تحميل المحتوى الخاص بالقسم إذا لزم
            if (section === 'orders') {
                OrdersUI.renderUserOrders();
            } else if (section === 'cart') {
                updateCartUI();
            }
            
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
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.add-to-cart-btn')) {
            const productId = e.target.closest('.add-to-cart-btn').dataset.id;
            const product = ProductsState.products.find(p => p.id === productId);
            
            if (product) {
                await addToCart(product);
                showToast('تمت إضافة المنتج إلى السلة');
                updateCartUI();
            }
        }
    });

    // بدء التسوق
    document.getElementById('startShoppingBtn')?.addEventListener('click', () => {
        UI.showSection('productsSection');
        currentSection = 'products';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // تواصل معنا
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('تم إرسال رسالتك، سنتواصل معك قريباً');
        e.target.reset();
    });

    // إغلاق المودال
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('productModal')?.classList.add('hidden');
            document.getElementById('confirmModal')?.classList.add('hidden');
            document.getElementById('messageModal')?.classList.add('hidden');
        });
    });

    document.getElementById('messageCloseBtn')?.addEventListener('click', () => {
        document.getElementById('messageModal').classList.add('hidden');
    });

    // تحديث كلمة المرور
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        showToast('سيتم إضافة هذه الميزة قريباً', 'info');
    });

    // حذف الحساب
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف الحساب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            showToast('سيتم إضافة هذه الميزة قريباً', 'info');
        }
    });

    // إتمام الشراء
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        showToast('سيتم تفعيل نظام الدفع في التحديث القادم', 'info');
    });

    // تهيئة واجهة الطلبات
    OrdersUI.init();
}

// تحديث واجهة السلة
function updateCartUI() {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // تحديث العداد
    const cartCount = document.getElementById('cartCount');
    const cartMobileCount = document.getElementById('cartMobileCount');
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
        cartMobileCount.textContent = totalItems;
        cartMobileCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
        cartMobileCount.classList.add('hidden');
    }
    
    // تحديث صفحة السلة
    const cartItemsContainer = document.getElementById('cartItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartItems.length > 0) {
        cartItemsContainer.innerHTML = cartItems.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${item.price} ر.س</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // إضافة أحداث التحكم بالكمية
        cartItemsContainer.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                await updateCartQuantity(productId, -1);
                updateCartUI();
            });
        });
        
        cartItemsContainer.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                await updateCartQuantity(productId, 1);
                updateCartUI();
            });
        });
        
        cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                await removeFromCart(productId);
                updateCartUI();
                showToast('تم حذف المنتج من السلة');
            });
        });
        
        checkoutBtn.disabled = false;
    } else {
        cartItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>سلة التسوق فارغة</p>
                <a href="#" class="btn primary-btn" data-section="products">
                    <i class="fas fa-store"></i> تصفح المنتجات
                </a>
            </div>
        `;
        checkoutBtn.disabled = true;
    }
    
    // تحديث الملخص
    document.getElementById('cartTotalItems').textContent = totalItems;
    document.getElementById('cartSubtotal').textContent = subtotal.toFixed(2) + ' ر.س';
    document.getElementById('cartTotal').textContent = subtotal.toFixed(2) + ' ر.س';
    
    // تحديث الروابط في الفوتر
    const footerCartLink = document.getElementById('footerCartLink');
    const footerOrdersLink = document.getElementById('footerOrdersLink');
    
    if (footerCartLink) {
        footerCartLink.addEventListener('click', (e) => {
            e.preventDefault();
            UI.showSection('cartSection');
            currentSection = 'cart';
            updateCartUI();
        });
    }
    
    if (footerOrdersLink) {
        footerOrdersLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (AuthState.currentUser) {
                UI.showSection('ordersSection');
                currentSection = 'orders';
                OrdersUI.renderUserOrders();
            } else {
                UI.showAuthScreen();
            }
        });
    }
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        text-align: center;
        min-width: 300px;
        max-width: 90%;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// التحكم في عرض الأدمن
function setupAdminControls(isAdmin) {
    const adminElements = document.querySelectorAll('.admin-only');
    
    if (isAdmin) {
        adminElements.forEach(el => {
            el.classList.remove('hidden');
        });
        
        // تهيئة لوحة الإدارة
        AdminUI.init();
        
        // إضافة حدث لزر الأدمن في الجوال
        const adminMobileBtn = document.getElementById('adminMobileBtn');
        if (adminMobileBtn) {
            adminMobileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                UI.showSection('adminSection');
                currentSection = 'admin';
                UI.closeMobileNav();
            });
        }
        
    } else {
        adminElements.forEach(el => {
            el.classList.add('hidden');
        });
    }
}

// تحديث واجهة المتجر بالإعدادات
async function updateStoreWithSettings() {
    try {
        const { getSiteSettings } = await import('./admin.js');
        const settings = await getSiteSettings();
        
        // تحديث الاسم في جميع الأماكن
        document.querySelectorAll('.store-name').forEach(el => {
            el.textContent = settings.storeName || 'جمالك';
        });
        
        // تحديث الوصف
        const descEl = document.getElementById('storeDescription');
        if (descEl && settings.description) {
            descEl.textContent = settings.description;
        }
        
        // تحديث معلومات التواصل
        const phoneEl = document.getElementById('contactPhone');
        const footerPhone = document.getElementById('footerPhone');
        const emailEl = document.getElementById('contactEmail');
        const footerEmail = document.getElementById('footerEmail');
        
        if (phoneEl && settings.phone1) {
            phoneEl.textContent = settings.phone1;
        }
        if (footerPhone && settings.phone1) {
            footerPhone.textContent = settings.phone1;
        }
        if (emailEl && settings.email) {
            emailEl.textContent = settings.email;
        }
        if (footerEmail && settings.email) {
            footerEmail.textContent = settings.email;
        }
        
        // تحديث رابط الواتساب
        const whatsappLink = document.getElementById('whatsappLink');
        if (whatsappLink && settings.phone1) {
            const whatsappNumber = settings.phone1.replace(/\D/g, '');
            whatsappLink.href = `https://wa.me/${whatsappNumber}`;
        }
        
    } catch (error) {
        console.error('خطأ في تحميل إعدادات المتجر:', error);
    }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('تطبيق المتجر يعمل...');
    
    // متابعة حالة المصادقة
    onAuthChange(async (state) => {
        if (state.currentUser) {
            // جلب بيانات المستخدم الإضافية
            const userData = await getUserData(state.currentUser);
            
            // تحديث واجهة المستخدم
            UI.updateUserUI(state.currentUser, state.isAdmin);
            
            // تحديث صفحة الحساب
            if (userData) {
                document.getElementById('editDisplayName').value = userData.displayName || state.currentUser.displayName || '';
                document.getElementById('editPhone').value = userData.phone || '';
                document.getElementById('editAddress').value = userData.address || '';
                
                // عرض تاريخ الانضمام
                const joinDateEl = document.getElementById('profileJoinDate');
                if (joinDateEl && userData.createdAt) {
                    const date = userData.createdAt.toDate();
                    joinDateEl.textContent = 'تاريخ الانضمام: ' + date.toLocaleDateString('ar-SA');
                }
            }
            
            // التحكم في عرض الأدمن
            setupAdminControls(state.isAdmin);
            
            // تحديث أزرار الجوال
            const mobileAuthBtn = document.getElementById('mobileAuthBtn');
            const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
            const mobileUserInfo = document.getElementById('mobileUserInfo');
            const cartMobileBtn = document.getElementById('cartMobileBtn');
            const ordersMobileBtn = document.getElementById('ordersMobileBtn');
            const ordersBtn = document.getElementById('ordersBtn');
            
            if (mobileAuthBtn) mobileAuthBtn.classList.add('hidden');
            if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
            if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');
            if (cartMobileBtn) cartMobileBtn.classList.remove('hidden');
            if (ordersMobileBtn) ordersMobileBtn.classList.remove('hidden');
            if (ordersBtn) ordersBtn.classList.remove('hidden');
            
            // تحميل المنتجات والإعدادات
            await loadProducts();
            UI.renderProducts(ProductsState.filteredProducts);
            UI.showMainApp();
            
            // تحديث إعدادات المتجر
            await updateStoreWithSettings();
            
            // تحديث السلة
            updateCartUI();
            
        } else {
            // إعادة تعيين واجهة المستخدم
            const mobileAuthBtn = document.getElementById('mobileAuthBtn');
            const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
            const mobileUserInfo = document.getElementById('mobileUserInfo');
            const cartMobileBtn = document.getElementById('cartMobileBtn');
            const ordersMobileBtn = document.getElementById('ordersMobileBtn');
            const ordersBtn = document.getElementById('ordersBtn');
            const cartCount = document.getElementById('cartCount');
            
            if (mobileAuthBtn) mobileAuthBtn.classList.remove('hidden');
            if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
            if (mobileUserInfo) mobileUserInfo.classList.add('hidden');
            if (cartMobileBtn) cartMobileBtn.classList.add('hidden');
            if (ordersMobileBtn) ordersMobileBtn.classList.add('hidden');
            if (ordersBtn) ordersBtn.classList.add('hidden');
            if (cartCount) cartCount.classList.add('hidden');
            
            // إظهار شاشة الدخول بعد تأخير قصير
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

// إضافة أنماط CSS للـ Toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -20px); opacity: 0; }
    }
`;
document.head.appendChild(style);