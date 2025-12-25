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
    getCartItemCount,
    CartState
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
    // إخفاء شاشة التحميل الأولية
    hideInitialLoader() {
        const loader = document.getElementById('initialLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.classList.add('hidden'), 300);
        }
    },

    // إظهار شاشة المصادقة
    showAuthScreen() {
        this.hideInitialLoader();
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.body.style.overflow = 'hidden';
    },

    // إظهار التطبيق الرئيسي
    showMainApp() {
        this.hideInitialLoader();
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.body.style.overflow = 'auto';
        
        // تحميل السنة الحالية
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
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
        
        // إظهار الأقسام التي لا تحتوي على Section
        if (sectionId === 'home') {
            const servicesSection = document.querySelector('.services-section');
            const contactSection = document.getElementById('contactSection');
            
            if (servicesSection) servicesSection.classList.remove('hidden');
            if (contactSection) contactSection.classList.remove('hidden');
        }
        
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
        UI.showLoading();
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
        
        // تحميل الإحصائيات
        const stats = await getStoreStats();
        this.updateAdminStats(stats);
        
        // تحميل المنتجات للجدول
        const products = await loadAllProducts();
        this.renderAdminProducts(products);
        
        // تحميل إعدادات الموقع
        const settings = await getSiteSettings();
        this.loadSiteSettings(settings);
    },

    // تحميل قسم الملف الشخصي
    loadProfileSection() {
        const user = getCurrentUser();
        if (user) {
            // تحميل بيانات المستخدم الإضافية هنا
            console.log('تحميل بيانات الملف الشخصي:', user);
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
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;
        document.getElementById('profileAvatar').src = photo;
        document.getElementById('editDisplayName').value = name;
        
        // تحديث الجوال
        document.getElementById('mobileUserName').textContent = name;
        document.getElementById('mobileUserEmail').textContent = email;
        document.getElementById('mobileUserAvatar').src = photo;

        // تحديث بادجة الأدمن
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            if (isAdmin) {
                adminBadge.classList.remove('hidden');
                document.getElementById('adminMobileBtn').classList.remove('hidden');
            } else {
                adminBadge.classList.add('hidden');
                document.getElementById('adminMobileBtn').classList.add('hidden');
            }
        }
        
        // تحديث أزرار الجوال
        document.getElementById('mobileAuthBtn').classList.add('hidden');
        document.getElementById('mobileLogoutBtn').classList.remove('hidden');
        document.getElementById('mobileUserInfo').classList.remove('hidden');
        document.getElementById('cartMobileBtn').classList.remove('hidden');
        document.getElementById('ordersMobileBtn').classList.remove('hidden');
    },

    // تبديل قائمة الجوال
    toggleMobileNav() {
        const nav = document.getElementById('mobileNav');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
    },

    // إغلاق قائمة الجوال
    closeMobileNav() {
        document.getElementById('mobileNav').classList.remove('active');
        document.body.style.overflow = 'auto';
    },

    // تبديل عرض كلمة المرور
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('passwordInput');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },

    // تبديل وضع التسجيل/الدخول
    toggleAuthMode() {
        const isSignUpMode = document.getElementById('displayNameInput').classList.toggle('hidden');
        const signInBtn = document.getElementById('signInWithEmailBtn');
        const toggleBtn = document.getElementById('toggleSignUpMode');
        
        if (isSignUpMode) {
            signInBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب';
            toggleBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
        } else {
            signInBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            toggleBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
        }
    },

    // إظهار نموذج البريد
    showEmailForm() {
        document.getElementById('authOptions').classList.add('hidden');
        document.getElementById('emailAuthSection').classList.remove('hidden');
        document.getElementById('emailAuthForm').classList.remove('hidden');
        document.getElementById('resetPasswordSection').classList.add('hidden');
        
        // التأكد من أننا في وضع تسجيل الدخول عند العودة
        if (!document.getElementById('displayNameInput').classList.contains('hidden')) {
            this.toggleAuthMode();
        }
    },

    // إظهار نموذج استعادة كلمة المرور
    showResetPasswordForm() {
        document.getElementById('authOptions').classList.add('hidden');
        document.getElementById('emailAuthSection').classList.remove('hidden');
        document.getElementById('emailAuthForm').classList.add('hidden');
        document.getElementById('resetPasswordSection').classList.remove('hidden');
    },

    // العودة للخيارات
    backToOptions() {
        document.getElementById('emailAuthSection').classList.add('hidden');
        document.getElementById('authOptions').classList.remove('hidden');
        document.getElementById('resetPasswordSection').classList.add('hidden');
        document.getElementById('emailAuthForm').classList.remove('hidden');
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
            
            cartSummary.innerHTML = '';
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

    // إظهار مؤشر التحميل
    showLoading() {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading-spinner"></div>';
        }
    },

    // تحديث إحصائيات الإدارة
    updateAdminStats(stats) {
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = stats.totalRevenue + ' ر.س';
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
        document.getElementById('storeNameInput').value = settings.storeName || '';
        document.getElementById('logoInput').value = settings.logoUrl || '';
        document.getElementById('emailInput').value = settings.email || '';
        document.getElementById('phone1Input').value = settings.phone1 || '';
        document.getElementById('phone2Input').value = settings.phone2 || '';
        document.getElementById('deliveryTimeInput').value = settings.deliveryTime || 5;
        document.getElementById('shippingCostInput').value = settings.shippingCost || 0;
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
                        await UI.loadAdminSection();
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
    },

    // عرض مودال المنتج
    showProductModal(product = null) {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        if (product) {
            modalTitle.textContent = 'تعديل المنتج';
            document.getElementById('editProductId').value = product.id;
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productPrice').value = product.price || '';
            document.getElementById('productImage').value = product.image || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productCategory').value = product.category || 'perfume';
            document.getElementById('productStock').value = product.stock || 10;
            document.getElementById('productSKU').value = product.sku || '';
            document.getElementById('productBrand').value = product.brand || '';
            document.getElementById('isNew').checked = product.isNew || false;
            document.getElementById('isSale').checked = product.isSale || false;
            document.getElementById('isBest').checked = product.isBest || false;
            document.getElementById('isActive').checked = product.isActive !== false;
            
            // معاينة الصورة
            const preview = document.getElementById('productImagePreview');
            if (product.image) {
                preview.src = product.image;
                preview.classList.remove('hidden');
            }
        } else {
            modalTitle.textContent = 'إضافة منتج جديد';
            form.reset();
            document.getElementById('editProductId').value = '';
            document.getElementById('productImagePreview').classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
        
        // إغلاق المودال
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        });
        
        // رفع الصورة
        const imageInput = document.getElementById('productImageFile');
        const imagePreview = document.getElementById('productImagePreview');
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                    document.getElementById('productImage').value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // حفظ المنتج
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                image: document.getElementById('productImage').value,
                description: document.getElementById('productDescription').value,
                category: document.getElementById('productCategory').value,
                stock: parseInt(document.getElementById('productStock').value),
                sku: document.getElementById('productSKU').value,
                brand: document.getElementById('productBrand').value,
                isNew: document.getElementById('isNew').checked,
                isSale: document.getElementById('isSale').checked,
                isBest: document.getElementById('isBest').checked,
                isActive: document.getElementById('isActive').checked
            };
            
            const productId = document.getElementById('editProductId').value;
            let result;
            
            if (productId) {
                result = await updateExistingProduct(productId, productData);
            } else {
                result = await addNewProduct(productData);
            }
            
            if (result.success) {
                showMessage('نجاح', productId ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح', 'success');
                modal.classList.add('hidden');
                await UI.loadAdminSection();
            } else {
                showMessage('خطأ', result.error, 'error');
            }
        });
    }
};

// تهيئة التطبيق
async function initApp() {
    try {
        // تهيئة وحدات التطبيق
        initProducts();
        initCart();
        initAdmin();
        initAuth(UI);
        
        // إعداد مستمعي الأحداث العامة
        setupEventListeners();
        
        // إخفاء شاشة التحميل بعد ثانيتين (في حالة عدم وجود اتصال)
        setTimeout(() => {
            UI.hideInitialLoader();
            if (!getCurrentUser()) {
                UI.showAuthScreen();
            }
        }, 2000);
        
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        UI.showAuthScreen();
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // مصادقة Google
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (!result.success) {
                showMessage('خطأ', result.error, 'error');
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
            signInAsGuest();
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
                // التحقق من صلاحية الوصول للإدارة
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
            const result = await signOut();
            if (!result.success) {
                showMessage('خطأ', result.error, 'error');
            }
        });
    }

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', async () => {
            const result = await signOut();
            if (!result.success) {
                showMessage('خطأ', result.error, 'error');
            }
        });
    }

    // أزرار التصفية
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            const filteredProducts = filterProducts(filter);
            UI.updateFilterButtons(filter);
            UI.renderProducts(filteredProducts);
        });
    });

    // بحث المنتجات
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filteredProducts = searchProducts(e.target.value);
            UI.renderProducts(filteredProducts);
        });
    }

    // ترتيب المنتجات
    const sortSelect = document.getElementById('productSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            ProductsState.currentSort = e.target.value;
            const sortedProducts = filterProducts(ProductsState.currentFilter);
            UI.renderProducts(sortedProducts);
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
            
            if (displayNameInput.classList.contains('hidden')) {
                // تسجيل الدخول
                result = await signInWithEmail(email, password);
            } else {
                // إنشاء حساب
                const displayName = displayNameInput.value;
                result = await signUpWithEmail(email, password, displayName);
            }
            
            if (!result.success) {
                showMessage('خطأ', result.error, 'error');
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

    // تبويبات الإدارة
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = e.target.closest('.admin-tab').dataset.tab;
            
            // إزالة النشاط من جميع التبويبات
            document.querySelectorAll('.admin-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // إضافة النشاط للتبويب المختار
            e.target.closest('.admin-tab').classList.add('active');
            
            // إخفاء جميع محتويات التبويبات
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // إظهار محتوى التبويب المختار
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });

    // زر التأكيد في مودال التأكيد
    document.getElementById('confirmBtn').addEventListener('click', executePendingAction);
    
    // زر الإلغاء في مودال التأكيد
    document.getElementById('cancelBtn').addEventListener('click', clearConfirmation);
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// تصدير UI للاستخدام في الملفات الأخرى
export { UI };