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
    getUserData
} from './auth.js';

import { 
    initProducts, 
    loadProducts, 
    getProductById
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
    deleteProductById,
    updateSiteSettings,
    getStoreStats,
    setupConfirmation,
    clearConfirmation,
    executePendingAction
} from './admin.js';

// دالة showMessage محلية
function showMessage(title, message, type = 'info') {
    console.log(`${title}: ${message}`);
    
    // عرض تنبيه مؤقت
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// دالة isUserAdmin محلية
function isUserAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

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
        
        // تحديث عداد السلة
        this.updateCartCount();
    },

    // تحديث عداد السلة
    updateCartCount() {
        const count = getCartItemCount();
        const cartCount = document.getElementById('cartCount');
        const cartMobileCount = document.getElementById('cartMobileCount');
        
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.classList.toggle('hidden', count === 0);
        }
        
        if (cartMobileCount) {
            cartMobileCount.textContent = count;
            cartMobileCount.classList.toggle('hidden', count === 0);
        }
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
        try {
            const products = await loadProducts();
            this.renderProducts(products);
        } catch (error) {
            console.error('خطأ في تحميل المنتجات:', error);
            // عرض منتجات افتراضية للاختبار
            this.renderProducts(this.getSampleProducts());
        }
    },

    // تحميل قسم السلة
    loadCartSection() {
        const cartItems = getCartItems();
        this.renderCartItems(cartItems);
    },

    // تحميل قسم الإدارة
    async loadAdminSection() {
        if (!isUserAdmin()) {
            showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
            return;
        }
        
        try {
            const stats = await getStoreStats();
            this.updateAdminStats(stats);
            
            const products = await loadAllProducts();
            this.renderAdminProducts(products);
        } catch (error) {
            console.error('خطأ في تحميل قسم الإدارة:', error);
            showMessage('خطأ', 'تعذر تحميل بيانات الإدارة', 'error');
        }
    },

    // تحميل قسم الملف الشخصي
    async loadProfileSection() {
        const user = getCurrentUser();
        if (user) {
            try {
                const userData = await getUserData(user);
                this.updateProfileSection(userData || user);
            } catch (error) {
                console.error('خطأ في تحميل بيانات المستخدم:', error);
            }
        }
    },

    // تحديث قسم الملف الشخصي
    updateProfileSection(userData) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        const editDisplayName = document.getElementById('editDisplayName');
        
        if (profileName) profileName.textContent = userData.displayName || 'مستخدم';
        if (profileEmail) profileEmail.textContent = userData.email || 'غير محدد';
        if (profileAvatar) {
            profileAvatar.src = userData.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=C89B3C&color=fff`;
        }
        if (editDisplayName) editDisplayName.value = userData.displayName || '';
    },

    // تحديث واجهة المستخدم ببيانات المستخدم
    updateUserUI(user, isAdmin = false) {
        if (!user) return;

        const name = user.displayName || 'مستخدم';
        const email = user.email || '';
        const photo = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C89B3C&color=fff`;

        // تحديث الهيدر
        const ordersBtn = document.getElementById('ordersBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (ordersBtn) ordersBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');

        // تحديث الجوال
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserEmail = document.getElementById('mobileUserEmail');
        const mobileUserAvatar = document.getElementById('mobileUserAvatar');
        const mobileUserInfo = document.getElementById('mobileUserInfo');
        
        if (mobileUserName) mobileUserName.textContent = name;
        if (mobileUserEmail) mobileUserEmail.textContent = email;
        if (mobileUserAvatar) mobileUserAvatar.src = photo;
        if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');

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
        const cartMobileBtn = document.getElementById('cartMobileBtn');
        const ordersMobileBtn = document.getElementById('ordersMobileBtn');
        
        if (mobileAuthBtn) mobileAuthBtn.classList.add('hidden');
        if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
        if (cartMobileBtn) cartMobileBtn.classList.remove('hidden');
        if (ordersMobileBtn) ordersMobileBtn.classList.remove('hidden');
    },

    // إغلاق قائمة الجوال
    closeMobileNav() {
        const nav = document.getElementById('mobileNav');
        if (nav) {
            nav.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
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
                const product = getProductById(productId) || this.getSampleProduct(productId);
                if (product) {
                    addToCart(product, 1);
                    this.updateCartCount();
                    showMessage('تمت الإضافة', `تم إضافة "${product.name}" إلى السلة`, 'success');
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
                this.updateCartCount();
            });
        });
        
        // تقليل الكمية
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.id;
                updateCartQuantity(productId, -1);
                this.loadCartSection();
                this.updateCartCount();
            });
        });
        
        // إزالة العنصر
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.remove-item-btn').dataset.id;
                removeFromCart(productId);
                this.loadCartSection();
                this.updateCartCount();
            });
        });
        
        // تفريغ السلة
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                clearCart();
                this.loadCartSection();
                this.updateCartCount();
                showMessage('تم', 'تم تفريغ سلة التسوق', 'success');
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
        
        // حفظ إعدادات الموقع
        const siteSettingsForm = document.getElementById('siteSettingsForm');
        if (siteSettingsForm) {
            siteSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                showMessage('تطوير', 'ميزة حفظ الإعدادات قيد التطوير', 'info');
            });
        }
    },

    // منتجات افتراضية للاختبار
    getSampleProducts() {
        return [
            {
                id: '1',
                name: 'عطر فاخر',
                description: 'عطر فاخر برائحة عطرية مميزة',
                price: 150,
                image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
                isNew: true
            },
            {
                id: '2',
                name: 'مكياج سائل',
                description: 'مكياج سائل عالي الجودة',
                price: 85,
                oldPrice: 120,
                image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=300&h=300&fit=crop',
                isSale: true
            },
            {
                id: '3',
                name: 'عطر نسائي',
                description: 'عطر نسائي برائحة زهرية',
                price: 200,
                image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=300&h=300&fit=crop',
                isBest: true
            },
            {
                id: '4',
                name: 'كريم ترطيب',
                description: 'كريم ترطيب للبشرة',
                price: 65,
                image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?q=80&w=300&h=300&fit=crop'
            }
        ];
    },

    // منتج افتراضي للاختبار
    getSampleProduct(id) {
        const products = this.getSampleProducts();
        return products.find(p => p.id === id) || {
            id: id,
            name: 'منتج افتراضي',
            description: 'منتج للاختبار',
            price: 50,
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'
        };
    }
};

// تهيئة التطبيق
async function initApp() {
    console.log('بدء تشغيل المتجر...');
    
    // تهيئة وحدات التطبيق الأساسية
    initProducts();
    initCart();
    initAdmin();
    
    try {
        const authResult = await initAuth();
        
        if (authResult.success && authResult.user) {
            console.log('مستخدم مسجل مسبقاً:', authResult.user.email);
            UI.updateUserUI(authResult.user, authResult.isAdmin || false);
            UI.showMainApp();
            await UI.loadProductsSection();
        } else {
            // إظهار شاشة تسجيل الدخول إذا لم يكن هناك مستخدم
            UI.showAuthScreen();
        }
    } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        UI.showAuthScreen();
    }
    
    // إعداد كل مستمعي الأحداث
    setupEventListeners();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    console.log('إعداد مستمعي الأحداث...');
    
    // القائمة المتنقلة
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const nav = document.getElementById('mobileNav');
            if (nav) {
                nav.classList.toggle('active');
                document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
            }
        });
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
    
    // أزرار المصادقة
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (result.success) {
                UI.updateUserUI(result.user, result.user.isAdmin || false);
                UI.showMainApp();
                await UI.loadProductsSection();
            } else {
                showMessage('خطأ', result.error || 'فشل تسجيل الدخول', 'error');
            }
        });
    }
    
    const guestSignInBtn = document.getElementById('guestSignInBtn');
    if (guestSignInBtn) {
        guestSignInBtn.addEventListener('click', async () => {
            const result = await signInAsGuest();
            if (result.success) {
                UI.updateUserUI(result.user, false);
                UI.showMainApp();
                await UI.loadProductsSection();
            } else {
                showMessage('خطأ', result.error || 'فشل تسجيل الدخول كضيف', 'error');
            }
        });
    }
    
    // زر عرض نموذج البريد
    const showEmailFormBtn = document.getElementById('showEmailFormBtn');
    if (showEmailFormBtn) {
        showEmailFormBtn.addEventListener('click', () => {
            document.getElementById('authOptions').classList.add('hidden');
            document.getElementById('emailAuthSection').classList.remove('hidden');
        });
    }
    
    // زر العودة للخيارات
    const backToOptions = document.getElementById('backToOptions');
    if (backToOptions) {
        backToOptions.addEventListener('click', () => {
            document.getElementById('emailAuthSection').classList.add('hidden');
            document.getElementById('authOptions').classList.remove('hidden');
        });
    }
    
    // زر تبديل كلمة المرور
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('passwordInput');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// تصدير UI للاستخدام في الملفات الأخرى
export { UI, showMessage };