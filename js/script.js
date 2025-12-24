[file name]: script.js
[file content begin]
// بيانات المتجر الأساسية - نسخة محسنة
let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249123456789",
        phone: "+249 123 456 789",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
        adminPin: "1234"
    },
    products: [],
    categories: [
        { id: "featured", name: "المميز", icon: "fa-star" },
        { id: "new", name: "الجديد", icon: "fa-bolt" },
        { id: "sale", name: "العروض", icon: "fa-percentage" },
        { id: "best", name: "الأكثر مبيعاً", icon: "fa-fire" }
    ]
};

// حالة التطبيق
let isAdminAuthenticated = false;
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('جاري تهيئة المتجر...');
    initializeStore();
    setupEventListeners();
    renderProducts();
    updateStoreUI();
    updateCurrentYear();
    setupCategoryCards();
    checkStorageStatus();
    registerServiceWorker();
});

// تسجيل Service Worker لـ PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            console.log('ServiceWorker registered');
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    }
}

// تهيئة المتجر مع نظام تخزين احتياطي
function initializeStore() {
    const STORAGE_KEY = 'beautyStoreData_v2'; // تغيير المفتاح لتجنب مشاكل التخزين القديم
    let dataLoaded = false;
    
    // المحاولة 1: localStorage العادي
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            storeData = JSON.parse(savedData);
            console.log('تم تحميل البيانات من localStorage:', storeData.products.length, 'منتج');
            dataLoaded = true;
        }
    } catch (e) {
        console.error('خطأ في تحميل البيانات من localStorage:', e);
    }
    
    // المحاولة 2: المحاولة بالمفتاح القديم
    if (!dataLoaded) {
        try {
            const oldData = localStorage.getItem('beautyStoreData');
            if (oldData) {
                storeData = JSON.parse(oldData);
                console.log('تم تحميل البيانات من الإصدار القديم');
                dataLoaded = true;
            }
        } catch (e) {
            console.error('خطأ في تحميل البيانات القديمة:', e);
        }
    }
    
    // المحاولة 3: تحميل البيانات الافتراضية
    if (!dataLoaded || !storeData.products || storeData.products.length === 0) {
        console.log('جاري تحميل البيانات الافتراضية...');
        loadDefaultProducts();
        saveStoreData();
        console.log('تم تحميل البيانات الافتراضية بنجاح');
    }
    
    // التحقق من سلامة البيانات
    validateData();
}

// تحميل منتجات افتراضية
function loadDefaultProducts() {
    // استخدام روابط صور من Unsplash تعمل بشكل أفضل
    storeData.products = [
        {
            id: Date.now() + 1,
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة يدوم طويلاً",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop",
            badge: "الأكثر طلباً",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: "أحمر شفاه مات فاخر",
            description: "أحمر شفاه مات طويل الأمد بملمس ناعم",
            price: 4500,
            category: "new",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop",
            badge: "جديد",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            name: "عطر رجالي فاخر",
            description: "عطر رجالي بقاعدة خشبية تدوم طوال اليوم",
            price: 42000,
            category: "best",
            image: "https://images.unsplash.com/photo-1590736969956-6d9c2a8d6976?w=500&auto=format&fit=crop",
            badge: "الأكثر مبيعاً",
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];
}

// التحقق من سلامة البيانات
function validateData() {
    if (!storeData.settings) {
        storeData.settings = {
            storeName: "جمالك",
            whatsapp: "249123456789",
            phone: "+249 123 456 789",
            description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
            adminPin: "1234"
        };
    }
    
    if (!Array.isArray(storeData.products)) {
        storeData.products = [];
    }
    
    if (!Array.isArray(storeData.categories)) {
        storeData.categories = [
            { id: "featured", name: "المميز", icon: "fa-star" },
            { id: "new", name: "الجديد", icon: "fa-bolt" },
            { id: "sale", name: "العروض", icon: "fa-percentage" },
            { id: "best", name: "الأكثر مبيعاً", icon: "fa-fire" }
        ];
    }
    
    // تنظيف المنتجات وتأكيد وجود صور صحيحة
    storeData.products = storeData.products.filter(product => {
        if (!product || !product.id || !product.name || !product.price) return false;
        
        // إضافة صورة افتراضية إذا لم تكن موجودة
        if (!product.image || product.image.trim() === '') {
            product.image = getDefaultProductImage();
        }
        
        // معالجة روابط الصور لضمان عملها
        product.image = fixImageUrl(product.image);
        
        return true;
    });
}

// معالجة روابط الصور
function fixImageUrl(url) {
    if (!url) return getDefaultProductImage();
    
    // إزالة المسافات
    url = url.trim();
    
    // إذا كان الرابط من Unsplash، تأكد من وجود المعلمات الصحيحة
    if (url.includes('unsplash.com') && !url.includes('?w=')) {
        url += '?w=500&auto=format&fit=crop';
    }
    
    // إذا كان الرابط من محرر الصور، تأكد من صحة الرابط
    if (url.includes('https://') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp'))) {
        return url;
    }
    
    // إذا لم يكن رابط صورة صالح، استخدم الصورة الافتراضية
    return getDefaultProductImage();
}

// الحصول على صورة افتراضية
function getDefaultProductImage() {
    const defaultImages = [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop'
    ];
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

// حفظ بيانات المتجر مع نظام احتياطي
function saveStoreData() {
    const STORAGE_KEY = 'beautyStoreData_v2';
    const BACKUP_KEY = 'beautyStore_backup_v2';
    let savedSuccessfully = false;
    
    try {
        // حفظ في localStorage
        const dataToSave = JSON.stringify(storeData);
        localStorage.setItem(STORAGE_KEY, dataToSave);
        console.log('تم حفظ البيانات، عدد المنتجات:', storeData.products.length);
        savedSuccessfully = true;
        
        // حفظ نسخة احتياطية
        localStorage.setItem(BACKUP_KEY, dataToSave);
        
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        
        // محاولة حفظ بيانات مخففة
        try {
            const simplifiedData = {
                settings: storeData.settings,
                products: storeData.products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    category: p.category,
                    image: p.image,
                    description: p.description || '',
                    badge: p.badge || '',
                    createdAt: p.createdAt
                })),
                categories: storeData.categories
            };
            localStorage.setItem(STORAGE_KEY + '_lite', JSON.stringify(simplifiedData));
            console.log('تم حفظ البيانات المبسطة');
            savedSuccessfully = true;
        } catch (e2) {
            console.error('خطأ في حفظ البيانات المبسطة:', e2);
        }
    }
    
    updateStorageStatus(savedSuccessfully);
    return savedSuccessfully;
}

// تحديث واجهة المتجر
function updateStoreUI() {
    const s = storeData.settings;
    
    // تحديث اسم المتجر في جميع الأماكن
    document.querySelectorAll('.store-name-text').forEach(el => {
        if (el) el.textContent = s.storeName || "جمالك";
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) {
        footerDesc.textContent = s.description || "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية";
    }
    
    // تحديث رقم الهاتف
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        contactPhone.textContent = s.phone || "+249 123 456 789";
    }
    
    // تحديث روابط الواتساب
    const waLink = `https://wa.me/${s.whatsapp || "249123456789"}?text=مرحباً%20${encodeURIComponent(s.storeName || "جمالك")}%20،%20أود%20الاستفسار%20عن%20المنتجات`;
    
    ['whatsappNavLink', 'mobileWhatsappLink', 'floatingWhatsapp', 'contactWhatsappLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = waLink;
    });
    
    // تحديث عدد المنتجات في كل فئة
    updateCategoryCounts();
}

// تحديث أعداد المنتجات في الفئات
function updateCategoryCounts() {
    storeData.categories.forEach(cat => {
        const count = storeData.products.filter(p => p.category === cat.id).length;
        const el = document.getElementById(`${cat.id}Count`);
        if (el) el.textContent = `${count} منتج`;
    });
}

// عرض المنتجات
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = storeData.products.filter(p => {
        const matchesFilter = currentFilter === 'all' || p.category === currentFilter;
        const matchesSearch = searchQuery ? 
            (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))) : 
            true;
        return matchesFilter && matchesSearch;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return (a.price || 0) - (b.price || 0);
        if (currentSort === 'price-high') return (b.price || 0) - (a.price || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>${searchQuery ? 'لا توجد نتائج' : 'لا توجد منتجات'}</h3>
                <p>${searchQuery ? 'لم يتم العثور على منتجات تطابق بحثك' : 'لم تتم إضافة منتجات بعد'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(product => {
        const imageUrl = product.image || getDefaultProductImage();
        return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${imageUrl}" 
                     alt="${product.name || 'منتج'}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${getDefaultProductImage()}';"
                     crossorigin="anonymous">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</span>
                <h3 class="product-name">${product.name || 'منتج بدون اسم'}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <p class="product-price">${formatPrice(product.price || 0)}</p>
                <div class="product-actions">
                    <button class="buy-btn" onclick="orderViaWhatsapp(${product.id})" data-product-id="${product.id}">
                        <i class="fab fa-whatsapp"></i> اطلب الآن
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// تنسيق السعر
function formatPrice(price) {
    if (isNaN(price)) price = 0;
    return new Intl.NumberFormat('ar-SD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price) + ' ج.س';
}

// الطلب عبر الواتساب
function orderViaWhatsapp(productId) {
    const product = storeData.products.find(item => item.id == productId);
    if (!product) {
        showToast("المنتج غير موجود", "error");
        return;
    }
    
    const message = `مرحباً ${storeData.settings.storeName || "جمالك"}، أود طلب المنتج التالي:

المنتج: ${product.name}
السعر: ${formatPrice(product.price)}
${product.category ? `الفئة: ${storeData.categories.find(c => c.id === product.category)?.name || product.category}` : ''}
${product.description ? `الوصف: ${product.description}` : ''}

يرجى التواصل معي للتفاصيل.`;
    
    const waLink = `https://wa.me/${storeData.settings.whatsapp || "249123456789"}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    setupMobileMenu();
    setupSearchAndFilter();
    setupAdminPanel();
    setupOtherListeners();
}

// إعداد القائمة الجانبية للجوال
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeMobileMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// إعداد البحث والفلترة
function setupSearchAndFilter() {
    const productSearch = document.getElementById('productSearch');
    const productSort = document.getElementById('productSort');
    
    if (productSearch) {
        let searchTimeout;
        productSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = e.target.value;
                renderProducts();
            }, 300);
        });
    }
    
    if (productSort) {
        productSort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });
}

// إعداد لوحة التحكم
function setupAdminPanel() {
    const adminToggle = document.getElementById('adminToggle');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (adminToggle) {
        adminToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            adminSidebar.classList.add('active');
            adminOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }
    
    if (adminOverlay) {
        adminOverlay.addEventListener('click', closeAdminPanel);
    }
    
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const adminPinInput = document.getElementById('adminPinInput');
    if (adminPinInput) {
        adminPinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
        
        adminPinInput.addEventListener('input', function() {
            if (this.value.length === 4) {
                setTimeout(() => handleLogin(), 100);
            }
        });
    }
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
            this.classList.add('active');
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');
        });
    });
    
    const productForm = document.getElementById('productForm');
    const settingsForm = document.getElementById('settingsForm');
    
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
}

function closeAdminPanel() {
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.remove('active');
    if (adminOverlay) adminOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// المستمعين الآخرين
function setupOtherListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdminPanel();
            closeMobileMenu();
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        const adminSidebar = document.getElementById('adminSidebar');
        const mobileSidebar = document.getElementById('mobileSidebar');
        
        if (adminSidebar?.classList.contains('active') || 
            mobileSidebar?.classList.contains('active')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        document.addEventListener('touchstart', function() {}, true);
    }
}

// إعداد بطاقات الفئات
function setupCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            currentFilter = category;
            renderProducts();
            
            const productsSection = document.getElementById('products');
            if (productsSection) {
                productsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// تسجيل الدخول إلى لوحة التحكم
function handleLogin() {
    const pinInput = document.getElementById('adminPinInput');
    if (!pinInput) return;
    
    const pin = pinInput.value;
    
    if (!pin) {
        showToast("الرجاء إدخال رمز الحماية", "error");
        pinInput.focus();
        return;
    }
    
    if (pin === (storeData.settings.adminPin || "1234")) {
        isAdminAuthenticated = true;
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('adminMainContent').classList.remove('hidden');
        loadAdminProducts();
        fillSettingsForm();
        showToast("تم تسجيل الدخول بنجاح ✅", "success");
        pinInput.value = '';
        
        if ('visualViewport' in window) {
            pinInput.blur();
        }
    } else {
        showToast("رمز الحماية غير صحيح ❌", "error");
        pinInput.value = '';
        pinInput.focus();
        
        pinInput.style.animation = 'none';
        setTimeout(() => {
            pinInput.style.animation = 'shake 0.5s';
        }, 10);
    }
}

// تسجيل الخروج من لوحة التحكم
function handleLogout() {
    isAdminAuthenticated = false;
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('adminMainContent').classList.add('hidden');
    
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) pinInput.value = '';
    
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.reset();
    
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) settingsForm.reset();
    
    showToast("تم تسجيل الخروج", "info");
}

// تحميل المنتجات في لوحة التحكم
function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    if (!storeData.products || storeData.products.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-color);">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                <h3>لا توجد منتجات</h3>
                <p>قم بإضافة منتجك الأول</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = storeData.products.map(product => {
        const imageUrl = product.image || getDefaultProductImage();
        return `
        <div class="admin-product-item" data-product-id="${product.id}">
            <div class="product-info-small">
                <img src="${imageUrl}" 
                     alt="${product.name}"
                     onerror="this.onerror=null; this.src='${getDefaultProductImage()}';"
                     crossorigin="anonymous">
                <div class="product-details">
                    <h4 class="text-truncate">${product.name || 'منتج بدون اسم'}</h4>
                    <p>${formatPrice(product.price || 0)}</p>
                    <small>${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</small>
                </div>
            </div>
            <div class="product-actions-small">
                <button class="delete-btn" onclick="deleteProduct(${product.id})" title="حذف المنتج">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

// حذف منتج
window.deleteProduct = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    const initialLength = storeData.products.length;
    storeData.products = storeData.products.filter(p => p.id !== id);
    
    if (storeData.products.length < initialLength) {
        saveStoreData();
        loadAdminProducts();
        renderProducts();
        updateCategoryCounts();
        showToast("تم حذف المنتج بنجاح ✅", "success");
    } else {
        showToast("لم يتم العثور على المنتج", "error");
    }
};

// إضافة منتج جديد - **هذا هو الجزء المهم الذي تم إصلاحه**
function handleAddProduct(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('pName');
    const priceInput = document.getElementById('pPrice');
    const categoryInput = document.getElementById('pCategory');
    const imageInput = document.getElementById('pImage');
    const badgeInput = document.getElementById('pBadge');
    const descInput = document.getElementById('pDesc');
    
    // التحقق من البيانات
    if (!nameInput || !nameInput.value.trim()) {
        showToast("الرجاء إدخال اسم المنتج", "error");
        nameInput?.focus();
        return;
    }
    
    const price = parseFloat(priceInput.value);
    if (!price || price <= 0) {
        showToast("الرجاء إدخال سعر صحيح", "error");
        priceInput?.focus();
        return;
    }
    
    let imageUrl = '';
    if (imageInput && imageInput.value.trim()) {
        imageUrl = fixImageUrl(imageInput.value.trim());
    } else {
        imageUrl = getDefaultProductImage();
    }
    
    const newProduct = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: nameInput.value.trim(),
        price: price,
        category: categoryInput.value,
        image: imageUrl, // استخدام الرابط المعالج
        badge: badgeInput.value.trim() || null,
        description: descInput.value.trim() || null,
        createdAt: new Date().toISOString()
    };
    
    if (!storeData.products) storeData.products = [];
    storeData.products.unshift(newProduct);
    
    const saved = saveStoreData();
    
    if (saved) {
        renderProducts();
        loadAdminProducts();
        updateCategoryCounts();
        e.target.reset();
        showToast("تم إضافة المنتج بنجاح ✅", "success");
        
        // التبديل إلى قائمة المنتجات
        const productsTab = document.querySelector('.admin-tab-btn[data-tab="products-list"]');
        if (productsTab) productsTab.click();
        
        if ('visualViewport' in window) {
            nameInput.blur();
        }
    } else {
        showToast("حدث خطأ في حفظ المنتج", "error");
    }
}

// تعبئة نموذج الإعدادات
function fillSettingsForm() {
    const s = storeData.settings;
    
    const sName = document.getElementById('sName');
    const sWhatsapp = document.getElementById('sWhatsapp');
    const sDescription = document.getElementById('sDescription');
    const sPhone = document.getElementById('sPhone');
    const sPin = document.getElementById('sPin');
    
    if (sName) sName.value = s.storeName || '';
    if (sWhatsapp) sWhatsapp.value = s.whatsapp || '';
    if (sDescription) sDescription.value = s.description || '';
    if (sPhone) sPhone.value = s.phone || '';
    if (sPin) sPin.value = '';
}

// تحديث الإعدادات
function handleUpdateSettings(e) {
    e.preventDefault();
    
    const sName = document.getElementById('sName');
    const sWhatsapp = document.getElementById('sWhatsapp');
    const sDescription = document.getElementById('sDescription');
    const sPhone = document.getElementById('sPhone');
    const sPin = document.getElementById('sPin');
    
    if (!sName || !sWhatsapp) return;
    
    const name = sName.value.trim();
    const whatsapp = sWhatsapp.value.trim();
    const description = sDescription?.value.trim() || '';
    const phone = sPhone?.value.trim() || '';
    const pin = sPin?.value || '';
    
    if (!name) {
        showToast("الرجاء إدخال اسم المتجر", "error");
        sName.focus();
        return;
    }
    
    if (!whatsapp) {
        showToast("الرجاء إدخال رقم الواتساب", "error");
        sWhatsapp.focus();
        return;
    }
    
    storeData.settings.storeName = name;
    storeData.settings.whatsapp = whatsapp.replace(/\D/g, '');
    storeData.settings.description = description;
    storeData.settings.phone = phone;
    
    if (pin && pin.length === 4) {
        storeData.settings.adminPin = pin;
        if (sPin) sPin.value = '';
    }
    
    const saved = saveStoreData();
    
    if (saved) {
        updateStoreUI();
        showToast("تم تحديث الإعدادات بنجاح ✅", "success");
        
        if ('visualViewport' in window) {
            sName.blur();
        }
    } else {
        showToast("حدث خطأ في حفظ الإعدادات", "error");
    }
}

// تحديث السنة الحالية
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// تصدير البيانات
window.exportData = function() {
    const dataStr = JSON.stringify(storeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `beautyStore_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast("تم تصدير البيانات بنجاح ✅", "success");
};

// استيراد البيانات
window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.settings && Array.isArray(importedData.products)) {
                    storeData = importedData;
                    validateData(); // معالجة البيانات المستوردة
                    saveStoreData();
                    updateStoreUI();
                    renderProducts();
                    loadAdminProducts();
                    showToast("تم استيراد البيانات بنجاح ✅", "success");
                } else {
                    showToast("ملف البيانات غير صالح", "error");
                }
            } catch (err) {
                showToast("خطأ في قراءة الملف", "error");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

// إعادة تعيين البيانات
window.resetData = function() {
    if (!confirm('⚠️ تحذير: هذا الإجراء سيمحو جميع البيانات الحالية بما فيها المنتجات والإعدادات. هل أنت متأكد؟')) {
        return;
    }
    
    if (!confirm('❌ هل أنت متأكد تماماً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    storeData = {
        settings: {
            storeName: "جمالك",
            whatsapp: "249123456789",
            phone: "+249 123 456 789",
            description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
            adminPin: "1234"
        },
        products: [],
        categories: [
            { id: "featured", name: "المميز", icon: "fa-star" },
            { id: "new", name: "الجديد", icon: "fa-bolt" },
            { id: "sale", name: "العروض", icon: "fa-percentage" },
            { id: "best", name: "الأكثر مبيعاً", icon: "fa-fire" }
        ]
    };
    
    loadDefaultProducts();
    saveStoreData();
    updateStoreUI();
    renderProducts();
    loadAdminProducts();
    
    showToast("تم إعادة التعيين بنجاح ✅", "success");
};

// التحقق من حالة التخزين
function checkStorageStatus() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// تحديث حالة التخزين في الواجهة
function updateStorageStatus(success) {
    const statusElement = document.getElementById('storageStatus');
    if (!statusElement) return;
    
    if (success) {
        const used = JSON.stringify(storeData).length;
        const kb = Math.round(used / 1024);
        statusElement.innerHTML = `
            <i class="fas fa-check-circle" style="color: #06D6A0;"></i>
            <span>التخزين يعمل بشكل جيد</span>
            <small style="display: block; margin-top: 5px; color: #666;">الحجم: ${kb} كيلوبايت</small>
        `;
    } else {
        statusElement.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #FFD166;"></i>
            <span>وضع التخزين المحدود</span>
            <small style="display: block; margin-top: 5px; color: #666;">قد لا يتم حفظ التغييرات</small>
        `;
    }
}

// عرض الإشعارات
function showToast(msg, type = "info") {
    let background, icon;
    
    switch(type) {
        case "success":
            background = "#06D6A0";
            icon = "✓";
            break;
        case "error":
            background = "#ff4757";
            icon = "✗";
            break;
        case "warning":
            background = "#FFD166";
            icon = "⚠";
            break;
        default:
            background = "#9D4EDD";
            icon = "ℹ";
    }
    
    Toastify({
        text: `${icon} ${msg}`,
        duration: 3000,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
            background: background,
            borderRadius: "10px",
            padding: "15px 25px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontFamily: "'Cairo', sans-serif"
        },
        onClick: function() {}
    }).showToast();
}

// إضافة تأثير الاهتزاز
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// تحسينات للأجهزة المحمولة
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    document.querySelectorAll('button, .btn, .category-card, .product-card').forEach(el => {
        el.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        el.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

// التحكم في المسافة الآمنة للأجهزة الحديثة
function updateSafeArea() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', updateSafeArea);
window.addEventListener('orientationchange', updateSafeArea);
updateSafeArea();

// حفظ البيانات قبل إغلاق الصفحة
window.addEventListener('beforeunload', function(e) {
    saveStoreData();
});

// محاولة حفظ البيانات كل 30 ثانية
setInterval(() => {
    saveStoreData();
}, 30000);

// تسهيل الوصول للاختبار
if (window.location.hash === '#debug') {
    console.log('وضع التصحيح مفعّل');
    window.storeData = storeData;
    window.saveStoreData = saveStoreData;
}
[file content end]