// js/main.js - تشغيل وربط الكل
import { app } from './firebase.js';
import { 
    initAuth, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    signOut,
    signInAsGuest,
    getCurrentUser,
    isUserAdmin
} from './auth.js';

import { 
    initProducts, 
    loadProducts, 
    filterProducts, 
    searchProducts,
    getProductById,
    ProductsState
} from './products.js';

import { 
    initCart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity,
    getCartItems,
    clearCart,
    getCartTotal,
    getCartItemCount
} from './cart.js';

import { 
    initAdmin,
    loadAllProducts,
    addNewProduct,
    updateExistingProduct,
    deleteProductById,
    getSiteSettings,
    updateSiteSettings,
    getStoreStats,
    setupConfirmation,
    clearConfirmation,
    executePendingAction,
    showMessage
} from './admin.js';

// واجهة المستخدم
const UI = {
    // إظهار شاشة المصادقة
    showAuthScreen() {
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.body.style.overflow = 'hidden';
        console.log('شاشة تسجيل الدخول معروضة');
    },

    // إظهار التطبيق الرئيسي
    showMainApp() {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.body.style.overflow = 'auto';
        
        // تحميل السنة الحالية
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
        
        console.log('التطبيق الرئيسي معروض');
    },

    // إظهار قسم معين وإخفاء البقية
    showSection(sectionId) {
        const sections = [
            'home', 'productsSection', 'adminSection', 
            'profileSection', 'ordersSection', 'cartSection', 'contactSection'
        ];
        
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === sectionId) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });
        
        // التمرير للأعلى عند تغيير القسم
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // تحميل المحتوى حسب القسم
        this.loadSectionContent(sectionId);
    },

    // تحميل محتوى القسم
    async loadSectionContent(sectionId) {
        switch(sectionId) {
            case 'productsSection':
                await this.loadProductsSection();
                break;
            case 'cartSection':
                this.loadCartSection();
                break;
            case 'adminSection':
                if (isUserAdmin()) {
                    await this.loadAdminSection();
                }
                break;
            case 'profileSection':
                this.loadProfileSection();
                break;
        }
    },

    // تحميل قسم المنتجات
    async loadProductsSection() {
        const products = await loadProducts();
        this.renderProducts(products);
    },

    // تحميل قسم السلة
    loadCartSection() {
        const cartItems = getCartItems();
        this.renderCartItems(cartItems);
    },

    // تحميل قسم الإدارة
    async loadAdminSection() {
        if (!isUserAdmin()) return;
        
        const stats = await getStoreStats();
        this.updateAdminStats(stats);
        
        const products = await loadAllProducts();
        this.renderAdminProducts(products);
        
        const settings = await getSiteSettings();
        this.loadSiteSettings(settings);
    },

    // تحميل قسم الملف الشخصي
    loadProfileSection() {
        const user = getCurrentUser();
        if (user) {
            // يمكنك إضافة تحميل بيانات إضافية هنا
        }
    },

    // تحديث واجهة المستخدم ببيانات المستخدم
    updateUserUI(user, isAdmin) {
        if (!user) return;

        const name = user.displayName || 'مستخدم';
        const email = user.email || '';
        const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C89B3C&color=fff`;

        // تحديث الهيدر
        const ordersBtn = document.getElementById('ordersBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (ordersBtn) ordersBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');

        // تحديث صفحة الحساب
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        const editDisplayName = document.getElementById('editDisplayName');
        
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = email;
        if (profileAvatar) profileAvatar.src = photo;
        if (editDisplayName) editDisplayName.value = name;
        
        // تحديث الجوال
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserEmail = document.getElementById('mobileUserEmail');
        const mobileUserAvatar = document.getElementById('mobileUserAvatar');
        
        if (mobileUserName) mobileUserName.textContent = name;
        if (mobileUserEmail) mobileUserEmail.textContent = email;
        if (mobileUserAvatar) mobileUserAvatar.src = photo;

        // تحديث بادجة الأدمن
        const adminBadge = document.getElementById('adminBadge');
        const adminMobileBtn = document.getElementById('adminMobileBtn');
        
        if (adminBadge) {
            if (isAdmin) {
                adminBadge.classList.remove('hidden');
                if (adminMobileBtn) adminMobileBtn.classList.remove('hidden');
            } else {
                adminBadge.classList.add('hidden');
                if (adminMobileBtn) adminMobileBtn.classList.add('hidden');
            }
        }
        
        // تحديث أزرار الجوال
        const mobileAuthBtn = document.getElementById('mobileAuthBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const mobileUserInfo = document.getElementById('mobileUserInfo');
        const cartMobileBtn = document.getElementById('cartMobileBtn');
        const ordersMobileBtn = document.getElementById('ordersMobileBtn');
        
        if (mobileAuthBtn) mobileAuthBtn.classList.add('hidden');
        if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
        if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');
        if (cartMobileBtn) cartMobileBtn.classList.remove('hidden');
        if (ordersMobileBtn) ordersMobileBtn.classList.remove('hidden');
    },

    // تبديل قائمة الجوال
    toggleMobileNav() {
        const nav = document.getElementById('mobileNav');
        if (nav) {
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
        }
    },

    // إغلاق قائمة الجوال
    closeMobileNav() {
        const nav = document.getElementById('mobileNav');
        if (nav) {
            nav.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },

    // تبديل عرض كلمة المرور
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('passwordInput');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (passwordInput && toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }
    },

    // تبديل وضع التسجيل/الدخول
    toggleAuthMode() {
        const displayNameInput = document.getElementById('displayNameInput');
        const signInBtn = document.getElementById('signInWithEmailBtn');
        const toggleBtn = document.getElementById('toggleSignUpMode');
        
        if (displayNameInput && signInBtn && toggleBtn) {
            const isSignUpMode = displayNameInput.classList.toggle('hidden');
            
            if (isSignUpMode) {
                signInBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب';
                toggleBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            } else {
                signInBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
                toggleBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
            }
        }
    },

    // إظهار نموذج البريد
    showEmailForm() {
        const authOptions = document.getElementById('authOptions');
        const emailAuthSection = document.getElementById('emailAuthSection');
        const emailAuthForm = document.getElementById('emailAuthForm');
        const resetPasswordSection = document.getElementById('resetPasswordSection');
        
        if (authOptions) authOptions.classList.add('hidden');
        if (emailAuthSection) emailAuthSection.classList.remove('hidden');
        if (emailAuthForm) emailAuthForm.classList.remove('hidden');
        if (resetPasswordSection) resetPasswordSection.classList.add('hidden');
        
        // التأكد من أننا في وضع تسجيل الدخول عند العودة
        const displayNameInput = document.getElementById('displayNameInput');
        if (displayNameInput && !displayNameInput.classList.contains('hidden')) {
            this.toggleAuthMode();
        }
    },

    // إظهار نموذج استعادة كلمة المرور
    showResetPasswordForm() {
        const authOptions = document.getElementById('authOptions');
        const emailAuthSection = document.getElementById('emailAuthSection');
        const emailAuthForm = document.getElementById('emailAuthForm');
        const resetPasswordSection = document.getElementById('resetPasswordSection');
        
        if (authOptions) authOptions.classList.add('hidden');
        if (emailAuthSection) emailAuthSection.classList.remove('hidden');
        if (emailAuthForm) emailAuthForm.classList.add('hidden');
        if (resetPasswordSection) resetPasswordSection.classList.remove('hidden');
    },

    // العودة للخيارات
    backToOptions() {
        const emailAuthSection = document.getElementById('emailAuthSection');
        const authOptions = document.getElementById('authOptions');
        const resetPasswordSection = document.getElementById('resetPasswordSection');
        const emailAuthForm = document.getElementById('emailAuthForm');
        
        if (emailAuthSection) emailAuthSection.classList.add('hidden');
        if (authOptions) authOptions.classList.remove('hidden');
        if (resetPasswordSection) resetPasswordSection.classList.add('hidden');
        if (emailAuthForm) emailAuthForm.classList.remove('hidden');
    },

    // عرض المنتجات
    renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        if (!products || products.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>لا توجد منتجات حالياً.</p></div>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                ${product.isNew ? '<span class="product-badge new">جديد</span>' : ''}
                ${product.isSale ? '<span class="product-badge sale">عرض خاص</span>' : ''}
                ${product.isBest ? '<span class="product-badge best">الأفضل</span>' : ''}
                
                <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                     alt="${product.name || 'منتج'}" 
                     class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name || 'منتج بدون اسم'}</h3>
                    ${product.description ? `<p class="product-description">${product.description.substring(0, 60)}...</p>` : ''}
                    <div class="product-price">
                        <span class="current-price">${product.price || 0} ر.س</span>
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ر.س</span>` : ''}
                    </div>
                    <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> أضف للسلة
                    </button>
                </div>
            </div>
        `).join('');
        
        // إضافة مستمعي الأحداث لأزرار إضافة للسلة
        grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart-btn').dataset.id;
                const product = getProductById(productId);
                if (product) {
                    addToCart(product, 1);
                }
            });
        });
    },

    // عرض عناصر السلة
    renderCartItems(cartItems) {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        
        if (!cartItemsContainer) return;
        
        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>سلة التسوق فارغة</p>
                    <a href="#" class="btn primary-btn" data-section="products">
                        <i class="fas fa-store"></i> تصفح المنتجات
                    </a>
                </div>
            `;
            
            if (cartSummary) cartSummary.innerHTML = '';
            return;
        }
        
        // عرض العناصر
        cartItemsContainer.innerHTML = cartItems.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price} ر.س</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    <button class="remove-item-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // تحديث الملخص
        const total = getCartTotal();
        const itemCount = getCartItemCount();
        
        if (cartSummary) {
            cartSummary.innerHTML = `
                <div class="summary-card">
                    <h3>ملخص الطلب</h3>
                    <div class="summary-row">
                        <span>عدد المنتجات:</span>
                        <span id="cartTotalItems">${itemCount}</span>
                    </div>
                    <div class="summary-row">
                        <span>المجموع:</span>
                        <span id="cartSubtotal">${total} ر.س</span>
                    </div>
                    <div class="summary-row">
                        <span>التوصيل:</span>
                        <span id="cartShipping">مجاني</span>
                    </div>
                    <div class="summary-row total">
                        <span>الإجمالي:</span>
                        <span id="cartTotal">${total} ر.س</span>
                    </div>
                    <button id="checkoutBtn" class="btn primary-btn w-100">
                        <i class="fas fa-lock"></i> اتمام الشراء
                    </button>
                    <button id="clearCartBtn" class="btn outline-btn w-100">
                        <i class="fas fa-trash"></i> تفريغ السلة
                    </button>
                    <p class="summary-note">سيتم تفعيل نظام الدفع في التحديث القادم</p>
                </div>
            `;
            
            // إضافة مستمعي الأحداث
            this.setupCartEventListeners();
        }
    },

    // إعداد مستمعي أحداث السلة
    setupCartEventListeners() {
        // زيادة الكمية
        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.id;
                updateCartQuantity(productId, 1);
                this.loadCartSection();
            });
        });
        
        // تقليل الكمية
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.id;
                updateCartQuantity(productId, -1);
                this.loadCartSection();
            });
        });
        
        // إزالة العنصر
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.remove-item-btn').dataset.id;
                removeFromCart(productId);
                this.loadCartSection();
            });
        });
        
        // تفريغ السلة
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                clearCart();
                this.loadCartSection();
            });
        }
        
        // اتمام الشراء
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                showMessage('قريباً', 'نظام الدفع قيد التطوير وسيكون متاحاً قريباً', 'info');
            });
        }
    },

    // تحديث أزرار التصفية
    updateFilterButtons(activeFilter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    },

    // تحديث إحصائيات الإدارة
    updateAdminStats(stats) {
        const totalProducts = document.getElementById('totalProducts');
        const totalUsers = document.getElementById('totalUsers');
        const totalOrders = document.getElementById('totalOrders');
        const totalRevenue = document.getElementById('totalRevenue');
        
        if (totalProducts) totalProducts.textContent = stats.totalProducts || 0;
        if (totalUsers) totalUsers.textContent = stats.totalUsers || 0;
        if (totalOrders) totalOrders.textContent = stats.totalOrders || 0;
        if (totalRevenue) totalRevenue.textContent = (stats.totalRevenue || 0) + ' ر.س';
    },

    // عرض منتجات الإدارة
    renderAdminProducts(products) {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;
        
        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>لا توجد منتجات</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                         alt="${product.name}" 
                         class="product-thumb">
                </td>
                <td>${product.name}</td>
                <td>${product.price} ر.س</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="product-status ${product.isActive ? 'status-active' : 'status-inactive'}">
                        ${product.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>${new Date(product.createdAt?.toDate() || new Date()).toLocaleDateString('ar-SA')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn small-btn edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn small-btn danger-btn delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // إضافة مستمعي الأحداث
        this.setupAdminEventListeners();
    },

    // تحميل إعدادات الموقع
    loadSiteSettings(settings) {
        const storeNameInput = document.getElementById('storeNameInput');
        const logoInput = document.getElementById('logoInput');
        const emailInput = document.getElementById('emailInput');
        const phone1Input = document.getElementById('phone1Input');
        const phone2Input = document.getElementById('phone2Input');
        const deliveryTimeInput = document.getElementById('deliveryTimeInput');
        const shippingCostInput = document.getElementById('shippingCostInput');
        
        if (storeNameInput) storeNameInput.value = settings.storeName || '';
        if (logoInput) logoInput.value = settings.logoUrl || '';
        if (emailInput) emailInput.value = settings.email || '';
        if (phone1Input) phone1Input.value = settings.phone1 || '';
        if (phone2Input) phone2Input.value = settings.phone2 || '';
        if (deliveryTimeInput) deliveryTimeInput.value = settings.deliveryTime || 5;
        if (shippingCostInput) shippingCostInput.value = settings.shippingCost || 0;
    },

    // إعداد مستمعي أحداث الإدارة
    setupAdminEventListeners() {
        // أزرار حذف المنتجات
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.delete-product').dataset.id;
                setupConfirmation('هل أنت متأكد من حذف هذا المنتج؟', async () => {
                    const result = await deleteProductById(productId);
                    if (result.success) {
                        showMessage('نجاح', 'تم حذف المنتج بنجاح', 'success');
                        await this.loadAdminSection();
                    } else {
                        showMessage('خطأ', 'فشل في حذف المنتج', 'error');
                    }
                });
            });
        });
        
        // زر إضافة منتج جديد
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showProductModal();
            });
        }
        
        // حفظ إعدادات الموقع
        const siteSettingsForm = document.getElementById('siteSettingsForm');
        if (siteSettingsForm) {
            siteSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const settings = {
                    storeName: document.getElementById('storeNameInput').value,
                    logoUrl: document.getElementById('logoInput').value,
                    email: document.getElementById('emailInput').value,
                    phone1: document.getElementById('phone1Input').value,
                    phone2: document.getElementById('phone2Input').value,
                    deliveryTime: parseInt(document.getElementById('deliveryTimeInput').value),
                    shippingCost: parseFloat(document.getElementById('shippingCostInput').value) || 0
                };
                
                const result = await updateSiteSettings(settings);
                if (result.success) {
                    showMessage('نجاح', 'تم حفظ إعدادات الموقع بنجاح', 'success');
                } else {
                    showMessage('خطأ', 'فشل في حفظ الإعدادات', 'error');
                }
            });
        }
    }
};

// تهيئة التطبيق
async function initApp() {
    console.log('بدء تشغيل المتجر...');
    
    // 1. إظهار شاشة تسجيل الدخول مباشرة
    UI.showAuthScreen();
    
    // 2. تهيئة وحدات التطبيق الأساسية
    initProducts();
    initCart();
    initAdmin();
    
    // 3. التحقق من حالة المصادقة الحالية
    try {
        const authResult = await initAuth();
        
        if (authResult.success && authResult.user) {
            console.log('مستخدم مسجل مسبقاً:', authResult.user.email);
            
            // تحديث واجهة المستخدم
            UI.updateUserUI(authResult.user, authResult.isAdmin || false);
            UI.showMainApp();
            
            // تحميل المنتجات
            await UI.loadProductsSection();
        }
        // إذا لم يكن هناك مستخدم، تبقى شاشة تسجيل الدخول معروضة
    } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
    }
    
    // 4. إعداد كل مستمعي الأحداث
    setupEventListeners();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    console.log('إعداد مستمعي الأحداث...');
    
    // مصادقة Google
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (result.success && result.user) {
                UI.updateUserUI(result.user, false);
                UI.showMainApp();
                await UI.loadProductsSection();
            } else {
                showMessage('خطأ', result.error || 'حدث خطأ في التسجيل', 'error');
            }
        });
    }

    // إظهار نموذج البريد
    const showEmailBtn = document.getElementById('showEmailFormBtn');
    if (showEmailBtn) {
        showEmailBtn.addEventListener('click', UI.showEmailForm);
    }

    // التسجيل كضيف
    const guestBtn = document.getElementById('guestSignInBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            const result = signInAsGuest();
            if (result.success) {
                UI.updateUserUI(result.user, false);
                UI.showMainApp();
                UI.loadProductsSection();
            }
        });
    }

    // تبديل عرض كلمة المرور
    const togglePassBtn = document.getElementById('togglePassword');
    if (togglePassBtn) {
        togglePassBtn.addEventListener('click', UI.togglePasswordVisibility);
    }

    // تبديل وضع التسجيل/الدخول
    const toggleAuthBtn = document.getElementById('toggleSignUpMode');
    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', UI.toggleAuthMode);
    }

    // استعادة كلمة المرور
    const forgotPassBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', UI.showResetPasswordForm);
    }

    // العودة للخيارات
    const backToOptionsBtn = document.getElementById('backToOptions');
    if (backToOptionsBtn) {
        backToOptionsBtn.addEventListener('click', UI.backToOptions);
    }

    const backToSignInBtn = document.getElementById('backToSignIn');
    if (backToSignInBtn) {
        backToSignInBtn.addEventListener('click', UI.backToOptions);
    }

    // القائمة المتنقلة
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', UI.toggleMobileNav);
    }

    const closeNav = document.getElementById('closeNav');
    if (closeNav) {
        closeNav.addEventListener('click', UI.closeMobileNav);
    }

    // التنقل بين الأقسام
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            const sectionMap = {
                'home': 'home',
                'products': 'productsSection',
                'cart': 'cartSection',
                'orders': 'ordersSection',
                'profile': 'profileSection',
                'admin': 'adminSection',
                'contact': 'contactSection'
            };
            
            const targetSection = sectionMap[sectionId];
            if (targetSection) {
                if (sectionId === 'admin' && !isUserAdmin()) {
                    showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                    return;
                }
                
                UI.showSection(targetSection);
                UI.closeMobileNav();
            }
        });
    });

    // بدء التسوق
    const startShoppingBtn = document.getElementById('startShoppingBtn');
    if (startShoppingBtn) {
        startShoppingBtn.addEventListener('click', () => {
            UI.showSection('productsSection');
        });
    }

    // سلة التسوق
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            UI.showSection('cartSection');
        });
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut();
            UI.showAuthScreen();
        });
    }

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', async () => {
            await signOut();
            UI.showAuthScreen();
        });
    }

    // نموذج تسجيل الدخول/التسجيل
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        emailAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            const displayNameInput = document.getElementById('displayNameInput');
            
            let result;
            
            if (displayNameInput && displayNameInput.classList.contains('hidden')) {
                result = await signInWithEmail(email, password);
            } else {
                const displayName = displayNameInput.value;
                result = await signUpWithEmail(email, password, displayName);
            }
            
            if (result.success && result.user) {
                UI.updateUserUI(result.user, false);
                UI.showMainApp();
                await UI.loadProductsSection();
            } else {
                showMessage('خطأ', result.error || 'حدث خطأ', 'error');
            }
        });
    }

    // نموذج استعادة كلمة المرور
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmailInput').value;
            const result = await resetPassword(email);
            
            if (result.success) {
                showMessage('تم الإرسال', 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', 'success');
                UI.backToOptions();
            } else {
                showMessage('خطأ', result.error, 'error');
            }
        });
    }

    // زر التأكيد في مودال التأكيد
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', executePendingAction);
    }
    
    // زر الإلغاء في مودال التأكيد
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', clearConfirmation);
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// تصدير UI للاستخدام في الملفات الأخرى
export { UI };