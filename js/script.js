// بيانات المتجر
let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249933002015",
        openingTime: "08:00",
        closingTime: "18:00",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
    },
    products: [], // فارغة لتبدأ من الصفر
    categories: [
        { id: "perfumes", name: "العطور", count: 0 },
        { id: "makeup", name: "المكياج", count: 0 },
        { id: "skincare", name: "العناية بالبشرة", count: 0 },
        { id: "haircare", name: "العناية بالشعر", count: 0 }
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
    // تحميل البيانات المحفوظة
    const savedData = localStorage.getItem('beautyStoreData');
    if (savedData) {
        try {
            storeData = JSON.parse(savedData);
        } catch (e) {
            console.error('خطأ في تحميل البيانات:', e);
        }
    }
    
    // تحديث تعداد الأقسام
    updateCategoryCounts();
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
    
    // تحديث رقم واتساب
    document.getElementById('footerWhatsapp').textContent = settings.whatsapp;
    
    // تحديث مواعيد العمل
    document.getElementById('footerWorkingHours').textContent = `${settings.openingTime} - ${settings.closingTime}`;
}

// تحديث السنة الحالية
function updateCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
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
    
    // إغلاق القائمة عند النقر على رابط
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
                
                // تحديث القائمة النشطة
                updateActiveNav(this);
            }
        });
    });
    
    // لوحة التحكم
    const adminToggle = document.getElementById('adminToggle');
    const closePanel = document.getElementById('closePanel');
    const controlPanel = document.getElementById('controlPanel');
    const overlay = document.getElementById('controlPanelOverlay');
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
    
    // إضافة منتج أولي
    const addFirstProduct = document.getElementById('addFirstProduct');
    const addFirstProductAdmin = document.getElementById('addFirstProductAdmin');
    
    if (addFirstProduct) {
        addFirstProduct.addEventListener('click', () => {
            openPanel();
            document.querySelector('[data-tab="products-tab"]').click();
            document.getElementById('addProductBtn').click();
        });
    }
    
    if (addFirstProductAdmin) {
        addFirstProductAdmin.addEventListener('click', () => {
            document.getElementById('addProductBtn').click();
        });
    }
    
    // نموذج المنتج
    setupProductForm();
    
    // نموذج الإعدادات
    setupSettingsForm();
    
    // التصفية والترتيب
    setupFiltersAndSorting();
    
    // التصنيفات
    setupCategoryCards();
}

// تحديث القائمة النشطة
function updateActiveNav(clickedLink) {
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
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
    
    // إخفاء رسالة "لا توجد منتجات" إذا كان هناك منتجات
    if (products.length > 0) {
        noProducts.classList.add('hidden');
        
        container.innerHTML = products.map(product => {
            const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
            
            return `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" 
                             onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'">
                    </div>
                    <div class="product-content">
                        <span class="product-category">${categoryName}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-price">${product.price} ج.م</div>
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

// إعداد نموذج المنتج
function setupProductForm() {
    const form = document.getElementById('productForm');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const formContainer = document.getElementById('productFormContainer');
    const productImageInput = document.getElementById('productImage');
    
    if (!form) return;
    
    // إظهار النموذج
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
    
    // إخفاء النموذج
    if (cancelProductBtn && formContainer) {
        cancelProductBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
        });
    }
    
    // معاينة الصورة
    if (productImageInput) {
        productImageInput.addEventListener('input', function() {
            const imageUrl = this.value;
            if (imageUrl) {
                updateImagePreview(imageUrl);
            }
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
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value,
            stock: parseInt(document.getElementById('productStock').value) || 1,
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

// تحديث معاينة الصورة
function updateImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>جاري تحميل الصورة...</p>';
    
    const img = new Image();
    img.onload = function() {
        preview.innerHTML = `<img src="${imageUrl}" alt="معاينة الصورة" style="max-width:100%; border-radius:8px;">`;
    };
    img.onerror = function() {
        preview.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>رابط الصورة غير صالح</p>';
    };
    img.src = imageUrl;
}

// تحديث جدول المنتجات في لوحة التحكم
function updateAdminProductsTable() {
    const container = document.getElementById('adminProductsTable');
    const emptyTable = document.getElementById('emptyAdminTable');
    
    if (!container) return;
    
    if (storeData.products.length === 0) {
        emptyTable.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    emptyTable.classList.add('hidden');
    
    container.innerHTML = `
        <div class="products-list">
            ${storeData.products.map(product => {
                const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
                
                return `
                    <div class="product-item" data-id="${product.id}">
                        <div class="product-item-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="product-item-info">
                            <h4>${product.name}</h4>
                            <p>${categoryName} - ${product.price} ج.م</p>
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
            }).join('')}
        </div>
    `;
    
    // إضافة تنسيقات للقائمة
    const style = document.createElement('style');
    style.textContent = `
        .products-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .product-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: var(--light-gray);
            border-radius: var(--border-radius);
        }
        .product-item-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
        }
        .product-item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .product-item-info {
            flex: 1;
        }
        .product-item-info h4 {
            margin-bottom: 5px;
            color: var(--dark-color);
        }
        .product-item-info p {
            color: var(--gray-color);
            font-size: 0.9rem;
        }
        .product-item-actions {
            display: flex;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
}

// تعديل منتج
function editProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    const formContainer = document.getElementById('productFormContainer');
    const form = document.getElementById('productForm');
    
    formContainer.classList.remove('hidden');
    
    // تعبئة الحقول
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image;
    
    // تحديث معاينة الصورة
    updateImagePreview(product.image);
    
    // التمرير للنموذج
    form.scrollIntoView({ behavior: 'smooth' });
}

// حذف منتج
function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    storeData.products = storeData.products.filter(p => p.id !== productId);
    saveStoreData();
    loadProducts();
    updateAdminProductsTable();
    showNotification('تم حذف المنتج بنجاح', 'success');
}

// إعداد نموذج الإعدادات
function setupSettingsForm() {
    const form = document.getElementById('storeSettingsForm');
    if (!form) return;
    
    // تحميل البيانات
    const settings = storeData.settings;
    document.getElementById('storeName').value = settings.storeName;
    document.getElementById('whatsappNumber').value = settings.whatsapp;
    document.getElementById('openingTime').value = settings.openingTime;
    document.getElementById('closingTime').value = settings.closingTime;
    document.getElementById('storeDescription').value = settings.description;
    
    // حفظ الإعدادات
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        storeData.settings = {
            storeName: document.getElementById('storeName').value,
            whatsapp: document.getElementById('whatsappNumber').value,
            openingTime: document.getElementById('openingTime').value,
            closingTime: document.getElementById('closingTime').value,
            description: document.getElementById('storeDescription').value
        };
        
        saveStoreData();
        updateStoreInfo();
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
    });
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

// طلب منتج عبر واتساب
function orderProduct(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    // زيادة عداد الطلبات
    product.orderCount = (product.orderCount || 0) + 1;
    saveStoreData();
    
    // إنشاء رسالة واتساب
    const categoryName = storeData.categories.find(c => c.id === product.category)?.name || 'غير مصنف';
    const message = `مرحباً، أريد طلب المنتج التالي:\n\n` +
                   `🛍️ المنتج: ${product.name}\n` +
                   `💰 السعر: ${product.price} ج.م\n` +
                   `📦 القسم: ${categoryName}\n` +
                   `📝 الوصف: ${product.description}\n\n` +
                   `يرجى التواصل معي لإكمال الطلب.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeData.settings.whatsapp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    showNotification('تم فتح واتساب لإكمال الطلب', 'success');
}

// تحميل بيانات لوحة التحكم
function loadControlPanelData() {
    updateAdminProductsTable();
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
            padding: "15px 20px"
        }
    }).showToast();
}

