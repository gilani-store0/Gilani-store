// بيانات المتجر
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
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

// تهيئة المتجر
document.addEventListener('DOMContentLoaded', function() {
    loadStoreData();
    setupEventListeners();
    renderProducts();
    updateStoreUI();
    updateCurrentYear();
    setupCategoryCards();
});

// تحميل البيانات
function loadStoreData() {
    try {
        const savedData = localStorage.getItem('beautyStoreData');
        if (savedData) {
            storeData = JSON.parse(savedData);
            console.log('تم تحميل البيانات:', storeData.products.length, 'منتج');
        } else {
            loadDefaultProducts();
        }
    } catch (e) {
        console.error('خطأ في تحميل البيانات:', e);
        loadDefaultProducts();
    }
}

// منتجات افتراضية
function loadDefaultProducts() {
    storeData.products = [
        {
            id: 1,
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة يدوم طويلاً",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop",
            badge: "الأكثر طلباً",
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: "أحمر شفاه مات فاخر",
            description: "أحمر شفاه مات طويل الأمد بملمس ناعم",
            price: 4500,
            category: "new",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop",
            badge: "جديد",
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: "عطر رجالي فاخر",
            description: "عطر رجالي بقاعدة خشبية تدوم طوال اليوم",
            price: 42000,
            category: "best",
            image: "https://images.unsplash.com/photo-1590736969956-6d9c2a8d6976?w=500&auto=format&fit=crop",
            badge: "الأكثر مبيعاً",
            createdAt: new Date().toISOString()
        }
    ];
    saveStoreData();
}

// حفظ البيانات
function saveStoreData() {
    try {
        localStorage.setItem('beautyStoreData', JSON.stringify(storeData));
        console.log('تم حفظ البيانات');
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        return false;
    }
}

// تحديث الواجهة
function updateStoreUI() {
    // تحديث اسم المتجر
    document.querySelectorAll('.store-name-text').forEach(el => {
        el.textContent = storeData.settings.storeName;
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) {
        footerDesc.textContent = storeData.settings.description;
    }
    
    // تحديث رقم الهاتف
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        contactPhone.textContent = storeData.settings.phone;
    }
    
    // تحديث روابط الواتساب
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=مرحباً%20${encodeURIComponent(storeData.settings.storeName)}%20،%20أود%20الاستفسار%20عن%20المنتجات`;
    
    ['whatsappNavLink', 'mobileWhatsappLink', 'floatingWhatsapp', 'contactWhatsappLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = waLink;
    });
    
    // تحديث عدد المنتجات في الفئات
    updateCategoryCounts();
}

// تحديث عدد المنتجات في الفئات
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

    // فلترة المنتجات
    let filtered = storeData.products.filter(product => {
        const matchesFilter = currentFilter === 'all' || product.category === currentFilter;
        const matchesSearch = searchQuery ? 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
            true;
        return matchesFilter && matchesSearch;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // إذا لم توجد منتجات
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

    // عرض المنتجات
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
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
    return new Intl.NumberFormat('ar-SD').format(price) + ' ج.س';
}

// الطلب عبر الواتساب
function orderViaWhatsapp(productId) {
    const product = storeData.products.find(p => p.id == productId);
    if (!product) {
        showToast("المنتج غير موجود", "error");
        return;
    }
    
    const message = `مرحباً ${storeData.settings.storeName}، أود طلب المنتج التالي:

المنتج: ${product.name}
السعر: ${formatPrice(product.price)}
الفئة: ${storeData.categories.find(c => c.id === product.category)?.name || product.category}
${product.description ? `الوصف: ${product.description}` : ''}

يرجى التواصل معي للتفاصيل.`;
    
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // القائمة الجانبية للجوال
    setupMobileMenu();
    
    // البحث والفلترة
    setupSearchAndFilter();
    
    // لوحة التحكم
    setupAdminPanel();
    
    // الأحداث الأخرى
    setupOtherListeners();
}

// القائمة الجانبية للجوال
function setupMobileMenu() {
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
        closeSidebar.addEventListener('click', closeMobileMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

function closeMobileMenu() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

// البحث والفلترة
function setupSearchAndFilter() {
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
}

// لوحة التحكم
function setupAdminPanel() {
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
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }
    
    if (adminOverlay) {
        adminOverlay.addEventListener('click', closeAdminPanel);
    }
    
    // تسجيل الدخول
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // حقل الرمز السري
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
            
            if (this.dataset.tab === 'products-list') {
                loadAdminProducts();
            }
        });
    });
    
    // نموذج إضافة منتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }
    
    // نموذج الإعدادات
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
}

function closeAdminPanel() {
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.remove('active');
    if (adminOverlay) adminOverlay.classList.remove('active');
    
    // تسجيل الخروج
    handleLogout();
}

// تسجيل الدخول
function handleLogin() {
    const pinInput = document.getElementById('adminPinInput');
    if (!pinInput) return;
    
    const pin = pinInput.value;
    
    if (pin === storeData.settings.adminPin) {
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('adminMainContent').classList.remove('hidden');
        loadAdminProducts();
        fillSettingsForm();
        showToast("تم تسجيل الدخول بنجاح", "success");
        pinInput.value = '';
    } else {
        showToast("رمز الحماية غير صحيح", "error");
        pinInput.value = '';
    }
}

// تسجيل الخروج
function handleLogout() {
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('adminMainContent').classList.add('hidden');
    
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) pinInput.value = '';
}

// تحميل المنتجات في لوحة التحكم
function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    if (storeData.products.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
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
                <button class="delete-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// حذف منتج
window.deleteProduct = function(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        storeData.products = storeData.products.filter(p => p.id !== id);
        saveStoreData();
        loadAdminProducts();
        renderProducts();
        updateCategoryCounts();
        showToast("تم حذف المنتج", "success");
    }
};

// إضافة منتج جديد
function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const category = document.getElementById('pCategory').value;
    const image = document.getElementById('pImage').value.trim();
    const badge = document.getElementById('pBadge').value.trim();
    const description = document.getElementById('pDesc').value.trim();
    
    // التحقق من البيانات
    if (!name || !price || !image) {
        showToast("الرجاء ملء جميع الحقول المطلوبة", "error");
        return;
    }
    
    if (price <= 0) {
        showToast("الرجاء إدخال سعر صحيح", "error");
        return;
    }
    
    // إنشاء المنتج الجديد
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        image: image,
        badge: badge || null,
        description: description || null,
        createdAt: new Date().toISOString()
    };
    
    // إضافة المنتج
    storeData.products.unshift(newProduct);
    
    // حفظ البيانات
    if (saveStoreData()) {
        // إعادة تعيين النموذج
        e.target.reset();
        
        // تحديث الواجهات
        renderProducts();
        loadAdminProducts();
        updateCategoryCounts();
        
        // الانتقال إلى قائمة المنتجات
        const productsTab = document.querySelector('.admin-tab-btn[data-tab="products-list"]');
        if (productsTab) productsTab.click();
        
        showToast("تم إضافة المنتج بنجاح", "success");
    } else {
        showToast("حدث خطأ في حفظ المنتج", "error");
    }
}

// تعبئة نموذج الإعدادات
function fillSettingsForm() {
    document.getElementById('sName').value = storeData.settings.storeName;
    document.getElementById('sWhatsapp').value = storeData.settings.whatsapp;
    document.getElementById('sDescription').value = storeData.settings.description;
    document.getElementById('sPhone').value = storeData.settings.phone;
    document.getElementById('sPin').value = '';
}

// تحديث الإعدادات
function handleUpdateSettings(e) {
    e.preventDefault();
    
    storeData.settings.storeName = document.getElementById('sName').value.trim();
    storeData.settings.whatsapp = document.getElementById('sWhatsapp').value.trim();
    storeData.settings.description = document.getElementById('sDescription').value.trim();
    storeData.settings.phone = document.getElementById('sPhone').value.trim();
    
    const newPin = document.getElementById('sPin').value.trim();
    if (newPin.length === 4) {
        storeData.settings.adminPin = newPin;
    }
    
    if (saveStoreData()) {
        updateStoreUI();
        e.target.reset();
        fillSettingsForm();
        showToast("تم تحديث الإعدادات بنجاح", "success");
    } else {
        showToast("حدث خطأ في حفظ الإعدادات", "error");
    }
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

// الأحداث الأخرى
function setupOtherListeners() {
    // تحديث السنة
    updateCurrentYear();
    
    // إغلاق لوحات التحكم بمفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeAdminPanel();
        }
    });
}

// تحديث السنة الحالية
function updateCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// تصدير البيانات
window.exportData = function() {
    const data = JSON.stringify(storeData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `beauty-store-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showToast("تم تصدير البيانات", "success");
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
                
                // التحقق من صحة البيانات
                if (importedData.settings && Array.isArray(importedData.products)) {
                    if (confirm('هل تريد استبدال البيانات الحالية بالبيانات الجديدة؟')) {
                        storeData = importedData;
                        saveStoreData();
                        updateStoreUI();
                        renderProducts();
                        showToast("تم استيراد البيانات بنجاح", "success");
                    }
                } else {
                    showToast("ملف غير صالح", "error");
                }
            } catch (err) {
                showToast("خطأ في قراءة الملف", "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
};

// إعادة تعيين البيانات
window.resetData = function() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        localStorage.removeItem('beautyStoreData');
        location.reload();
    }
};

// عرض الإشعارات
function showToast(message, type = "info") {
    let backgroundColor = "#9D4EDD";
    
    switch(type) {
        case "success":
            backgroundColor = "#06D6A0";
            break;
        case "error":
            backgroundColor = "#ff4757";
            break;
        case "warning":
            backgroundColor = "#FFD166";
            break;
    }
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: backgroundColor,
        stopOnFocus: true
    }).showToast();
}
