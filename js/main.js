// js/main.js - النهائي

const UI = {
    showAuthScreen() {
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        if (authScreen) authScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        document.body.style.overflow = 'hidden';
    },

    showMainApp() {
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        if (authScreen) authScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        document.body.style.overflow = 'auto';
        
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
        
        this.updateCartCount();
        this.setupMainAppEventListeners();
        this.loadProductsSection();
        this.showSection('homeSection');
        this.updateUserUIAfterLogin();
    },

    async updateUserUIAfterLogin() {
        try {
            await refreshAdminUI();
        } catch (error) {
            console.error('خطأ في تحديث واجهة المسؤول:', error);
        }
    },

    updateCartCount() {
        const count = typeof getCartItemCount === 'function' ? getCartItemCount() : 0;
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

    showSection(sectionId) {
        console.log('إظهار القسم:', sectionId);
        
        const sections = [
            'homeSection', 'productsSection', 'adminSection', 
            'profileSection', 'cartSection', 'contactSection'
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
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadSectionContent(sectionId);
    },

    async loadSectionContent(sectionId) {
        console.log('تحميل محتوى القسم:', sectionId);
        
        switch(sectionId) {
            case 'productsSection':
                await this.loadProductsSection();
                break;
            case 'cartSection':
                this.loadCartSection();
                break;
            case 'adminSection':
                if (typeof isUserAdmin === 'function' && isUserAdmin()) {
                    await this.loadAdminSection();
                } else {
                    if (typeof showMessage === 'function') showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                    this.showSection('homeSection');
                }
                break;
            case 'profileSection':
                await this.loadProfileSection();
                break;
        }
    },

    async loadProductsSection() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        try {
            if (productsGrid.children.length === 0 || productsGrid.querySelector('.skeleton')) {
                productsGrid.innerHTML = Array(6).fill(0).map(() => '<div class="skeleton skeleton-card"></div>').join('');
                
                if (typeof loadProducts === 'function') {
                    const products = await loadProducts();
                    this.renderProducts(products);
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل المنتجات:', error);
            productsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>خطأ في تحميل المنتجات</p></div>';
        }
    },

    loadCartSection() {
        if (typeof getCartItems === 'function') {
            const cartItems = getCartItems();
            this.renderCartItems(cartItems);
        }
    },

    async loadAdminSection() {
        if (typeof isUserAdmin !== 'function' || !isUserAdmin()) return;
        
        try {
            if (typeof getStoreStats === 'function') {
                const stats = await getStoreStats();
                this.updateAdminStats(stats);
            }
            
            if (typeof loadAllProducts === 'function') {
                const products = await loadAllProducts();
                this.renderAdminProducts(products);
            }
            
            if (typeof loadSiteSettingsForAdmin === 'function') {
                await loadSiteSettingsForAdmin();
            }
            
            if (typeof switchTab === 'function') {
                switchTab('products');
            }
            
        } catch (error) {
            console.error('خطأ في تحميل قسم الإدارة:', error);
        }
    },

    async loadProfileSection() {
        if (typeof getCurrentUser !== 'function') return;
        const user = getCurrentUser();
        if (!user) return;

        try {
            const userData = typeof getUserData === 'function' ? await getUserData(user) : user;
            
            const profileName = document.getElementById('profileNameSimple');
            const profileEmail = document.getElementById('profileEmailSimple');
            const profileAvatar = document.getElementById('profileAvatarSimple');
            const adminBadge = document.getElementById('profileBadgeSimple');
            
            if (profileName) profileName.textContent = userData.displayName || 'ضيف';
            if (profileEmail) profileEmail.textContent = userData.email || 'غير محدد';
            if (profileAvatar) {
                profileAvatar.src = userData.photoURL || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'Guest')}&background=C89B3C&color=fff`;
            }
            if (adminBadge) {
                adminBadge.classList.toggle('hidden', !(userData.isAdmin && !userData.isGuest));
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات الملف الشخصي:', error);
        }
    },

    updateUserUI(user, isAdmin = false) {
        if (!user) return;

        const name = user.displayName || 'ضيف';
        const email = user.email || '';
        const photo = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C89B3C&color=fff`;
        const isGuest = user.isGuest || false;

        const elements = {
            mobileUserName: document.getElementById('mobileUserName'),
            mobileUserEmail: document.getElementById('mobileUserEmail'),
            mobileUserAvatar: document.getElementById('mobileUserAvatar'),
            mobileAuthBtn: document.getElementById('mobileAuthBtn'),
            mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
            mobileAdminBadge: document.getElementById('mobileAdminBadge'),
            adminMobileBtn: document.getElementById('adminMobileBtn')
        };
        
        if (elements.mobileUserName) elements.mobileUserName.textContent = name;
        if (elements.mobileUserEmail) elements.mobileUserEmail.textContent = isGuest ? 'مستخدم ضيف' : email;
        if (elements.mobileUserAvatar) elements.mobileUserAvatar.src = photo;
        
        if (elements.mobileAuthBtn) elements.mobileAuthBtn.classList.toggle('hidden', !isGuest);
        if (elements.mobileLogoutBtn) elements.mobileLogoutBtn.classList.toggle('hidden', isGuest);
        
        const showAdmin = isAdmin && !isGuest;
        if (elements.mobileAdminBadge) elements.mobileAdminBadge.classList.toggle('hidden', !showAdmin);
        if (elements.adminMobileBtn) elements.adminMobileBtn.classList.toggle('hidden', !showAdmin);
        
        this.updateCartCount();
    },

    setupMainAppEventListeners() {
        if (window.mainEventListenersSet) return;
        window.mainEventListenersSet = true;

        console.log('إعداد مستمعي أحداث الموقع الرئيسي...');
        
        const menuToggle = document.getElementById('menuToggle');
        const closeNav = document.getElementById('closeNav');
        const mobileNav = document.getElementById('mobileNav');

        if (menuToggle && mobileNav) {
            menuToggle.onclick = (e) => {
                e.stopPropagation();
                mobileNav.classList.add('active');
                document.body.style.overflow = 'hidden';
                this.updateUserUIAfterLogin();
            };
        }

        if (closeNav && mobileNav) {
            closeNav.onclick = (e) => {
                e.stopPropagation();
                mobileNav.classList.remove('active');
                document.body.style.overflow = 'auto';
            };
        }

        document.addEventListener('click', (e) => {
            if (mobileNav && mobileNav.classList.contains('active') && !mobileNav.contains(e.target) && e.target !== menuToggle) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                const sectionMap = {
                    'home': 'homeSection',
                    'products': 'productsSection',
                    'cart': 'cartSection',
                    'profile': 'profileSection',
                    'admin': 'adminSection',
                    'contact': 'contactSection'
                };
                
                const targetSection = sectionMap[sectionId];
                if (targetSection) {
                    this.showSection(targetSection);
                    if (mobileNav) mobileNav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            };
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                if (typeof filterProducts === 'function') {
                    const filtered = filterProducts(filter);
                    this.renderProducts(filtered);
                }
            });
        });
        
        const sortSelect = document.getElementById('productSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                if (typeof filterProducts === 'function') {
                    const filtered = filterProducts('all');
                    const sorted = sortProducts(filtered, e.target.value);
                    this.renderProducts(sorted);
                }
            });
        }
    },

    renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>لا توجد منتجات حالياً</p></div>';
            return;
        }
        
        productsGrid.innerHTML = products.map(product => {
            const categoryName = typeof getCategoryName === 'function' ? getCategoryName(product.category) : product.category || 'عطور';
            const stockClass = product.stock <= 0 ? 'out-of-stock' : 
                              product.stock <= 5 ? 'low-stock' : 'in-stock';
            const stockText = product.stock <= 0 ? 'نفذت الكمية' : 
                             product.stock <= 5 ? `آخر ${product.stock}` : 'متوفر';
            
            return `
                <div class="product-card" data-id="${product.id}">
                    ${product.isNew ? '<div class="product-badge new">جديد</div>' : ''}
                    ${product.isSale ? '<div class="product-badge sale">عرض</div>' : ''}
                    ${product.isBest ? '<div class="product-badge best">أفضل</div>' : ''}
                    
                    <div class="product-image-container">
                        <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                             alt="${product.name || 'منتج'}" 
                             class="product-image"
                             onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name || 'منتج بدون اسم'}</h3>
                        <div class="product-meta">
                            <span class="product-category">${categoryName}</span>
                            <span class="${stockClass}">
                                ${stockText}
                            </span>
                        </div>
                        <div class="product-footer">
                            <div class="product-price">
                                <span class="current-price">${product.price || 0} ر.س</span>
                            </div>
                            <button class="btn primary-btn add-to-cart-btn" 
                                    onclick="if(typeof addToCart === 'function') { addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); UI.updateCartCount(); }"
                                    ${product.stock <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateAdminStats(stats) {
        const elements = {
            totalProducts: document.getElementById('totalProductsStat'),
            totalUsers: document.getElementById('totalUsersStat'),
            totalOrders: document.getElementById('totalOrdersStat'),
            totalRevenue: document.getElementById('totalRevenueStat')
        };
        
        if (elements.totalProducts) elements.totalProducts.textContent = stats.totalProducts || 0;
        if (elements.totalUsers) elements.totalUsers.textContent = stats.totalUsers || 0;
        if (elements.totalOrders) elements.totalOrders.textContent = stats.totalOrders || 0;
        if (elements.totalRevenue) elements.totalRevenue.textContent = `${(stats.totalRevenue || 0).toFixed(2)} ر.س`;
    },

    renderAdminProducts(products) {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;
        
        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد منتجات</td></tr>';
            return;
        }
        
        tableBody.innerHTML = products.map(product => {
            const productJson = JSON.stringify(product).replace(/"/g, '&quot;');
            return `
                <tr>
                    <td><img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" width="40" height="40" style="border-radius:4px"></td>
                    <td><strong>${product.name}</strong></td>
                    <td>${typeof getCategoryName === 'function' ? getCategoryName(product.category) : product.category}</td>
                    <td>${product.price} ر.س</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <span class="product-status ${product.isActive !== false ? 'status-active' : 'status-inactive'}">
                            ${product.isActive !== false ? 'نشط' : 'غير نشط'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn small-btn edit-product" onclick="editProductModal(${productJson})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn small-btn danger-btn delete-product" onclick="deleteProduct('${product.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderCartItems(cartItems) {
        const container = document.getElementById('cartItems');
        if (!container) return;
        
        if (!cartItems || cartItems.length === 0) {
            container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-basket"></i><p>سلة التسوق فارغة</p></div>';
            return;
        }
        
        container.innerHTML = cartItems.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price} ر.س</p>
                </div>
                <div class="item-quantity">
                    <button onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }
};

async function refreshAdminUI() {
    if (typeof isUserAdmin === 'function' && isUserAdmin()) {
        const stats = typeof getStoreStats === 'function' ? await getStoreStats() : null;
        if (stats) UI.updateAdminStats(stats);
        
        const products = typeof loadAllProducts === 'function' ? await loadAllProducts() : [];
        UI.renderAdminProducts(products);
    }
}

async function initApp() {
    console.log('بدء تشغيل المتجر...');
    
    try {
        if (typeof initializeFirebase === 'function') initializeFirebase();
        
        // تهيئة نظام المصادقة أولاً
        let authResult = { success: false };
        if (typeof initAuth === 'function') {
            authResult = await initAuth();
        }
        
        if (typeof initProducts === 'function') initProducts();
        if (typeof initCart === 'function') initCart();
        if (typeof initAdmin === 'function') initAdmin();
        
        UI.setupMainAppEventListeners();
        setupForms();
        setupGlobalModals();
        
        if (authResult.success && authResult.user) {
            UI.updateUserUI(authResult.user, authResult.isAdmin);
            UI.showMainApp();
            
            setTimeout(async () => {
                await refreshAdminUI();
            }, 100);
        } else {
            // محاولة التحميل من LocalStorage كحل احتياطي سريع
            const savedUser = typeof loadUserFromLocalStorage === 'function' ? loadUserFromLocalStorage() : { success: false };
            if (savedUser.success && savedUser.user) {
                UI.updateUserUI(savedUser.user, savedUser.user.isAdmin);
                UI.showMainApp();
            } else {
                UI.showAuthScreen();
            }
        }
        
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        UI.showMainApp();
    }
}

function setupForms() {
    // تسجيل الدخول بالبريد
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        emailAuthForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            const displayNameInput = document.getElementById('displayNameInput');
            
            let result;
            if (displayNameInput.classList.contains('hidden')) {
                result = typeof signInWithEmail === 'function' ? await signInWithEmail(email, password) : { success: false };
            } else {
                const displayName = displayNameInput.value;
                result = typeof signUpWithEmail === 'function' ? await signUpWithEmail(email, password, displayName) : { success: false };
            }
            
            if (result.success) {
                UI.updateUserUI(result.user, result.isAdmin);
                UI.showMainApp();
            } else {
                if (typeof showMessage === 'function') showMessage('خطأ', result.error || 'فشل العملية', 'error');
            }
        };
    }

    // تسجيل الدخول بـ Google
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.onclick = async () => {
            const result = typeof signInWithGoogle === 'function' ? await signInWithGoogle() : { success: false };
            if (result.success) {
                UI.updateUserUI(result.user, result.isAdmin);
                UI.showMainApp();
            } else if (result.error) {
                if (typeof showMessage === 'function') showMessage('خطأ', result.error, 'error');
            }
        };
    }

    // تسجيل الدخول كضيف
    const guestBtn = document.getElementById('guestSignInBtn');
    if (guestBtn) {
        guestBtn.onclick = () => {
            const result = typeof signInAsGuest === 'function' ? signInAsGuest() : { success: false };
            if (result.success) {
                UI.updateUserUI(result.user, false);
                UI.showMainApp();
            }
        };
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById('mobileLogoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (typeof signOut === 'function') await signOut();
        };
    }

    // التبديل بين تسجيل الدخول وإنشاء حساب
    const toggleSignUpBtn = document.getElementById('toggleSignUpMode');
    if (toggleSignUpBtn) {
        toggleSignUpBtn.onclick = () => {
            const displayNameInput = document.getElementById('displayNameInput');
            const submitBtn = document.getElementById('signInWithEmailBtn');
            const isLogin = displayNameInput.classList.contains('hidden');
            
            if (isLogin) {
                displayNameInput.classList.remove('hidden');
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب';
                toggleSignUpBtn.textContent = 'لديك حساب بالفعل؟ سجل دخولك';
            } else {
                displayNameInput.classList.add('hidden');
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
                toggleSignUpBtn.textContent = 'إنشاء حساب جديد';
            }
        };
    }

    // إظهار نموذج البريد
    const showEmailBtn = document.getElementById('showEmailFormBtn');
    if (showEmailBtn) {
        showEmailBtn.onclick = () => {
            document.getElementById('authOptions').classList.add('hidden');
            document.getElementById('emailAuthSection').classList.remove('hidden');
        };
    }

    // العودة لخيارات التسجيل
    const backToOptionsBtn = document.getElementById('backToOptions');
    if (backToOptionsBtn) {
        backToOptionsBtn.onclick = () => {
            document.getElementById('authOptions').classList.remove('hidden');
            document.getElementById('emailAuthSection').classList.add('hidden');
        };
    }
}

function setupGlobalModals() {
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        const closeBtn = messageModal.querySelector('.close-modal') || document.getElementById('messageCloseBtn');
        if (closeBtn) closeBtn.onclick = () => messageModal.classList.add('hidden');
    }
}

function showMessage(title, text, type = 'info') {
    const messageModal = document.getElementById('messageModal');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    const messageIcon = document.getElementById('messageIcon');
    
    if (!messageModal || !messageTitle || !messageText) return;
    
    messageTitle.textContent = title;
    messageText.textContent = text;
    
    let iconClass = 'fas fa-info-circle';
    let iconColor = 'var(--info)';
    
    switch(type) {
        case 'error':
            iconClass = 'fas fa-exclamation-triangle';
            iconColor = 'var(--danger)';
            break;
        case 'success':
            iconClass = 'fas fa-check-circle';
            iconColor = 'var(--success)';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-circle';
            iconColor = 'var(--warning)';
            break;
    }
    
    if (messageIcon) {
        messageIcon.className = iconClass;
        messageIcon.style.color = iconColor;
    }
    
    messageModal.classList.remove('hidden');
    
    setTimeout(() => {
        messageModal.classList.add('hidden');
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.UI = UI;
window.showMessage = showMessage;
window.refreshAdminUI = refreshAdminUI;
