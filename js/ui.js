// js/ui.js - معالجة واجهة المستخدم

export const UI = {
    // إظهار شاشة المصادقة
    showAuthScreen() {
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.body.style.overflow = 'hidden';
    },

    // إظهار التطبيق الرئيسي
    showMainApp() {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.body.style.overflow = 'auto';
        
        // تحميل السنة الحالية
        document.getElementById('currentYear').textContent = new Date().getFullYear();
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
    },

    // العودة للخيارات
    backToOptions() {
        document.getElementById('emailAuthSection').classList.add('hidden');
        document.getElementById('authOptions').classList.remove('hidden');
    },

    // عرض المنتجات
    renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        if (!products || products.length === 0) {
            grid.innerHTML = '<p class="no-products">لا توجد منتجات حالياً.</p>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                     alt="${product.name || 'منتج'}" 
                     class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name || 'منتج بدون اسم'}</h3>
                    <div class="product-price">
                        <span class="current-price">${product.price || 0} ر.س</span>
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