// js/main.js - تشغيل وربط الكل (مع حماية المسؤولين)

// ==================== متغيرات واجهة المستخدم ====================
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
        
        // إعداد مستمعي الأحداث للموقع الرئيسي
        this.setupMainAppEventListeners();
        
        // تحميل المنتجات
        this.loadProductsSection();
        
        // إظهار القسم الرئيسي
        this.showSection('homeSection');
        
        // تحديث واجهة المستخدم
        this.updateUserUIAfterLogin();
    },

    // تحديث واجهة المستخدم بعد تسجيل الدخول
    async updateUserUIAfterLogin() {
        const user = getCurrentUser();
        if (user) {
            const isAdmin = await verifyAdminStatus();
            this.updateUserUI(user, isAdmin);
        }
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
        console.log('إظهار القسم:', sectionId);
        
        const sections = [
            'homeSection', 'productsSection', 'adminSection', 
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
        console.log('تحميل محتوى القسم:', sectionId);
        
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
                } else {
                    showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                    this.showSection('homeSection');
                }
                break;
            case 'profileSection':
                await this.loadProfileSection();
                break;
            case 'ordersSection':
                this.loadOrdersSection();
                break;
            case 'homeSection':
                // لا تحتاج لتحميل شيء إضافي
                break;
            case 'contactSection':
                // لا تحتاج لتحميل شيء إضافي
                break;
        }
    },

    // تحميل قسم المنتجات
    async loadProductsSection() {
        console.log('تحميل قسم المنتجات...');
        
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        try {
            // عرض مؤشر التحميل
            productsGrid.innerHTML = '<div class="loading-spinner"></div>';
            
            const products = await loadProducts();
            this.renderProducts(products);
            console.log('تم تحميل المنتجات:', products.length);
            
        } catch (error) {
            console.error('خطأ في تحميل المنتجات:', error);
            productsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>خطأ في تحميل المنتجات</p></div>';
        }
    },

    // تحميل قسم السلة
    loadCartSection() {
        console.log('تحميل قسم السلة...');
        
        const cartItems = getCartItems();
        this.renderCartItems(cartItems);
    },

    // تحميل قسم الإدارة (محمي بالكامل)
    async loadAdminSection() {
        console.log('🔐 محاولة تحميل قسم الإدارة...');
        
        // تحقق ثلاثي من صلاحيات المسؤول
        const user = getCurrentUser();
        
        // 1. تحقق من وجود المستخدم
        if (!user) {
            showMessage('غير مصرح', 'يجب تسجيل الدخول أولاً', 'error');
            this.showSection('homeSection');
            return;
        }
        
        // 2. تحقق إذا كان ضيفاً
        if (user.isGuest) {
            showMessage('غير مصرح', 'الضيف لا يمكنه الوصول إلى لوحة الإدارة', 'error');
            this.showSection('homeSection');
            return;
        }
        
        // 3. تحقق من صلاحيات المسؤول في Firestore
        try {
            const isAdmin = await verifyAdminStatus();
            
            console.log('نتيجة التحقق من الإدارة:', {
                email: user.email,
                isAdmin: isAdmin
            });
            
            if (!isAdmin) {
                showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                this.showSection('homeSection');
                return;
            }
            
            // فقط إذا كان مسؤولاً، تابع تحميل لوحة التحكم
            console.log('✅ تم التحقق من صلاحيات المسؤول، جلب البيانات...');
            
            // تحميل الإحصائيات
            const stats = await getStoreStats();
            this.updateAdminStats(stats);
            
            // تحميل المنتجات
            const products = await loadAllProducts();
            this.renderAdminProducts(products);
            
            // تحميل إعدادات الموقع
            await loadSiteSettingsForAdmin();
            
            // إظهار علامة التبويب النشطة
            switchTab('products');
            
            showToast('مرحباً بك في لوحة التحكم', false, 'success');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل قسم الإدارة:', error);
            showMessage('خطأ', 'تعذر تحميل بيانات الإدارة', 'error');
            this.showSection('homeSection');
        }
    },

    // تحميل قسم الملف الشخصي
    async loadProfileSection() {
        console.log('تحميل قسم الملف الشخصي...');
        
        const user = getCurrentUser();
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        const editDisplayName = document.getElementById('editDisplayName');
        const editPhone = document.getElementById('editPhone');
        const editAddress = document.getElementById('editAddress');
        const profileJoinDate = document.getElementById('profileJoinDate');
        const adminBadge = document.getElementById('adminBadge');
        
        if (user) {
            try {
                const userData = await getUserData(user);
                
                if (profileName) profileName.textContent = userData.displayName || 'ضيف';
                if (profileEmail) profileEmail.textContent = userData.email || 'غير محدد';
                if (profileAvatar) {
                    profileAvatar.src = userData.photoURL || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'Guest')}&background=C89B3C&color=fff`;
                }
                if (editDisplayName) editDisplayName.value = userData.displayName || '';
                if (editPhone) editPhone.value = userData.phone || '';
                if (editAddress) editAddress.value = userData.address || '';
                if (profileJoinDate) {
                    const date = userData.createdAt ? 
                        formatDate(userData.createdAt) :
                        'غير محدد';
                    profileJoinDate.textContent = `تاريخ الانضمام: ${date}`;
                }
                if (adminBadge) {
                    if (userData.isAdmin) {
                        adminBadge.classList.remove('hidden');
                    } else {
                        adminBadge.classList.add('hidden');
                    }
                }
            } catch (error) {
                console.error('خطأ في تحميل بيانات المستخدم:', error);
                
                // بيانات افتراضية للضيف
                if (profileName) profileName.textContent = 'ضيف';
                if (profileEmail) profileEmail.textContent = 'مستخدم غير مسجل';
                if (profileAvatar) {
                    profileAvatar.src = 'https://ui-avatars.com/api/?name=Guest&background=C89B3C&color=fff';
                }
                if (editDisplayName) editDisplayName.value = 'ضيف';
                if (profileJoinDate) profileJoinDate.textContent = 'تاريخ الانضمام: غير محدد';
                if (adminBadge) adminBadge.classList.add('hidden');
            }
        }
    },

    // تحميل قسم الطلبات
    loadOrdersSection() {
        console.log('تحميل قسم الطلبات...');
        
        const ordersList = document.getElementById('ordersList');
        if (ordersList) {
            const user = getCurrentUser();
            
            if (user && !user.isGuest) {
                // عرض الطلبات للمستخدم المسجل
                this.renderUserOrders();
            } else {
                // عرض رسالة للمستخدم الضيف
                ordersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <p>يرجى تسجيل الدخول لعرض الطلبات</p>
                        <button class="btn primary-btn" onclick="UI.showAuthScreen()">
                            تسجيل الدخول
                        </button>
                    </div>
                `;
            }
        }
    },

    // تحديث واجهة المستخدم ببيانات المستخدم
    updateUserUI(user, isAdmin = false) {
        if (!user) return;

        const name = user.displayName || 'ضيف';
        const email = user.email || '';
        const photo = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C89B3C&color=fff`;

        console.log('تحديث واجهة المستخدم:', name, 'isAdmin:', isAdmin);

        // ========== تحديث الهيدر ==========
        const ordersBtn = document.getElementById('ordersBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userToggle = document.getElementById('userToggle');
        const adminHeaderBtn = document.getElementById('adminHeaderBtn');
        const debugAdminBtn = document.getElementById('debugAdminBtn');
        
        if (ordersBtn) {
            if (user.isGuest) {
                ordersBtn.classList.add('hidden');
            } else {
                ordersBtn.classList.remove('hidden');
            }
        }
        
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (userToggle) {
            userToggle.innerHTML = user.isGuest ? 
                '<i class="far fa-user"></i>' : 
                `<i class="fas fa-user-circle"></i>`;
        }
        
        // زر الإدارة في الهيدر
        if (adminHeaderBtn) {
            if (isAdmin) {
                adminHeaderBtn.classList.remove('hidden');
                console.log('✅ تم اظهار زر الإدارة في الهيدر');
            } else {
                adminHeaderBtn.classList.add('hidden');
                console.log('❌ تم إخفاء زر الإدارة في الهيدر');
            }
        }
        
        // إخفاء زر التصحيح نهائياً
        if (debugAdminBtn) {
            debugAdminBtn.style.display = 'none';
            debugAdminBtn.classList.add('hidden');
        }

        // ========== تحديث الجوال ==========
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserEmail = document.getElementById('mobileUserEmail');
        const mobileUserAvatar = document.getElementById('mobileUserAvatar');
        const mobileUserInfo = document.getElementById('mobileUserInfo');
        const mobileAuthBtn = document.getElementById('mobileAuthBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const cartMobileBtn = document.getElementById('cartMobileBtn');
        const ordersMobileBtn = document.getElementById('ordersMobileBtn');
        const adminMobileBtn = document.getElementById('adminMobileBtn');
        
        if (mobileUserName) mobileUserName.textContent = name;
        if (mobileUserEmail) mobileUserEmail.textContent = user.isGuest ? 'مستخدم ضيف' : email;
        if (mobileUserAvatar) mobileUserAvatar.src = photo;
        if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');
        if (mobileAuthBtn) mobileAuthBtn.classList.add('hidden');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.classList.remove('hidden');
            mobileLogoutBtn.innerHTML = user.isGuest ? 
                '<i class="fas fa-user-slash"></i> الخروج كضيف' : 
                '<i class="fas fa-sign-out-alt"></i> تسجيل الخروج';
        }
        if (cartMobileBtn) cartMobileBtn.classList.remove('hidden');
        if (ordersMobileBtn) {
            if (user.isGuest) {
                ordersMobileBtn.classList.add('hidden');
            } else {
                ordersMobileBtn.classList.remove('hidden');
            }
        }
        if (adminMobileBtn) {
            if (isAdmin) {
                adminMobileBtn.classList.remove('hidden');
                console.log('✅ تم اظهار زر الإدارة في الجوال');
            } else {
                adminMobileBtn.classList.add('hidden');
                console.log('❌ تم إخفاء زر الإدارة في الجوال');
            }
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
        
        grid.innerHTML = products.map(product => {
            const categoryName = getCategoryName(product.category);
            
            return `
                <div class="product-card" data-id="${product.id}">
                    ${product.isNew ? '<span class="product-badge new">جديد</span>' : ''}
                    ${product.isSale ? '<span class="product-badge sale">عرض خاص</span>' : ''}
                    ${product.isBest ? '<span class="product-badge best">الأفضل</span>' : ''}
                    
                    <div class="product-image-container">
                        <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                             alt="${product.name || 'منتج'}" 
                             class="product-image"
                             onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'">
                    </div>
                    <div class="product-info">
                        <div class="product-header">
                            <h3 class="product-name">${product.name || 'منتج بدون اسم'}</h3>
                        </div>
                        ${product.description ? `<p class="product-description">${product.description.substring(0, 60)}...</p>` : ''}
                        <div class="product-meta">
                            <span class="product-category">${categoryName}</span>
                            <span class="${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                                ${product.stock > 0 ? `متوفر (${product.stock})` : 'نفذت الكمية'}
                            </span>
                        </div>
                        <div class="product-footer">
                            <div class="product-price">
                                <span class="current-price">${product.price || 0} ر.س</span>
                                ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ر.س</span>` : ''}
                            </div>
                            <div class="product-buttons">
                                <button class="btn primary-btn add-to-cart-main" 
                                        data-id="${product.id}" 
                                        data-name="${product.name}"
                                        data-price="${product.price}"
                                        data-image="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}"
                                        ${product.stock <= 0 ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus"></i>
                                    ${product.stock > 0 ? 'أضف للسلة' : 'نفذت الكمية'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // إضافة مستمعي الأحداث لأزرار المنتجات
        this.setupProductEventListeners();
    },

    // إعداد مستمعي الأحداث للموقع الرئيسي
    setupMainAppEventListeners() {
        console.log('إعداد مستمعي أحداث الموقع الرئيسي...');
        
        // حماية روابط الإدارة
        this.setupAdminProtection();
        
        // 1. القائمة المتنقلة
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
            closeNav.addEventListener('click', () => {
                const nav = document.getElementById('mobileNav');
                if (nav) {
                    nav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // 2. التنقل بين الأقسام (مع حماية الإدارة)
        document.querySelectorAll('[data-section]:not([data-section="admin"])').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                const sectionMap = {
                    'home': 'homeSection',
                    'products': 'productsSection',
                    'cart': 'cartSection',
                    'orders': 'ordersSection',
                    'profile': 'profileSection',
                    'contact': 'contactSection'
                };
                
                const targetSection = sectionMap[sectionId];
                if (targetSection) {
                    this.showSection(targetSection);
                    
                    // إغلاق القائمة المتنقلة إذا كانت مفتوحة
                    const mobileNav = document.getElementById('mobileNav');
                    if (mobileNav && mobileNav.classList.contains('active')) {
                        mobileNav.classList.remove('active');
                        document.body.style.overflow = 'auto';
                    }
                }
            });
        });

        // 3. بدء التسوق
        const startShoppingBtn = document.getElementById('startShoppingBtn');
        if (startShoppingBtn) {
            startShoppingBtn.addEventListener('click', () => {
                this.showSection('productsSection');
            });
        }

        // 4. سلة التسوق
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.showSection('cartSection');
            });
        }

        // 5. زر البحث
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            productSearch.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length > 2) {
                    this.filterProductsBySearch(query);
                } else if (query.length === 0) {
                    this.loadProductsSection();
                }
            });
        }

        // 6. أزرار الفلترة
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                
                // إزالة النشاط من جميع الأزرار
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // إضافة النشاط للزر المضغوط
                e.target.classList.add('active');
                
                this.filterProducts(filter);
            });
        });

        // 7. زر الفرز
        const productSort = document.getElementById('productSort');
        if (productSort) {
            productSort.addEventListener('change', (e) => {
                const sortType = e.target.value;
                this.sortProducts(sortType);
            });
        }

        // 8. نموذج الاتصال
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showMessage('شكراً لك', 'تم إرسال رسالتك بنجاح، سنرد عليك قريباً', 'success');
                contactForm.reset();
            });
        }

        // 9. زر الحساب الشخصي
        const userToggle = document.getElementById('userToggle');
        if (userToggle) {
            userToggle.addEventListener('click', () => {
                this.showSection('profileSection');
            });
        }

        // 10. زر الطلبات
        const ordersBtn = document.getElementById('ordersBtn');
        if (ordersBtn) {
            ordersBtn.addEventListener('click', () => {
                this.showSection('ordersSection');
            });
        }
        
        // 11. تحديث الملف الشخصي
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = getCurrentUser();
                if (user && !user.isGuest) {
                    const displayName = document.getElementById('editDisplayName').value;
                    const phone = document.getElementById('editPhone').value;
                    const address = document.getElementById('editAddress').value;
                    
                    const userData = {
                        displayName,
                        phone,
                        address
                    };
                    
                    const result = await updateUserData(user.uid, userData);
                    if (result.success) {
                        showToast('تم تحديث الملف الشخصي', false, 'success');
                        this.loadProfileSection();
                    } else {
                        showToast('خطأ في تحديث الملف الشخصي', true);
                    }
                } else {
                    showToast('الضيف لا يمكنه تحديث الملف الشخصي', true);
                }
            });
        }
        
        // 12. زر تغيير كلمة المرور
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                showMessage('قريباً', 'ميزة تغيير كلمة المرور ستكون متاحة قريباً', 'info');
            });
        }
    },

    // إعداد حماية روابط الإدارة
    setupAdminProtection() {
        // حماية زر الإدارة في الهيدر
        const adminHeaderBtn = document.getElementById('adminHeaderBtn');
        if (adminHeaderBtn) {
            adminHeaderBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const isAdmin = await verifyAdminStatus();
                
                if (isAdmin) {
                    await this.loadAdminSection();
                    this.showSection('adminSection');
                } else {
                    showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                }
            });
        }
        
        // حماية روابط الإدارة في الفوتر
        document.querySelectorAll('.footer-links a[data-section="admin"]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const isAdmin = await verifyAdminStatus();
                
                if (isAdmin) {
                    await this.loadAdminSection();
                    this.showSection('adminSection');
                } else {
                    showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
                }
            });
        });
    },

    // إعداد مستمعي أحداث المنتجات
    setupProductEventListeners() {
        // زر إضافة للسلة
        document.querySelectorAll('.add-to-cart-main').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (btn.disabled) return;
                
                const product = {
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    price: parseFloat(btn.dataset.price),
                    image: btn.dataset.image
                };
                
                // إضافة مباشرة للسلة
                addToCart(product, 1);
                this.updateCartCount();
                showToast(`تم إضافة "${product.name}" إلى السلة`, false, 'success');
            });
        });
    },

    // تصفية المنتجات
    async filterProducts(filter) {
        const products = filterProducts(filter);
        this.renderProducts(products);
    },

    // تصفية المنتجات بالبحث
    async filterProductsBySearch(query) {
        const products = searchProducts(query);
        this.renderProducts(products);
    },

    // ترتيب المنتجات
    async sortProducts(sortType) {
        const products = sortProducts(sortType);
        this.renderProducts(products);
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
                    <button class="btn primary-btn" onclick="UI.showSection('productsSection')">
                        <i class="fas fa-store"></i> تصفح المنتجات
                    </button>
                </div>
            `;
            
            if (cartSummary) cartSummary.innerHTML = '';
            return;
        }
        
        // عرض العناصر
        cartItemsContainer.innerHTML = cartItems.map((item, index) => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-product" data-label="المنتج">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        ${item.description ? `<p class="item-description">${item.description.substring(0, 50)}...</p>` : ''}
                    </div>
                </div>
                <div class="cart-item-price" data-label="السعر">${item.price} ر.س</div>
                <div class="cart-item-quantity" data-label="الكمية">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total" data-label="المجموع">${item.price * item.quantity} ر.س</div>
                <div class="cart-item-actions" data-label="إجراءات">
                    <button class="btn small-btn danger-btn remove-item-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // إضافة مستمعي الأحداث
        cartItemsContainer.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                updateCartQuantity(productId, -1);
                this.loadCartSection();
                this.updateCartCount();
            });
        });
        
        cartItemsContainer.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                updateCartQuantity(productId, 1);
                this.loadCartSection();
                this.updateCartCount();
            });
        });
        
        cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                const item = cartItems.find(item => item.id === productId);
                
                if (item) {
                    setupConfirmation(
                        'هل تريد إزالة هذا المنتج من السلة؟',
                        `سوف يتم إزالة "${item.name}" من سلة التسوق`,
                        () => {
                            removeFromCart(productId);
                            this.loadCartSection();
                            this.updateCartCount();
                        }
                    );
                }
            });
        });
        
        // تحديث الملخص
        const total = getCartTotal();
        const shipping = getShippingCost();
        const finalTotal = getFinalTotal();
        const itemCount = getCartItemCount();
        const freeShippingLimit = 200;
        
        if (cartSummary) {
            cartSummary.innerHTML = `
                <div class="summary-card">
                    <h3><i class="fas fa-receipt"></i> ملخص الطلب</h3>
                    <div class="summary-details">
                        <div class="summary-row">
                            <span>عدد المنتجات:</span>
                            <span>${itemCount} منتج</span>
                        </div>
                        <div class="summary-row">
                            <span>المجموع الجزئي:</span>
                            <span>${total.toFixed(2)} ر.س</span>
                        </div>
                        <div class="summary-row">
                            <span>التوصيل:</span>
                            <span>${shipping === 0 ? 'مجاني' : shipping.toFixed(2) + ' ر.س'}</span>
                        </div>
                        ${shipping === 0 ? 
                            `<div class="shipping-note">
                                <i class="fas fa-check-circle"></i> شحن مجاني للطلبات فوق ${freeShippingLimit} ر.س
                            </div>` : 
                            `<div class="shipping-note">
                                <i class="fas fa-info-circle"></i> أضف ${(freeShippingLimit - total).toFixed(2)} ر.س للحصول على شحن مجاني
                            </div>`
                        }
                        <div class="summary-row total">
                            <span>الإجمالي النهائي:</span>
                            <span class="total-amount">${finalTotal.toFixed(2)} ر.س</span>
                        </div>
                    </div>
                    <div class="summary-actions">
                        <button id="checkoutBtnMain" class="btn primary-btn w-100">
                            <i class="fas fa-lock"></i> اتمام الشراء
                        </button>
                        <button id="continueShopping" class="btn outline-btn w-100">
                            <i class="fas fa-arrow-right"></i> مواصلة التسوق
                        </button>
                        <button id="clearCartBtnMain" class="btn danger-btn w-100">
                            <i class="fas fa-trash"></i> تفريغ السلة
                        </button>
                    </div>
                </div>
            `;
            
            // إضافة مستمعي الأحداث للأزرار الجديدة
            const checkoutBtn = document.getElementById('checkoutBtnMain');
            const continueBtn = document.getElementById('continueShopping');
            const clearCartBtn = document.getElementById('clearCartBtnMain');
            
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', async () => {
                    const user = getCurrentUser();
                    if (user && !user.isGuest) {
                        showMessage('اكتمال الشراء', 'سيتم تحويلك لصفحة الدفع في التحديث القادم', 'info');
                    } else {
                        if (confirm('يجب تسجيل الدخول لإكمال الشراء. هل تريد التسجيل الآن؟')) {
                            UI.showAuthScreen();
                        }
                    }
                });
            }
            
            if (continueBtn) {
                continueBtn.addEventListener('click', () => {
                    this.showSection('productsSection');
                });
            }
            
            if (clearCartBtn) {
                clearCartBtn.addEventListener('click', () => {
                    setupConfirmation(
                        'هل أنت متأكد من تفريغ سلة التسوق؟',
                        'سوف يتم إزالة جميع المنتجات من سلة التسوق',
                        () => {
                            clearCart();
                            this.loadCartSection();
                            this.updateCartCount();
                            showToast('تم تفريغ سلة التسوق', false, 'success');
                        }
                    );
                });
            }
        }
    },

    // عرض طلبات المستخدم
    renderUserOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        // بيانات وهمية للعرض
        const orders = [
            {
                id: 'ORD-001',
                date: new Date('2024-03-15'),
                status: 'completed',
                items: [
                    { name: 'عطر فاخر للرجال', quantity: 1, price: 150 },
                    { name: 'مكياج سائل', quantity: 2, price: 85 }
                ],
                total: 320,
                shipping: 0
            }
        ];
        
        ordersList.innerHTML = orders.map(order => {
            const statusText = {
                'pending': 'قيد الانتظار',
                'processing': 'قيد التجهيز',
                'completed': 'مكتمل',
                'cancelled': 'ملغي'
            }[order.status] || order.status;
            
            const statusClass = {
                'pending': 'status-pending',
                'processing': 'status-processing',
                'completed': 'status-completed',
                'cancelled': 'status-cancelled'
            }[order.status] || '';
            
            const formattedDate = order.date.toLocaleDateString('ar-SA');
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <h4>${order.id}</h4>
                            <p class="order-date">${formattedDate}</p>
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <span>${item.name} × ${item.quantity}</span>
                                <span>${item.price * item.quantity} ر.س</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <span>المجموع:</span>
                            <span class="total-amount">${order.total + order.shipping} ر.س</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
                         class="product-thumb"
                         onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'">
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.description ? `<br><small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
                </td>
                <td>${product.price} ر.س</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="product-status ${product.isActive !== false ? 'status-active' : 'status-inactive'}">
                        ${product.isActive !== false ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>${formatDate(product.createdAt)}</td>
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
    }
};

// ==================== معالجات الأحداث العامة ====================

// معالجة تسجيل الدخول باستخدام Google
async function handleGoogleSignIn() {
    const result = await signInWithGoogle();
    if (result.success) {
        await UI.updateUserUIAfterLogin();
        UI.showMainApp();
        showToast('تم تسجيل الدخول بنجاح', false, 'success');
    } else {
        showMessage('خطأ', result.error || 'فشل تسجيل الدخول', 'error');
    }
}

// معالجة تسجيل الدخول كضيف
async function handleGuestSignIn() {
    const result = await signInAsGuest();
    if (result.success) {
        UI.updateUserUI(result.user, false);
        UI.showMainApp();
        showToast('مرحباً بك كضيف', false, 'success');
    } else {
        showMessage('خطأ', result.error || 'فشل تسجيل الدخول كضيف', 'error');
    }
}

// دالة showMessage محلية
function showMessage(title, message, type = 'info') {
    console.log(`${type}: ${title} - ${message}`);
    
    const messageModal = document.getElementById('messageModal');
    const messageIcon = document.getElementById('messageIcon');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    messageIcon.className = `fas ${icons[type] || icons.info}`;
    messageTitle.textContent = title;
    messageText.textContent = message;
    
    messageModal.classList.remove('hidden');
    
    document.getElementById('messageCloseBtn').onclick = () => {
        messageModal.classList.add('hidden');
    };
}

// ==================== إعداد النماذج ====================
function setupForms() {
    // نموذج تسجيل الدخول/إنشاء حساب
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
            
            if (result.success) {
                await UI.updateUserUIAfterLogin();
                UI.showMainApp();
                showToast(
                    displayNameInput.classList.contains('hidden') ? 
                    'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح',
                    false,
                    'success'
                );
            } else {
                showMessage('خطأ', result.error || 'فشل العملية', 'error');
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
                showMessage('تم الإرسال', 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
                document.getElementById('resetPasswordSection').classList.add('hidden');
                document.getElementById('emailAuthForm').classList.remove('hidden');
                resetPasswordForm.reset();
            } else {
                showMessage('خطأ', result.error || 'فشل إرسال رابط إعادة التعيين', 'error');
            }
        });
    }
}

// ==================== تهيئة التطبيق ====================
async function initApp() {
    console.log('🚀 بدء تشغيل المتجر...');
    
    try {
        // تهيئة Firebase أولاً
        const firebaseInit = initializeFirebase();
        if (!firebaseInit.success) {
            console.warn('Firebase لم يتم تهيئته، استخدام وضع غير متصل');
        }
        
        // تهيئة وحدات التطبيق الأساسية
        initProducts();
        initCart();
        initAdmin();
        
        // محاولة تحميل المستخدم من localStorage أولاً
        const savedUser = loadUserFromLocalStorage();
        
        if (savedUser.success && savedUser.user) {
            console.log('تم تحميل المستخدم من الذاكرة المحلية:', savedUser.user.displayName);
            
            // التحقق من صلاحيات المسؤول
            if (!savedUser.user.isGuest) {
                const isAdmin = await verifyAdminStatus();
                UI.updateUserUI(savedUser.user, isAdmin);
            } else {
                UI.updateUserUI(savedUser.user, false);
            }
            
            UI.showMainApp();
            
        } else {
            // إذا لم يكن هناك مستخدم محفوظ، عرض شاشة المصادقة
            console.log('لا يوجد مستخدم محفوظ، عرض شاشة المصادقة');
            UI.showAuthScreen();
        }
        
        // إعداد النماذج بعد تحميل DOM
        setupForms();
        
        // ربط أزرار مودال التأكيد
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', executePendingAction);
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', clearConfirmation);
        }
        
        // ربط أزرار إغلاق المودال
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
    } catch (error) {
        console.error('خطأ فادح في تهيئة التطبيق:', error);
        // عرض رسالة خطأ للمستخدم
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: 'Cairo', sans-serif;">
                <h1 style="color: #C89B3C;">⚠️ خطأ في التطبيق</h1>
                <p>حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
                <button onclick="location.reload()" style="background: #C89B3C; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    تحديث الصفحة
                </button>
            </div>
        `;
    }
}

// ==================== تفويض الأحداث للمستند ====================
document.addEventListener('click', function(e) {
    // 1. أزرار شاشة المصادقة
    if (e.target.closest('#googleSignInBtn')) {
        e.preventDefault();
        handleGoogleSignIn();
    }
    
    if (e.target.closest('#guestSignInBtn')) {
        e.preventDefault();
        handleGuestSignIn();
    }
    
    if (e.target.closest('#showEmailFormBtn')) {
        e.preventDefault();
        document.getElementById('authOptions').classList.add('hidden');
        document.getElementById('emailAuthSection').classList.remove('hidden');
        document.getElementById('resetPasswordSection').classList.add('hidden');
    }
    
    if (e.target.closest('#backToOptions')) {
        e.preventDefault();
        document.getElementById('emailAuthSection').classList.add('hidden');
        document.getElementById('authOptions').classList.remove('hidden');
        document.getElementById('resetPasswordSection').classList.add('hidden');
    }
    
    // 2. زر تبديل كلمة المرور
    if (e.target.closest('#togglePassword')) {
        e.preventDefault();
        const passwordInput = document.getElementById('passwordInput');
        const icon = e.target.closest('#togglePassword').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }
    
    // 3. زر العودة لتسجيل الدخول
    if (e.target.closest('#backToSignIn')) {
        e.preventDefault();
        document.getElementById('resetPasswordSection').classList.add('hidden');
        document.getElementById('emailAuthForm').classList.remove('hidden');
    }
    
    // 4. زر نسيت كلمة المرور
    if (e.target.closest('#forgotPasswordBtn')) {
        e.preventDefault();
        document.getElementById('emailAuthForm').classList.add('hidden');
        document.getElementById('resetPasswordSection').classList.remove('hidden');
    }
    
    // 5. زر تبديل تسجيل الدخول/إنشاء حساب
    if (e.target.closest('#toggleSignUpMode')) {
        e.preventDefault();
        const displayNameInput = document.getElementById('displayNameInput');
        const signInBtn = document.getElementById('signInWithEmailBtn');
        
        if (displayNameInput.classList.contains('hidden')) {
            // التبديل إلى وضع إنشاء حساب
            displayNameInput.classList.remove('hidden');
            signInBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب';
            e.target.closest('#toggleSignUpMode').innerHTML = '<i class="fas fa-sign-in-alt"></i> لدي حساب بالفعل';
        } else {
            // التبديل إلى وضع تسجيل الدخول
            displayNameInput.classList.add('hidden');
            signInBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            e.target.closest('#toggleSignUpMode').innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
        }
    }
    
    // 6. زر تسجيل الخروج مع تأكيد
    if (e.target.closest('#logoutBtn, #mobileLogoutBtn')) {
        e.preventDefault();
        const user = getCurrentUser();
        const message = user && user.isGuest ? 
            'هل تريد الخروج كضيف؟ سيتم مسح سلة التسوق' : 
            'هل تريد تسجيل الخروج؟';
        
        if (confirm(message)) {
            signOut().then(() => {
                localStorage.removeItem('jamalek_user');
                localStorage.removeItem('jamalek_cart');
                localStorage.removeItem('jamalek_wishlist');
                location.reload();
            });
        }
    }
    
    // 7. حماية روابط الإدارة في القائمة المتنقلة
    if (e.target.closest('#adminMobileBtn')) {
        e.preventDefault();
        
        // تحقق من صلاحيات المسؤول أولاً
        const adminMobileBtn = e.target.closest('#adminMobileBtn');
        if (adminMobileBtn.classList.contains('hidden')) {
            showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
            return;
        }
        
        const isAdmin = isUserAdmin();
        
        if (isAdmin) {
            UI.loadAdminSection().then(() => {
                UI.showSection('adminSection');
                
                // إغلاق القائمة المتنقلة
                const mobileNav = document.getElementById('mobileNav');
                if (mobileNav) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        } else {
            showMessage('غير مصرح', 'ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
        }
    }
});

// ==================== بدء التطبيق ====================
// الانتظار حتى تحميل DOM بالكامل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM محمل بالفعل
    initApp();
}