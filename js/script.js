// بيانات المتجر الأساسية
let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249123456789",
        instagram: "https://instagram.com/",
        facebook: "https://facebook.com/",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
        adminPin: "1234"
    },
    products: [],
    categories: [
        { id: "featured", name: "المميز" },
        { id: "new", name: "الجديد" },
        { id: "sale", name: "العروض" },
        { id: "best", name: "الأكثر مبيعاً" }
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
});

function initializeStore() {
    const savedData = localStorage.getItem('beautyStoreData_v3');
    if (savedData) {
        try {
            storeData = JSON.parse(savedData);
        } catch (e) {
            console.error('Error loading data:', e);
            loadDefaultProducts();
        }
    } else {
        loadDefaultProducts();
        saveStoreData();
    }
}

function loadDefaultProducts() {
    storeData.products = [
        {
            id: Date.now() + 1,
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500",
            badge: "الأكثر طلباً",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: "أحمر شفاه مات",
            description: "أحمر شفاه مات طويل الأمد",
            price: 4500,
            category: "new",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500",
            badge: "جديد",
            createdAt: new Date().toISOString()
        }
    ];
}

function saveStoreData() {
    localStorage.setItem('beautyStoreData_v3', JSON.stringify(storeData));
}

function updateStoreUI() {
    const s = storeData.settings;
    document.querySelectorAll('.store-name-text').forEach(el => el.textContent = s.storeName);
    if(document.getElementById('footerStoreDescription')) document.getElementById('footerStoreDescription').textContent = s.description;
    
    const waLink = `https://wa.me/${s.whatsapp}`;
    ['whatsappNavLink', 'mobileWhatsappLink', 'floatingWhatsapp'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.href = waLink;
    });

    storeData.categories.forEach(cat => {
        const count = storeData.products.filter(p => p.category === cat.id).length;
        const el = document.getElementById(`${cat.id}Count`);
        if(el) el.textContent = `${count} منتج`;
    });
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = storeData.products.filter(p => {
        const matchesFilter = currentFilter === 'all' || p.category === currentFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><h3>لا توجد منتجات</h3></div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}">
                ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${storeData.categories.find(c => c.id === p.category)?.name || 'عام'}</span>
                <h3 class="product-name">${p.name}</h3>
                <p class="product-price">${formatPrice(p.price)}</p>
                <button class="buy-btn" onclick="orderViaWhatsapp(${p.id})"><i class="fab fa-whatsapp"></i> اطلب الآن</button>
            </div>
        </div>
    `).join('');
}

function formatPrice(price) {
    return new Intl.NumberFormat('ar-SD').format(price) + ' ج.س';
}

function orderViaWhatsapp(productId) {
    const p = storeData.products.find(item => item.id === productId);
    if (!p) return;
    const message = `مرحباً ${storeData.settings.storeName}، أود طلب: ${p.name} بسعر ${formatPrice(p.price)}`;
    window.open(`https://wa.me/${storeData.settings.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
}

function setupEventListeners() {
    // القائمة الجانبية
    document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('mobileSidebar').classList.add('active'));
    document.getElementById('closeSidebar')?.addEventListener('click', () => document.getElementById('mobileSidebar').classList.remove('active'));

    // البحث والفلترة
    document.getElementById('productSearch')?.addEventListener('input', (e) => { searchQuery = e.target.value; renderProducts(); });
    document.getElementById('productSort')?.addEventListener('change', (e) => { currentSort = e.target.value; renderProducts(); });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });

    // لوحة التحكم
    document.getElementById('adminToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.add('active');
    });

    document.getElementById('closeAdminBtn')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.remove('active');
    });

    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

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
    document.getElementById('productForm')?.addEventListener('submit', handleAddProduct);
    document.getElementById('settingsForm')?.addEventListener('submit', handleUpdateSettings);
}

function handleLogin() {
    const pin = document.getElementById('adminPinInput').value;
    if (pin === storeData.settings.adminPin) {
        isAdminAuthenticated = true;
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('adminMainContent').classList.remove('hidden');
        loadAdminProducts();
        fillSettingsForm();
        showToast("تم تسجيل الدخول بنجاح", "success");
    } else {
        showToast("رمز الحماية غير صحيح", "error");
    }
}

function handleLogout() {
    isAdminAuthenticated = false;
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('adminMainContent').classList.add('hidden');
    document.getElementById('adminPinInput').value = '';
}

function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    list.innerHTML = storeData.products.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: #f9f9f9; margin-bottom: 10px; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.image}" style="width: 40px; height: 40px; border-radius: 5px; object-fit: cover;">
                <div>
                    <div style="font-weight: bold;">${p.name}</div>
                    <div style="font-size: 0.8rem; color: #666;">${formatPrice(p.price)}</div>
                </div>
            </div>
            <button onclick="deleteProduct(${p.id})" style="color: #ff4757; border: none; background: none; cursor: pointer; font-size: 1.2rem;"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

window.deleteProduct = function(id) {
    if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        storeData.products = storeData.products.filter(p => p.id !== id);
        saveStoreData();
        loadAdminProducts();
        renderProducts();
        updateStoreUI();
        showToast("تم حذف المنتج بنجاح");
    }
};

function handleAddProduct(e) {
    e.preventDefault();
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('pName').value,
        price: parseFloat(document.getElementById('pPrice').value),
        category: document.getElementById('pCategory').value,
        image: document.getElementById('pImage').value,
        description: document.getElementById('pDesc').value,
        createdAt: new Date().toISOString()
    };
    storeData.products.push(newProduct);
    saveStoreData();
    renderProducts();
    loadAdminProducts();
    updateStoreUI();
    e.target.reset();
    showToast("تم إضافة المنتج بنجاح", "success");
}

function fillSettingsForm() {
    document.getElementById('sName').value = storeData.settings.storeName;
    document.getElementById('sWhatsapp').value = storeData.settings.whatsapp;
}

function handleUpdateSettings(e) {
    e.preventDefault();
    storeData.settings.storeName = document.getElementById('sName').value;
    storeData.settings.whatsapp = document.getElementById('sWhatsapp').value;
    const newPin = document.getElementById('sPin').value;
    if(newPin) storeData.settings.adminPin = newPin;
    
    saveStoreData();
    updateStoreUI();
    showToast("تم تحديث الإعدادات بنجاح", "success");
}

function updateCurrentYear() {
    if(document.getElementById('currentYear')) document.getElementById('currentYear').textContent = new Date().getFullYear();
}

function showToast(msg, type = "info") {
    Toastify({
        text: msg,
        duration: 3000,
        gravity: "top",
        position: "center",
        style: {
            background: type === "success" ? "#06D6A0" : (type === "error" ? "#ff4757" : "#9D4EDD"),
            borderRadius: "10px"
        }
    }).showToast();
}
