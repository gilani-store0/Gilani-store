// بيانات المتجر
let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249123456789",
        instagram: "https://instagram.com/",
        facebook: "https://facebook.com/",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
    },
    products: [],
    categories: [
        { id: "featured", name: "المميز", count: 0 },
        { id: "new", name: "الجديد", count: 0 },
        { id: "sale", name: "العروض", count: 0 },
        { id: "best", name: "الأكثر مبيعاً", count: 0 }
    ]
};

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeStore();
    setupEventListeners();
    loadProducts();
    updateStoreInfo();
    updateCurrentYear();
});

// تهيئة المتجر
function initializeStore() {
    const savedData = localStorage.getItem('beautyStoreData');
    if (savedData) {
        try {
            storeData = JSON.parse(savedData);
        } catch (e) {
            console.error('خطأ في تحميل البيانات:', e);
            addDefaultProducts();
        }
    } else {
        addDefaultProducts();
        saveStoreData();
    }
    
    updateCategoryCounts();
}

// إضافة منتجات افتراضية
function addDefaultProducts() {
    storeData.products = [
        {
            id: "1",
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة مع لمسات الفواكه",
            price: 350000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop",
            stock: 15,
            badge: "الأكثر طلباً",
            createdAt: new Date().toISOString(),
            orderCount: 25
        },
        {
            id: "2",
            name: "أحمر شفاه مات طويل الأمد",
            description: "أحمر شفاه مات بتشكيلة ألوان متنوعة يدوم طوال اليوم",
            price: 45000,
            category: "new",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop",
            stock: 8,
            badge: "جديد",
            createdAt: new Date().toISOString(),
            orderCount: 12
        },
        {
            id: "3",
            name: "مرطب البشرة اليومي مع SPF",
            description: "مرطب خفيف للبشرة مع حماية من الشمس SPF 30 للاستخدام اليومي",
            price: 75000,
            category: "sale",
            image: "https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=500&auto=format&fit=crop",
            stock: 20,
            badge: "عرض خاص",
            createdAt: new Date().toISOString(),
            orderCount: 18
        },
        {
            id: "4",
            name: "سيروم العناية بالشعر",
            description: "سيروم لعلاج الشعر التالف وتغذيته من الجذور حتى الأطراف",
            price: 55000,
            category: "best",
            image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&auto=format&fit=crop",
            stock: 12,
            badge: "الأكثر مبيعاً",
            createdAt: new Date().toISOString(),
            orderCount: 32
        }
    ];
}

// حفظ البيانات
function saveStoreData() {
    localStorage.setItem('beautyStoreData', JSON.stringify(storeData));
    updateCategoryCounts();
}

// تحديث تعداد الأقسام
function updateCategoryCounts() {
    storeData.categories.forEach(category => {
        category.count = storeData.products.filter(product => product.category === category.id).length;
    });
}

// تحديث معلومات المتجر في الواجهة
function updateStoreInfo() {
    const settings = storeData.settings;
    
    // تحديث اسم المتجر
    document.getElementById('footerStoreName').textContent = settings.storeName;
    document.getElementById('copyrightStoreName').textContent = settings.storeName;
    
    // تحديث الوصف
    document.getElementById('footerStoreDescription').textContent = settings.description;
    
    // تحديث روابط التواصل
    document.getElementById('whatsappContactLink').href = `https://wa.me/${settings.whatsapp}`;
    document.getElementById('instagramContactLink').href = settings.instagram;
    document.getElementById('facebookContactLink').href = settings.facebook;
    
    // تحديث روابط الفوتر
    document.getElementById('footerWhatsapp').href = `https://wa.me/${settings.whatsapp}`;
    document.getElementById('footerInstagram').href = settings.instagram;
    document.getElementById('footerFacebook').href = settings.facebook;
    
    // تحديث زر الواتساب العائم
    document.getElementById('floatingWhatsapp').href = `https://wa.me/${settings.whatsapp}`;
    
    // تحديث زر واتساب التنقل
    const whatsappNavBtn = document.querySelector('.whatsapp-nav-btn');
    if (whatsappNavBtn) {
        whatsappNavBtn.href = `https://wa.me/${settings.whatsapp}`;
    }
}

// تحديث السنة الحالية
function updateCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// تنسيق السعر بالجنيه السوداني
function formatPrice(price) {
    return price.toLocaleString('ar-SD') + ' ج.س';
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // القائمة الجانبية للجوال
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileSidebar = document.getElementById('mobileSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
        });
    }
    
    // الشريط الجانبي للوحة التحكم
    const adminToggle = document.getElementById('adminToggle');
    const closeAdminSidebar = document.getElementById('closeAdminSidebar');
    const adminSidebar = document.getElementById('adminSidebar');
    
    const openAdminSidebar = () => {
        adminSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadAdminSidebarData();
    };
    
    const closeAdminSidebarFunc = () => {
        adminSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    };
    
    if (adminToggle) adminToggle.addEventListener('click', openAdminSidebar);
    if (closeAdminSidebar) closeAdminSidebar.addEventListener('click', closeAdminSidebarFunc);
    
    // أزرار فتح لوحة التحكم
    const openControlPanelLinks = document.querySelectorAll('.open-control-panel');
    openControlPanelLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminSidebar();
        });
    });
    
    // إغلاق القوائم عند النقر على رابط
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
        });
    });
    
    // التنقل السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                updateActiveNav(this);
            }
        });
    });
    
    // نموذج المنتج في الشريط الجانبي
    setupProductForm();
    
    // نموذج الإعدادات في الشريط الجانبي
    setupSettingsForm();
    
    // التصفية والترتيب
    setupFiltersAndSorting();
    
    // التصنيفات
    setupCategoryCards();
    
    // البحث في المنتجات
    setupProductSearch();
    
    // أزرار الكمية
    setupQuantityControls();
    
    // التبديل بين أقسام لوحة التحكم
    setupAdminTabs();
}

// إعداد أزرار التبويب في لوحة التحكم
function setupAdminTabs() {
    const showProductsBtn = document.getElementById('showProductsBtn');
    const showSettingsBtn = document.getElementById('showSettingsBtn');
    
    if (showProductsBtn) {
        showProductsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('productsListSection').classList.remove('hidden');
            document.getElementById('productFormSection').classList.add('hidden');
            document.getElementById('settingsSection').classList.add('hidden');
        });
    }
    
    if (showSettingsBtn) {
        showSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('productsListSection').classList.add('hidden');
            document.getElementById('productFormSection').classList.add('hidden');
            document.getElementById('settingsSection').classList.remove('hidden');
        });
    }
}

// تحميل بيانات الشريط الجانبي
function loadAdminSidebarData() {
    updateAdminProductsList();
    
    // تحميل بيانات الإعدادات
    const settings = storeData.settings;
    if (document.getElementById('sidebarStoreName')) {
        document.getElementById('sidebarStoreName').value = settings.storeName;
    }
    if (document.getElementById('sidebarWhatsapp')) {
        document.getElementById('sidebarWhatsapp').value = settings.whatsapp;
    }
    if (document.getElementById('sidebarInstagram')) {
        document.getElementById('sidebarInstagram').value = settings.instagram;
    }
    if (document.getElementById('sidebarFacebook')) {
        document.getElementById('sidebarFacebook').value = settings.facebook;
    }
    if (document.getElementById('sidebarDescription')) {
        document.getElementById('sidebarDescription').value = settings.description;
    }
}

// إعداد نموذج المنتج
function setupProductForm() {
    const form = document.getElementById('sidebarProductForm');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    
    if (!form) return;
    
    // إظهار النموذج
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إعادة تعيين النموذج
            form.reset();
            document.getElementById('editProductId').value = '';
            document.getElementById('sidebarProductStock').value = '10';
            document.getElementById('sidebarProductPrice').value = '';
            
            // إظهار النموذج
            document.getElementById('productsListSection').classList.add('hidden');
            document.getElementById('productFormSection').classList.remove('hidden');
            document.getElementById('settingsSection').classList.add('hidden');
            
            // التمرير إلى أعلى النموذج
            document.getElementById('productFormSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        });
    }
    
    // إخفاء النموذج
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('productsListSection').classList.remove('hidden');
            document.getElementById('productFormSection').classList.add('hidden');
            document.getElementById('settingsSection').classList.add('hidden');
        });
    }
    
    // معالجة إرسال النموذج
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('editProductId').value;
        const productData = {
            id: productId || 'product_' + Date.now(),
            name: document.getElementById('sidebarProductName').value.trim(),
            description: document.getElementById('sidebarProductDescription').value.trim() || 'لا يوجد وصف',
            price: parseInt(document.getElementById('sidebarProductPrice').value) || 0,
            category: document.getElementById('sidebarProductCategory').value,
            image: document.getElementById('sidebarProductImage').value.trim() || 
                   'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
            stock: parseInt(document.getElementById('sidebarProductStock').value) || 1,
            badge: document.getElementById('sidebarProductBadge').value,
            createdAt: productId ? 
                storeData.products.find(p => p.id === productId)?.createdAt || new Date().toISOString() : 
                new Date().toISOString(),
            orderCount: productId ? 
                storeData.products.find(p => p.id === productId)?.orderCount || 0 : 0
        };
        
        // التحقق من الحقول المطلوبة
        if (!productData.name || productData.price <= 0 || !productData.category) {
            showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
            return;
        }
        
        if (productId) {
            // تعديل المنتج
            const index = storeData.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                storeData.products[index] = productData;
                showNotification('تم تحديث المنتج بنجاح ✓', 'success');
            }
        } else {
            // إضافة منتج جديد
            storeData.products.push(productData);
            showNotification('تم إضافة المنتج بنجاح ✓', 'success');
        }
        
        saveStoreData();
        loadProducts();
        updateAdminProductsList();
        
        // إعادة تعيين وإخفاء النموذج
        form.reset();
        document.getElementById('productsListSection').classList.remove('hidden');
        document.getElementById('productFormSection').classList.add('hidden');
        document.getElementById('settingsSection').classList.add('hidden');
    });
}

// تحديث قائمة المنتجات في الشريط الجانبي
function updateAdminProductsList() {
    const container = document.getElementById('adminProductsList');
    const emptyList = document.getElementById('emptyAdminList');
    
    if (!container) return;
    
    if (storeData.products.length === 0) {
        emptyList.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    emptyList.classList.add('hidden');
    
    container.innerHTML = storeData.products.map(product => {
        const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
        const stockClass = product.stock > 10 ? 'stock-in' : product.stock > 0 ? 'stock-low' : 'stock-out';
        const stockText = product.stock > 10 ? 'متوفر' : product.stock > 0 ? 'مخزون قليل' : 'نفذ';
        
        return `
            <div class="product-item" data-id="${product.id}">
                <div class="product-item-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'">
                </div>
                <div class="product-item-info">
                    <h4>${product.name}</h4>
                    <p>${categoryName} - ${formatPrice(product.price)}</p>
                    <small>المخزون: ${product.stock} <span class="stock-badge ${stockClass}">${stockText}</span></small>
                </div>
                <div class="product-item-actions">
                    <button class="btn small-btn primary-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn small-btn secondary-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// تعديل منتج
function editProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    // تعبئة الحقول
    document.getElementById('editProductId').value = product.id;
    document.getElementById('sidebarProductName').value = product.name;
    document.getElementById('sidebarProductDescription').value = product.description;
    document.getElementById('sidebarProductPrice').value = product.price;
    document.getElementById('sidebarProductCategory').value = product.category;
    document.getElementById('sidebarProductStock').value = product.stock;
    document.getElementById('sidebarProductImage').value = product.image;
    document.getElementById('sidebarProductBadge').value = product.badge || '';
    
    // إظهار النموذج
    document.getElementById('productsListSection').classList.add('hidden');
    document.getElementById('productFormSection').classList.remove('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    
    // التمرير للنموذج
    document.getElementById('productFormSection').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// حذف منتج
function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    storeData.products = storeData.products.filter(p => p.id !== productId);
    saveStoreData();
    loadProducts();
    updateAdminProductsList();
    showNotification('تم حذف المنتج بنجاح', 'success');
}

// إعداد نموذج الإعدادات
function setupSettingsForm() {
    const form = document.getElementById('sidebarSettingsForm');
    if (!form) return;
    
    // تحميل البيانات
    const settings = storeData.settings;
    if (document.getElementById('sidebarStoreName')) {
        document.getElementById('sidebarStoreName').value = settings.storeName;
    }
    if (document.getElementById('sidebarWhatsapp')) {
        document.getElementById('sidebarWhatsapp').value = settings.whatsapp;
    }
    if (document.getElementById('sidebarInstagram')) {
        document.getElementById('sidebarInstagram').value = settings.instagram;
    }
    if (document.getElementById('sidebarFacebook')) {
        document.getElementById('sidebarFacebook').value = settings.facebook;
    }
    if (document.getElementById('sidebarDescription')) {
        document.getElementById('sidebarDescription').value = settings.description;
    }
    
    // حفظ الإعدادات
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        storeData.settings = {
            storeName: document.getElementById('sidebarStoreName').value,
            whatsapp: document.getElementById('sidebarWhatsapp').value,
            instagram: document.getElementById('sidebarInstagram').value,
            facebook: document.getElementById('sidebarFacebook').value,
            description: document.getElementById('sidebarDescription').value
        };
        
        saveStoreData();
        updateStoreInfo();
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
    });
}

// إعداد أزرار التحكم بالكمية
function setupQuantityControls() {
    // الحدث العام لأزرار الكمية
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-decrease') || 
            e.target.parentElement.classList.contains('quantity-decrease')) {
            const input = e.target.closest('.quantity-selector').querySelector('.quantity-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
            }
        }
        
        if (e.target.classList.contains('quantity-increase') || 
            e.target.parentElement.classList.contains('quantity-increase')) {
            const input = e.target.closest('.quantity-selector').querySelector('.quantity-input');
            const max = parseInt(input.max) || 999;
            if (parseInt(input.value) < max) {
                input.value = parseInt(input.value) + 1;
            }
        }
    });
    
    // منع الكتابة المباشرة في حقول الكمية
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const value = parseInt(e.target.value);
            const max = parseInt(e.target.max) || 999;
            const min = parseInt(e.target.min) || 1;
            
            if (isNaN(value) || value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        }
    });
}

// تحميل المنتجات
function loadProducts() {
    updateCategoryCounts();
    displayProducts(storeData.products);
    updateCategoryDisplay();
}

// عرض المنتجات
function displayProducts(products) {
    const container = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (!container) return;
    
    if (products.length > 0) {
        noProducts.classList.add('hidden');
        
        container.innerHTML = products.map(product => {
            const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
            const stockClass = product.stock > 10 ? 'stock-in' : product.stock > 0 ? 'stock-low' : 'stock-out';
            const stockText = product.stock > 10 ? 'متوفر' : product.stock > 0 ? 'مخزون قليل' : 'نفذ';
            
            return `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" 
                             onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'">
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    <div class="product-content">
                        <span class="product-category">${categoryName}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-price">${formatPrice(product.price)}</div>
                        <div class="stock-badge ${stockClass}">${stockText} (${product.stock})</div>
                        
                        <div class="product-quantity-controls">
                            <button class="quantity-btn quantity-decrease">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" 
                                   value="1" min="1" max="${product.stock}" 
                                   id="quantity_${product.id}">
                            <button class="quantity-btn quantity-increase">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <div class="product-actions">
                            <button class="btn primary-btn" onclick="orderProduct('${product.id}')">
                                <i class="fab fa-whatsapp"></i>
                                طلب عبر واتساب
                            </button>
                            <button class="btn secondary-btn" onclick="editProduct('${product.id}')">
                                <i class="fas fa-edit"></i>
                                تعديل
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        noProducts.classList.remove('hidden');
        container.innerHTML = '';
    }
}

// تحديث عرض التصنيفات
function updateCategoryDisplay() {
    storeData.categories.forEach(category => {
        const countElement = document.getElementById(`${category.id}Count`);
        if (countElement) {
            countElement.textContent = `${category.count} منتج`;
        }
    });
}

// تحديث القائمة النشطة
function updateActiveNav(clickedLink) {
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
}

// طلب منتج عبر واتساب مع الكمية
function orderProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    // الحصول على الكمية المحددة
    const quantityInput = document.getElementById(`quantity_${productId}`);
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // التحقق من المخزون
    if (quantity > product.stock) {
        showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
        return;
    }
    
    // زيادة عداد الطلبات
    product.orderCount = (product.orderCount || 0) + 1;
    product.stock = product.stock - quantity;
    saveStoreData();
    loadProducts();
    updateAdminProductsList();
    
    // إنشاء رسالة واتساب
    const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
    const totalPrice = product.price * quantity;
    
    const message = `مرحباً، أريد طلب المنتج التالي:\n\n` +
                   `🛍️ المنتج: ${product.name}\n` +
                   `💰 السعر للوحدة: ${formatPrice(product.price)}\n` +
                   `📦 الكمية: ${quantity}\n` +
                   `💰 الإجمالي: ${formatPrice(totalPrice)}\n` +
                   `📝 القسم: ${categoryName}\n` +
                   `📋 الوصف: ${product.description}\n\n` +
                   `يرجى التواصل معي لإكمال الطلب.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeData.settings.whatsapp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    showNotification('تم فتح واتساب لإكمال الطلب ✓', 'success');
}

// إعداد البحث
function setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length > 0) {
                const filteredProducts = storeData.products.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                    product.category.toLowerCase().includes(searchTerm)
                );
                displayProducts(filteredProducts);
            } else {
                displayProducts(storeData.products);
            }
        });
    }
}

// إعداد التصفية والترتيب
function setupFiltersAndSorting() {
    // التصفية حسب القسم
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // تحديث الأزرار النشطة
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // تطبيق التصفية
            const filter = this.dataset.filter;
            filterProducts(filter);
        });
    });
    
    // الترتيب
    const sortSelect = document.getElementById('productSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortProducts(sortSelect.value);
        });
    }
}

// تصفية المنتجات
function filterProducts(category) {
    let filteredProducts = [...storeData.products];
    
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    displayProducts(filteredProducts);
}

// ترتيب المنتجات
function sortProducts(sortBy) {
    let sortedProducts = [...storeData.products];
    
    switch (sortBy) {
        case 'newest':
            sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
    }
    
    displayProducts(sortedProducts);
}

// إعداد بطاقات التصنيفات
function setupCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            filterProducts(category);
            
            // تحديث زر التصفية النشط
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            // التمرير إلى قسم المنتجات
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const backgroundColor = type === 'success' ? '#4CAF50' : 
                           type === 'error' ? '#f44336' : 
                           '#9D4EDD';
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: backgroundColor,
        stopOnFocus: true,
        style: {
            fontFamily: "'Cairo', sans-serif",
            borderRadius: "8px",
            padding: "15px 20px",
            fontSize: "14px"
        }
    }).showToast();
}