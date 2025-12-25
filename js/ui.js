// js/ui.js - معالجة واجهة المستخدم

export const UI = {
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
            } else {
                adminBadge.classList.add('hidden');
            }
        }
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
    }
};