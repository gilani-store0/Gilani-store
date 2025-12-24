// بيانات المتجر الأساسية - نسخة مطورة
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
    initializeStore();
    setupEventListeners();
    renderProducts();
    updateStoreUI();
    updateCurrentYear();
    setupCategoryCards();
});

// تهيئة المتجر من localStorage
function initializeStore() {
    const savedData = localStorage.getItem('beautyStoreData_v4');
    if (savedData) {
        try {
            storeData = JSON.parse(savedData);
            console.log('تم تحميل البيانات بنجاح من localStorage');
        } catch (e) {
            console.error('خطأ في تحميل البيانات:', e);
            loadDefaultProducts();
        }
    } else {
        console.log('لا توجد بيانات محفوظة، جاري تحميل البيانات الافتراضية...');
        loadDefaultProducts();
        saveStoreData();
    }
}

// تحميل منتجات افتراضية
function loadDefaultProducts() {
    storeData.products = [
        {
            id: Date.now() + 1,
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة يدوم طويلاً",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60",
            badge: "الأكثر طلباً",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: "أحمر شفاه مات فاخر",
            description: "أحمر شفاه مات طويل الأمد بملمس ناعم",
            price: 4500,
            category: "new",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=60",
            badge: "جديد",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            name: "عطر رجالي فاخر",
            description: "عطر رجالي بقاعدة خشبية تدوم طوال اليوم",
            price: 42000,
            category: "best",
            image: "https://images.unsplash.com/photo-1590736969956-6d9c2a8d6976?w=500&auto=format&fit=crop&q=60",
            badge: "الأكثر مبيعاً",
            createdAt: new Date(Date.now() - 86400000).toISOString() // يوم مضى
        },
        {
            id: Date.now() + 4,
            name: "كحل سائل عالي الجودة",
            description: "كحل سائل مقاوم للماء يدوم طويلاً",
            price: 3800,
            category: "sale",
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60",
            badge: "خصم 20%",
            createdAt: new Date(Date.now() - 172800000).toISOString() // يومين مضى
        }
    ];
}

// حفظ بيانات المتجر
function saveStoreData() {
    try {
        localStorage.setItem('beautyStoreData_v4', JSON.stringify(storeData));
        console.log('تم حفظ البيانات بنجاح');
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        showToast("خطأ في حفظ البيانات، قد يكون المتصفح بحاجة إلى إذن", "error");
        return false;
    }
}

// تحديث واجهة المتجر
function updateStoreUI() {
    const s = storeData.settings;
    
    // تحديث اسم المتجر
    document.querySelectorAll('.store-name-text').forEach(el => {
        if (el) el.textContent = s.storeName;
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) footerDesc.textContent = s.description;
    
    // تحديث رقم الهاتف
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) contactPhone.textContent = s.phone || "+249 123 456 789";
    
    // تحديث روابط الواتساب
    const waLink = `https://wa.me/${s.whatsapp}?text=مرحباً%20${encodeURIComponent(s.storeName)}%20،%20أود%20الاستفسار%20عن%20المنتجات`;
    
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
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt); // الأحدث أولاً
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات</h3>
                <p>${searchQuery ? 'لم يتم العثور على منتجات تطابق بحثك' : 'لم تتم إضافة منتجات بعد'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</span>
                <h3 class="product-name">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <p class="product-price">${formatPrice(product.price)}</p>
                <div class="product-actions">
                    <button class="buy-btn" onclick="orderViaWhatsapp(${product.id})">
                        <i class="fab fa-whatsapp"></i> اطلب الآن
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// تنسيق السعر
function formatPrice(price) {
    return new Intl.NumberFormat('ar-SD', {
        style: 'currency',
        currency: 'SDG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// الطلب عبر الواتساب
function orderViaWhatsapp(productId) {
    const product = storeData.products.find(item => item.id === productId);
    if (!product) {
        showToast("المنتج غير موجود", "error");
        return;
    }
    
    const message = `مرحباً ${storeData.settings.storeName}، أود طلب:
    
المنتج: ${product.name}
السعر: ${formatPrice(product.price)}
${product.description ? `الوصف: ${product.description}` : ''}

يرجى التواصل معي للتفاصيل.`;
    
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // القائمة الجانبية للجوال
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // البحث والفلترة
    const productSearch = document.getElementById('productSearch');
    const productSort = document.getElementById('productSort');
    
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }
    
    if (productSort) {
        productSort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }
    
    // أزرار الفلترة
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });
    
    // لوحة التحكم
    const adminToggle = document.getElementById('adminToggle');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            adminSidebar.classList.add('active');
            adminOverlay.classList.add('active');
        });
    }
    
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            handleLogout();
            adminSidebar.classList.remove('active');
            adminOverlay.classList.remove('active');
        });
    }
    
    if (adminOverlay) {
        adminOverlay.addEventListener('click', () => {
            handleLogout();
            adminSidebar.classList.remove('active');
            adminOverlay.classList.remove('active');
        });
    }
    
    // تسجيل الدخول والخروج
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // السماح بالدخول بالزر Enter في حقل الرمز
    const adminPinInput = document.getElementById('adminPinInput');
    if (adminPinInput) {
        adminPinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // تبويبات لوحة التحكم
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
            this.classList.add('active');
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');
        });
    });
    
    // نماذج لوحة التحكم
    const productForm = document.getElementById('productForm');
    const settingsForm = document.getElementById('settingsForm');
    
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
    
    // الروابط في القائمة الجانبية للجوال
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    });
}

// إعداد بطاقات الفئات
function setupCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // تحديث أزرار الفلترة
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            // تطبيق الفلترة
            currentFilter = category;
            renderProducts();
            
            // التمرير إلى قسم المنتجات
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
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
        return;
    }
    
    if (pin === storeData.settings.adminPin) {
        isAdminAuthenticated = true;
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('adminMainContent').classList.remove('hidden');
        loadAdminProducts();
        fillSettingsForm();
        showToast("تم تسجيل الدخول بنجاح", "success");
        pinInput.value = '';
    } else {
        showToast("رمز الحماية غير صحيح", "error");
        pinInput.value = '';
        pinInput.focus();
    }
}

// تسجيل الخروج من لوحة التحكم
function handleLogout() {
    isAdminAuthenticated = false;
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('adminMainContent').classList.add('hidden');
    
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) pinInput.value = '';
    
    // إعادة تعيين النماذج
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.reset();
    
    showToast("تم تسجيل الخروج بنجاح", "info");
}

// تحميل المنتجات في لوحة التحكم
function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    if (storeData.products.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-color);">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                <h3>لا توجد منتجات</h3>
                <p>قم بإضافة منتجك الأول</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = storeData.products.map(product => `
        <div class="admin-product-item">
            <div class="product-info-small">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <p>${formatPrice(product.price)}</p>
                    <small>${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</small>
                </div>
            </div>
            <div class="product-actions-small">
                <button class="delete-btn" onclick="deleteProduct(${product.id})" title="حذف المنتج">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
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
        showToast("تم حذف المنتج بنجاح", "success");
    } else {
        showToast("لم يتم العثور على المنتج", "error");
    }
};

// إضافة منتج جديد
function handleAddProduct(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('pName');
    const priceInput = document.getElementById('pPrice');
    const categoryInput = document.getElementById('pCategory');
    const imageInput = document.getElementById('pImage');
    const badgeInput = document.getElementById('pBadge');
    const descInput = document.getElementById('pDesc');
    
    // التحقق من البيانات
    if (!nameInput.value.trim()) {
        showToast("الرجاء إدخال اسم المنتج", "error");
        nameInput.focus();
        return;
    }
    
    if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
        showToast("الرجاء إدخال سعر صحيح", "error");
        priceInput.focus();
        return;
    }
    
    if (!imageInput.value.trim()) {
        showToast("الرجاء إدخال رابط الصورة", "error");
        imageInput.focus();
        return;
    }
    
    const newProduct = {
        id: Date.now(),
        name: nameInput.value.trim(),
        price: parseFloat(priceInput.value),
        category: categoryInput.value,
        image: imageInput.value.trim(),
        badge: badgeInput.value.trim() || null,
        description: descInput.value.trim() || null,
        createdAt: new Date().toISOString()
    };
    
    storeData.products.unshift(newProduct); // إضافة في البداية
    const saved = saveStoreData();
    
    if (saved) {
        renderProducts();
        loadAdminProducts();
        updateCategoryCounts();
        e.target.reset();
        showToast("تم إضافة المنتج بنجاح", "success");
        
        // التبديل إلى قائمة المنتجات
        document.querySelector('.admin-tab-btn[data-tab="products-list"]').click();
    }
}

// تعبئة نموذج الإعدادات
function fillSettingsForm() {
    const s = storeData.settings;
    
    document.getElementById('sName').value = s.storeName || '';
    document.getElementById('sWhatsapp').value = s.whatsapp || '';
    document.getElementById('sDescription').value = s.description || '';
    document.getElementById('sPhone').value = s.phone || '';
    document.getElementById('sPin').value = '';
}

// تحديث الإعدادات
function handleUpdateSettings(e) {
    e.preventDefault();
    
    const sName = document.getElementById('sName').value.trim();
    const sWhatsapp = document.getElementById('sWhatsapp').value.trim();
    const sDescription = document.getElementById('sDescription').value.trim();
    const sPhone = document.getElementById('sPhone').value.trim();
    const sPin = document.getElementById('sPin').value;
    
    // التحقق من البيانات الأساسية
    if (!sName) {
        showToast("الرجاء إدخال اسم المتجر", "error");
        return;
    }
    
    if (!sWhatsapp) {
        showToast("الرجاء إدخال رقم الواتساب", "error");
        return;
    }
    
    // تحديث الإعدادات
    storeData.settings.storeName = sName;
    storeData.settings.whatsapp = sWhatsapp.replace(/\D/g, ''); // إزالة أي محارف غير رقمية
    storeData.settings.description = sDescription;
    storeData.settings.phone = sPhone;
    
    // تحديث رمز الحماية إذا تم إدخاله
    if (sPin && sPin.length === 4) {
        storeData.settings.adminPin = sPin;
    }
    
    const saved = saveStoreData();
    
    if (saved) {
        updateStoreUI();
        showToast("تم تحديث الإعدادات بنجاح", "success");
        document.getElementById('sPin').value = '';
    }
}

// تحديث السنة الحالية
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// عرض الإشعارات
function showToast(msg, type = "info") {
    let background;
    
    switch(type) {
        case "success":
            background = "#06D6A0";
            break;
        case "error":
            background = "#ff4757";
            break;
        case "warning":
            background = "#FFD166";
            break;
        default:
            background = "#9D4EDD";
    }
    
    Toastify({
        text: msg,
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        },
        onClick: function() {}
    }).showToast();
}

// تحسينات إضافية
window.addEventListener('resize', function() {
    // إغلاق القائمة الجانبية على الشاشات الكبيرة
    if (window.innerWidth > 992) {
        const mobileSidebar = document.getElementById('mobileSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (mobileSidebar) mobileSidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
});

// دعم اللمس للأجهزة المحمولة
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// حفظ البيانات قبل إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    saveStoreData();
});

// تسهيل الوصول إلى لوحة التحكم للمطورين (لتسهيل الاختبار)
if (window.location.hash === '#admin') {
    setTimeout(() => {
        const adminToggle = document.getElementById('adminToggle');
        if (adminToggle) adminToggle.click();
    }, 500);
}