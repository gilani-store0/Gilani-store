// البيانات الأولية للمتجر
let storeData = {
    settings: {
        storeName: "جمالك",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
        whatsapp: "249933002015",
        currency: "ج.م",
        openingTime: "08:00",
        closingTime: "18:00"
    },
    products: [],
    categories: [
        {
            id: "perfumes",
            name: "العطور",
            icon: "fas fa-wind",
            description: "أفضل العطور العالمية والفاخرة"
        },
        {
            id: "makeup",
            name: "المكياج",
            icon: "fas fa-palette",
            description: "مستحضرات مكياج احترافية"
        },
        {
            id: "skincare",
            name: "العناية بالبشرة",
            icon: "fas fa-spa",
            description: "منتجات العناية والجمال"
        },
        {
            id: "haircare",
            name: "العناية بالشعر",
            icon: "fas fa-fan",
            description: "علاجات ومستحضرات للشعر"
        },
        {
            id: "bodycare",
            name: "العناية بالجسم",
            icon: "fas fa-hand-holding-heart",
            description: "منتجات العناية بالجسم"
        }
    ],
    wishlist: [],
    orders: []
};

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeStore();
    setupEventListeners();
    setupSwiper();
    loadProducts();
    updateWishlistCount();
});

// تهيئة المتجر
function initializeStore() {
    // تحميل البيانات المحفوظة
    const savedData = localStorage.getItem('beautyStoreData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            storeData = { ...storeData, ...parsed };
        } catch (e) {
            console.error('خطأ في تحميل البيانات:', e);
        }
    }
    
    // إضافة منتجات افتراضية إذا لم توجد
    if (storeData.products.length === 0) {
        storeData.products = [
            {
                id: '1',
                name: 'عطر شانيل رقم 5',
                description: 'عطر نسائي كلاسيكي برائحة الأزهار والمسك',
                price: 850,
                originalPrice: 1000,
                category: 'perfumes',
                image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop',
                stock: 15,
                brand: 'شانيل',
                isOffer: true,
                createdAt: new Date().toISOString(),
                orderCount: 12
            },
            {
                id: '2',
                name: 'مكياج ماك احترافي',
                description: 'طقم مكياج كامل من ماركة ماك العالمية',
                price: 1200,
                originalPrice: 1500,
                category: 'makeup',
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop',
                stock: 8,
                brand: 'ماك',
                isOffer: true,
                createdAt: new Date().toISOString(),
                orderCount: 8
            },
            {
                id: '3',
                name: 'مصل فيتامين سي',
                description: 'مصل فيتامين سي للعناية بالبشرة وتوحيد اللون',
                price: 350,
                originalPrice: 450,
                category: 'skincare',
                image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?w=500&auto=format&fit=crop',
                stock: 25,
                brand: 'لوريال',
                isOffer: false,
                createdAt: new Date().toISOString(),
                orderCount: 15
            },
            {
                id: '4',
                name: 'شامبو كيراتين للشعر',
                description: 'شامبو كيراتين لإصلاح الشعر التالف',
                price: 180,
                originalPrice: 220,
                category: 'haircare',
                image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&auto=format&fit=crop',
                stock: 30,
                brand: 'بنتين',
                isOffer: false,
                createdAt: new Date().toISOString(),
                orderCount: 5
            },
            {
                id: '5',
                name: 'عطر ديور سوفاج',
                description: 'عطر رجالي برائحة الخشب والتوابل',
                price: 950,
                originalPrice: 1200,
                category: 'perfumes',
                image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&auto=format&fit=crop',
                stock: 10,
                brand: 'ديور',
                isOffer: true,
                createdAt: new Date().toISOString(),
                orderCount: 18
            },
            {
                id: '6',
                name: 'كريم أساس نارس',
                description: 'كريم أساس طويل الأمد بتغطية كاملة',
                price: 420,
                originalPrice: 550,
                category: 'makeup',
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format&fit=crop',
                stock: 18,
                brand: 'نارس',
                isOffer: false,
                createdAt: new Date().toISOString(),
                orderCount: 7
            }
        ];
        saveStoreData();
    }
    
    // تحديث واجهة المتجر
    updateStoreInfo();
}

// حفظ البيانات
function saveStoreData() {
    localStorage.setItem('beautyStoreData', JSON.stringify(storeData));
}

// تحديث معلومات المتجر
function updateStoreInfo() {
    // تحديث اسم المتجر في الفوتر
    const storeNameElements = document.querySelectorAll('.footer-logo h3');
    storeNameElements.forEach(el => {
        if (el) el.textContent = storeData.settings.storeName;
    });
    
    // تحديث الوصف
    const descriptionElement = document.querySelector('.footer-description');
    if (descriptionElement) {
        descriptionElement.textContent = storeData.settings.description;
    }
}

// إعداد السوايبر
function setupSwiper() {
    const heroSwiper = new Swiper('.hero-swiper', {
        loop: true,
        speed: 800,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });
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
    
    // البحث
    const searchToggle = document.getElementById('searchToggle');
    const searchBox = document.getElementById('searchBox');
    const globalSearch = document.getElementById('globalSearch');
    
    if (searchToggle && searchBox) {
        searchToggle.addEventListener('click', () => {
            searchBox.classList.toggle('active');
        });
        
        // إغلاق البحث عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
                searchBox.classList.remove('active');
            }
        });
    }
    
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }
    
    // لوحة التحكم
    const adminToggle = document.getElementById('adminToggle');
    const closePanel = document.getElementById('closePanel');
    const controlPanel = document.getElementById('controlPanel');
    const overlay = document.getElementById('controlPanelOverlay');
    const mobileAdminToggle = document.getElementById('mobileAdminToggle');
    const openControlPanel = document.getElementById('openControlPanel');
    
    const openPanel = () => {
        controlPanel.classList.add('active');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        loadControlPanelData();
    };
    
    const closePanelFunc = () => {
        controlPanel.classList.remove('active');
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };
    
    if (adminToggle) adminToggle.addEventListener('click', openPanel);
    if (closePanel) closePanel.addEventListener('click', closePanelFunc);
    if (overlay) overlay.addEventListener('click', closePanelFunc);
    if (mobileAdminToggle) mobileAdminToggle.addEventListener('click', openPanel);
    if (openControlPanel) openControlPanel.addEventListener('click', (e) => {
        e.preventDefault();
        openPanel();
    });
    
    // تبويبات لوحة التحكم
    const panelTabs = document.querySelectorAll('.panel-tab');
    panelTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // تحديث التبويب النشط
            panelTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // إظهار المحتوى المناسب
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // أزرار المنتجات
    setupProductButtons();
    
    // تصفية المنتجات
    setupProductFilters();
    
    // نموذج المنتج
    setupProductForm();
}

// تحميل المنتجات
function loadProducts() {
    displayCategories();
    displayProducts(storeData.products);
    displayOffers();
}

// عرض الأقسام
function displayCategories() {
    const container = document.getElementById('mainCategories');
    if (!container) return;
    
    container.innerHTML = storeData.categories.map(category => {
        const categoryProducts = storeData.products.filter(p => p.category === category.id);
        const sampleProducts = categoryProducts.slice(0, 3);
        
        return `
            <div class="main-category-card">
                <div class="category-header">
                    <i class="${category.icon}"></i>
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
                <div class="category-products">
                    ${sampleProducts.map(product => `
                        <div class="category-product-item">
                            <img src="${product.image}" alt="${product.name}" class="category-product-image">
                            <div class="category-product-info">
                                <h4>${product.name}</h4>
                                <div class="category-product-price">${product.price} ج.م</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="category-footer">
                    <a href="#products" class="category-btn" data-filter="${category.id}">
                        عرض جميع المنتجات
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    // إضافة مستمعين لأزرار التصفية
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.filter;
            filterProducts(category);
        });
    });
}

// عرض المنتجات
function displayProducts(products) {
    const container = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (!container) return;
    
    if (products.length === 0) {
        noProducts.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    noProducts.classList.add('hidden');
    
    container.innerHTML = products.map(product => {
        const isInWishlist = storeData.wishlist.includes(product.id);
        
        return `
            <div class="product-card" data-category="${product.category}">
                ${product.isOffer ? '<span class="product-badge">عرض خاص</span>' : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <button class="quick-view-btn" onclick="viewProduct('${product.id}')">
                            <i class="fas fa-eye"></i> معاينة سريعة
                        </button>
                    </div>
                </div>
                <div class="product-content">
                    <span class="product-category">${getCategoryName(product.category)}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">
                        <span class="current-price">${product.price} ج.م</span>
                        ${product.originalPrice ? `<span class="original-price">${product.originalPrice} ج.م</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn primary-btn" onclick="orderProduct('${product.id}')">
                            <i class="fab fa-whatsapp"></i>
                            طلب عبر واتساب
                        </button>
                        <button class="wishlist-btn-small ${isInWishlist ? 'active' : ''}" 
                                onclick="toggleWishlist('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// عرض العروض
function displayOffers() {
    const container = document.getElementById('offersGrid');
    if (!container) return;
    
    const offers = storeData.products.filter(p => p.isOffer);
    
    if (offers.length === 0) {
        container.innerHTML = '<p class="empty-state">لا توجد عروح حالياً</p>';
        return;
    }
    
    container.innerHTML = offers.map(product => {
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        return `
            <div class="offer-card">
                <div class="offer-content">
                    <span class="offer-badge">خصم ${discount}%</span>
                    <h3 class="offer-title">${product.name}</h3>
                    <p class="offer-description">${product.description}</p>
                    <div class="offer-price">
                        <span class="offer-current">${product.price} ج.م</span>
                        ${product.originalPrice ? `<span class="offer-original">${product.originalPrice} ج.م</span>` : ''}
                    </div>
                    <button class="btn primary-btn" onclick="orderProduct('${product.id}')">
                        <i class="fab fa-whatsapp"></i>
                        اطلب الآن
                    </button>
                </div>
                <div class="offer-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
            </div>
        `;
    }).join('');
}

// إعداد أزرار المنتجات
function setupProductButtons() {
    // زر تحميل المزيد
    const loadMoreBtn = document.getElementById('loadMore');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            // يمكن إضافة تحميل المزيد من المنتجات هنا
            showNotification('سيتم إضافة المزيد من المنتجات قريباً', 'info');
        });
    }
    
    // زر إضافة أول منتج
    const addFirstProductBtn = document.getElementById('addFirstProduct');
    const addFirstProductAdminBtn = document.getElementById('addFirstProductAdmin');
    
    if (addFirstProductBtn) {
        addFirstProductBtn.addEventListener('click', () => {
            openPanel();
            document.querySelector('[data-tab="products-tab"]').click();
            document.getElementById('addProductBtn').click();
        });
    }
    
    if (addFirstProductAdminBtn) {
        addFirstProductAdminBtn.addEventListener('click', () => {
            document.getElementById('addProductBtn').click();
        });
    }
}

// إعداد تصفية المنتجات
function setupProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('productSort');
    
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
    
    // التمرير إلى قسم المنتجات
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
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
        case 'popular':
            sortedProducts.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
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

// البحث في المنتجات
function searchProducts(query) {
    const filtered = storeData.products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.brand?.toLowerCase().includes(query.toLowerCase())
    );
    
    displayProducts(filtered);
}

// الحصول على اسم القسم
function getCategoryName(categoryId) {
    const category = storeData.categories.find(c => c.id === categoryId);
    return category ? category.name : 'غير مصنف';
}

// طلب منتج عبر واتساب
function orderProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    // زيادة عداد الطلبات
    product.orderCount = (product.orderCount || 0) + 1;
    saveStoreData();
    
    // إنشاء رسالة واتساب
    const message = `مرحباً، أريد طلب المنتج التالي:\n\n` +
                   `🛍️ المنتج: ${product.name}\n` +
                   `💰 السعر: ${product.price} ج.م\n` +
                   `📦 القسم: ${getCategoryName(product.category)}\n` +
                   `🏷️ الماركة: ${product.brand || 'غير محدد'}\n` +
                   `📝 الوصف: ${product.description}\n\n` +
                   `يرجى التواصل معي لإكمال الطلب.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeData.settings.whatsapp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // إظهار إشعار
    showNotification('تم فتح واتساب لإكمال الطلب', 'success');
}

// معاينة المنتج
function viewProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    // يمكن إضافة نافذة معاينة سريعة هنا
    showNotification(`جاري عرض ${product.name}`, 'info');
}

// إدارة المفضلة
function toggleWishlist(productId) {
    const index = storeData.wishlist.indexOf(productId);
    
    if (index === -1) {
        storeData.wishlist.push(productId);
        showNotification('تمت الإضافة إلى المفضلة', 'success');
    } else {
        storeData.wishlist.splice(index, 1);
        showNotification('تمت الإزالة من المفضلة', 'info');
    }
    
    saveStoreData();
    updateWishlistCount();
    loadProducts(); // لتحديث حالة القلب
}

// تحديث عدد المفضلة
function updateWishlistCount() {
    const countElement = document.querySelector('.wishlist-count');
    if (countElement) {
        countElement.textContent = storeData.wishlist.length;
    }
}

// إعداد نموذج المنتج
function setupProductForm() {
    const form = document.getElementById('productForm');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const formContainer = document.getElementById('productFormContainer');
    
    if (!form) return;
    
    // إظهار/إخفاء النموذج
    if (addProductBtn && formContainer) {
        addProductBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            document.getElementById('editProductId').value = '';
            document.getElementById('imagePreview').innerHTML = `
                <i class="fas fa-image"></i>
                <p>معاينة الصورة ستظهر هنا</p>
            `;
        });
    }
    
    if (cancelProductBtn && formContainer) {
        cancelProductBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
        });
    }
    
    // معالجة إرسال النموذج
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('editProductId').value;
        const productData = {
            id: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            originalPrice: document.getElementById('originalPrice').value ? 
                parseFloat(document.getElementById('originalPrice').value) : null,
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            brand: document.getElementById('productBrand').value,
            isOffer: document.getElementById('isOffer').checked,
            createdAt: productId ? 
                storeData.products.find(p => p.id === productId)?.createdAt || new Date().toISOString() : 
                new Date().toISOString(),
            orderCount: productId ? 
                storeData.products.find(p => p.id === productId)?.orderCount || 0 : 0
        };
        
        if (productId) {
            // تعديل المنتج
            const index = storeData.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                storeData.products[index] = productData;
                showNotification('تم تحديث المنتج بنجاح', 'success');
            }
        } else {
            // إضافة منتج جديد
            storeData.products.push(productData);
            showNotification('تم إضافة المنتج بنجاح', 'success');
        }
        
        saveStoreData();
        loadProducts();
        updateAdminProductsTable();
        form.reset();
        formContainer.classList.add('hidden');
    });
}

// تحميل بيانات لوحة التحكم
function loadControlPanelData() {
    updateAdminProductsTable();
    loadSettingsForm();
    loadCategoriesAdmin();
    loadOrdersList();
}

// تحديث جدول المنتجات في لوحة التحكم
function updateAdminProductsTable(products = storeData.products) {
    const tableBody = document.getElementById('adminProductsTable');
    const emptyTable = document.getElementById('emptyTable');
    
    if (!tableBody) return;
    
    if (products.length === 0) {
        emptyTable.classList.remove('hidden');
        tableBody.innerHTML = '';
        return;
    }
    
    emptyTable.classList.add('hidden');
    
    // البحث في لوحة التحكم
    const adminSearch = document.getElementById('adminSearch');
    const adminCategoryFilter = document.getElementById('adminCategoryFilter');
    
    let filteredProducts = products;
    
    if (adminSearch && adminSearch.value) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(adminSearch.value.toLowerCase()) ||
            p.description.toLowerCase().includes(adminSearch.value.toLowerCase())
        );
    }
    
    if (adminCategoryFilter && adminCategoryFilter.value !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === adminCategoryFilter.value);
    }
    
    tableBody.innerHTML = filteredProducts.map(product => `
        <tr data-id="${product.id}">
            <td>
                <img src="${product.image}" alt="${product.name}" 
                     class="product-table-image">
            </td>
            <td>
                <strong>${product.name}</strong><br>
                <small>${product.description.substring(0, 50)}...</small>
            </td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.price} ج.م</td>
            <td>${product.stock}</td>
            <td>
                <div class="table-actions">
                    <button class="action-icon edit-icon" onclick="editProductAdmin('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete-icon" onclick="deleteProductAdmin('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة مستمعين للأحداث
    if (adminSearch) {
        adminSearch.addEventListener('input', () => updateAdminProductsTable());
    }
    
    if (adminCategoryFilter) {
        adminCategoryFilter.addEventListener('change', () => updateAdminProductsTable());
    }
}

// تحميل نموذج الإعدادات
function loadSettingsForm() {
    const form = document.getElementById('storeSettingsForm');
    if (!form) return;
    
    const settings = storeData.settings;
    
    document.getElementById('storeName').value = settings.storeName;
    document.getElementById('whatsappNumber').value = settings.whatsapp;
    document.getElementById('openingTime').value = settings.openingTime;
    document.getElementById('closingTime').value = settings.closingTime;
    document.getElementById('storeDescription').value = settings.description;
    
    // إضافة مستمع للنموذج
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        storeData.settings = {
            storeName: document.getElementById('storeName').value,
            whatsapp: document.getElementById('whatsappNumber').value,
            openingTime: document.getElementById('openingTime').value,
            closingTime: document.getElementById('closingTime').value,
            description: document.getElementById('storeDescription').value,
            currency: 'ج.م'
        };
        
        saveStoreData();
        updateStoreInfo();
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
    });
}

// تحميل الأقسام في لوحة التحكم
function loadCategoriesAdmin() {
    const container = document.getElementById('categoriesGridAdmin');
    if (!container) return;
    
    container.innerHTML = storeData.categories.map(category => {
        const productCount = storeData.products.filter(p => p.category === category.id).length;
        
        return `
            <div class="category-card-admin">
                <div class="category-icon-admin">
                    <i class="${category.icon}"></i>
                </div>
                <h4>${category.name}</h4>
                <p>${category.description}</p>
                <p><strong>${productCount} منتج</strong></p>
            </div>
        `;
    }).join('');
}

// تحميل قائمة الطلبات
function loadOrdersList() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    // هذا قسم يمكن تطويره ليعرض الطلبات الحقيقية
    container.innerHTML = `
        <div class="empty-table">
            <i class="fas fa-shopping-cart"></i>
            <p>لا توجد طلبات حالياً</p>
            <p>الطلبات تظهر هنا عندما يطلب العملاء عبر واتساب</p>
        </div>
    `;
}

// تعديل منتج من لوحة التحكم
function editProductAdmin(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    const formContainer = document.getElementById('productFormContainer');
    formContainer.classList.remove('hidden');
    
    // تعبئة الحقول
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('originalPrice').value = product.originalPrice || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productImage').value = product.image;
    document.getElementById('isOffer').checked = product.isOffer || false;
    
    // تحديث معاينة الصورة
    const preview = document.getElementById('imagePreview');
    if (product.image) {
        preview.innerHTML = `<img src="${product.image}" alt="معاينة">`;
    }
    
    // التمرير للنموذج
    document.querySelector('#productForm').scrollIntoView({ behavior: 'smooth' });
}

// حذف منتج من لوحة التحكم
function deleteProductAdmin(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    storeData.products = storeData.products.filter(p => p.id !== productId);
    saveStoreData();
    updateAdminProductsTable();
    loadProducts();
    showNotification('تم حذف المنتج بنجاح', 'success');
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const backgroundColor = type === 'success' ? '#4CAF50' : 
                           type === 'error' ? '#f44336' : 
                           type === 'warning' ? '#FF9800' : '#9D4EDD';
    
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
            fontSize: "1rem"
        }
    }).showToast();
}

// فتح لوحة التحكم
function openPanel() {
    const controlPanel = document.getElementById('controlPanel');
    const overlay = document.getElementById('controlPanelOverlay');
    
    if (controlPanel && overlay) {
        controlPanel.classList.add('active');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        loadControlPanelData();
    }
}

// إغلاق لوحة التحكم
function closePanel() {
    const controlPanel = document.getElementById('controlPanel');
    const overlay = document.getElementById('controlPanelOverlay');
    
    if (controlPanel && overlay) {
        controlPanel.classList.remove('active');
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// تصدير البيانات
function exportData() {
    const dataStr = JSON.stringify(storeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `متجر-جمالك-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

// استيراد البيانات
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // التحقق من صحة البيانات
            if (!importedData.products || !Array.isArray(importedData.products)) {
                throw new Error('تنسيق الملف غير صحيح');
            }
            
            if (confirm('هل تريد استبدال البيانات الحالية؟ سيتم حذف جميع البيانات الحالية.')) {
                storeData = importedData;
                saveStoreData();
                initializeStore();
                loadProducts();
                showNotification('تم استيراد البيانات بنجاح', 'success');
            }
        } catch (error) {
            showNotification('خطأ في تنسيق الملف', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// تعيين العام الحالي
const currentYear = new Date().getFullYear();
document.querySelectorAll('.current-year').forEach(el => {
    if (el) el.textContent = currentYear;
});

