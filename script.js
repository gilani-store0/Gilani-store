// العناصر الرئيسية في DOM
const productsContainer = document.getElementById('products-container');
const productForm = document.getElementById('productForm');
const adminProductsList = document.getElementById('adminProductsList');
const noProductsMessage = document.getElementById('noProductsMessage');
const productCount = document.getElementById('productCount');
const productsListCount = document.getElementById('productsListCount');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const adminToggle = document.getElementById('adminToggle');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const adminPanel = document.getElementById('admin-panel');
const clearFormBtn = document.getElementById('clearForm');
const productSearch = document.getElementById('productSearch');
const exportDataBtn = document.getElementById('exportData');
const importDataBtn = document.getElementById('importData');
const clearAllDataBtn = document.getElementById('clearAllData');
const importSection = document.getElementById('importSection');
const importFile = document.getElementById('importFile');
const processImportBtn = document.getElementById('processImport');
const imagePreview = document.getElementById('imagePreview');
const productImageInput = document.getElementById('productImage');
const noProductsPublic = document.getElementById('noProductsPublic');
const openAdminFromEmpty = document.getElementById('openAdminFromEmpty');
const mostOrderedProduct = document.getElementById('mostOrderedProduct');
const averagePrice = document.getElementById('averagePrice');
const categoryCount = document.getElementById('categoryCount');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');
const exportProductsLink = document.getElementById('exportProductsLink');
const printProducts = document.getElementById('printProducts');
const currentYear = document.getElementById('currentYear');

// المتغيرات العامة
let products = JSON.parse(localStorage.getItem('whatsapp-store-products')) || [];
let editProductId = null;

// دالة التهيئة
function init() {
    loadProducts();
    setupEventListeners();
    updateStats();
    currentYear.textContent = new Date().getFullYear();
}

// دالة تحميل المنتجات
function loadProducts() {
    // تحديث العداد
    productCount.textContent = products.length;
    productsListCount.textContent = products.length;
    
    // التحقق من وجود منتجات
    if (products.length === 0) {
        noProductsMessage.classList.remove('hidden');
        noProductsPublic.classList.remove('hidden');
        productsContainer.classList.add('hidden');
    } else {
        noProductsMessage.classList.add('hidden');
        noProductsPublic.classList.add('hidden');
        productsContainer.classList.remove('hidden');
        displayProducts(products);
        displayAdminProducts(products);
    }
    
    // تحديث الإحصائيات
    updateStats();
}

// دالة عرض المنتجات في المتجر
function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';
    
    // إذا لم توجد منتجات
    if (productsToDisplay.length === 0) {
        noProductsPublic.classList.remove('hidden');
        return;
    }
    
    // تصفية وترتيب المنتجات
    let filteredProducts = [...productsToDisplay];
    
    // التصفية حسب التصنيف
    if (categoryFilter.value !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.category === categoryFilter.value
        );
    }
    
    // الترتيب
    switch (sortFilter.value) {
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'priceLow':
            filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'priceHigh':
            filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
    }
    
    // إنشاء عناصر المنتجات
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// دالة عرض المنتجات في لوحة التحكم
function displayAdminProducts(productsToDisplay) {
    adminProductsList.innerHTML = '';
    
    // البحث عن المنتجات
    const searchTerm = productSearch.value.toLowerCase();
    let filteredProducts = productsToDisplay;
    
    if (searchTerm) {
        filteredProducts = productsToDisplay.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // إذا لم توجد منتجات بعد البحث
    if (filteredProducts.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-state';
        emptyMessage.textContent = searchTerm ? 'لم يتم العثور على منتجات تطابق البحث' : 'لا توجد منتجات بعد';
        adminProductsList.appendChild(emptyMessage);
        return;
    }
    
    // عرض المنتجات
    filteredProducts.forEach(product => {
        const productItem = createAdminProductItem(product);
        adminProductsList.appendChild(productItem);
    });
}

// دالة إنشاء بطاقة منتج للمتجر
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    
    // معاينة الصورة
    const imageUrl = product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';
    
    card.innerHTML = `
        <div class="product-badge">${product.category}</div>
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">${parseFloat(product.price).toFixed(2)} ريال</div>
            <button class="order-btn" onclick="orderProduct('${product.id}')">
                <i class="fab fa-whatsapp"></i> طلب عبر واتساب
            </button>
        </div>
    `;
    
    return card;
}

// دالة إنشاء عنصر منتج في لوحة التحكم
function createAdminProductItem(product) {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.dataset.id = product.id;
    
    // معاينة الصورة
    const imageUrl = product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w-100&h=100&fit=crop';
    
    item.innerHTML = `
        <div class="product-item-image">
            <img src="${imageUrl}" alt="${product.name}">
        </div>
        <div class="product-item-info">
            <div class="product-item-name">${product.name}</div>
            <div class="product-item-price">${parseFloat(product.price).toFixed(2)} ريال</div>
            <div class="product-item-category"><small>${product.category}</small></div>
        </div>
        <div class="product-item-actions">
            <button class="btn small primary" onclick="editProduct('${product.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn small danger" onclick="deleteProduct('${product.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return item;
}

// دالة إضافة/تعديل منتج
productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productData = {
        id: editProductId || Date.now().toString(),
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value).toFixed(2),
        category: document.getElementById('productCategory').value,
        image: document.getElementById('productImage').value || null,
        createdAt: editProductId ? 
            products.find(p => p.id === editProductId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editProductId) {
        // تعديل المنتج
        const index = products.findIndex(p => p.id === editProductId);
        if (index !== -1) {
            products[index] = productData;
            showToast('تم تحديث المنتج بنجاح', 'success');
        }
        editProductId = null;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> حفظ المنتج';
    } else {
        // إضافة منتج جديد
        products.push(productData);
        showToast('تم إضافة المنتج بنجاح', 'success');
    }
    
    // حفظ في LocalStorage
    saveProducts();
    
    // تحديث العرض
    loadProducts();
    
    // مسح النموذج
    clearForm();
});

// دالة تعديل منتج
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editProductId = productId;
    
    // تعبئة النموذج
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productImage').value = product.image || '';
    
    // تحديث معاينة الصورة
    updateImagePreview(product.image);
    
    // تغيير نص الزر
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
    
    // التمرير إلى الأعلى
    adminPanel.classList.remove('hidden');
    adminPanel.scrollIntoView({ behavior: 'smooth' });
    
    showToast('جاري تحرير المنتج', 'info');
}

// دالة حذف منتج
function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    products = products.filter(p => p.id !== productId);
    saveProducts();
    loadProducts();
    showToast('تم حذف المنتج بنجاح', 'success');
}

// دالة مسح النموذج
clearFormBtn.addEventListener('click', clearForm);

function clearForm() {
    productForm.reset();
    editProductId = null;
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> حفظ المنتج';
    imagePreview.innerHTML = '<p>معاينة الصورة ستظهر هنا</p>';
    document.getElementById('productImage').value = '';
}

// دالة حفظ المنتجات في LocalStorage
function saveProducts() {
    localStorage.setItem('whatsapp-store-products', JSON.stringify(products));
    updateStats();
}

// دالة طلب المنتج عبر واتساب
function orderProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // زيادة عداد الطلبات
    if (!product.orderCount) product.orderCount = 0;
    product.orderCount++;
    saveProducts();
    
    // إنشاء رسالة واتساب
    const phoneNumber = "9665XXXXXXXXX"; // استبدل برقمك
    const message = `مرحباً، أريد طلب المنتج التالي:\n\n` +
                   `اسم المنتج: ${product.name}\n` +
                   `السعر: ${product.price} ريال\n` +
                   `التصنيف: ${product.category}\n` +
                   `\nأرغب في طلب هذا المنتج، الرجاء التواصل معي لإكمال الطلب.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // إظهار رسالة تأكيد
    showToast('سيتم فتح واتساب لإكمال الطلب', 'info');
}

// دالة تحديث الإحصائيات
function updateStats() {
    if (products.length === 0) {
        mostOrderedProduct.textContent = '-';
        averagePrice.textContent = '0 ريال';
        categoryCount.textContent = '0';
        return;
    }
    
    // المنتج الأكثر طلباً
    const mostOrdered = products.reduce((prev, current) => 
        (prev.orderCount || 0) > (current.orderCount || 0) ? prev : current
    );
    mostOrderedProduct.textContent = mostOrdered.name;
    
    // متوسط السعر
    const total = products.reduce((sum, product) => sum + parseFloat(product.price), 0);
    const average = total / products.length;
    averagePrice.textContent = average.toFixed(2) + ' ريال';
    
    // عدد التصنيفات الفريدة
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    categoryCount.textContent = uniqueCategories.length;
}

// دالة عرض الرسائل
function showToast(message, type = 'info') {
    const backgroundColor = type === 'success' ? '#25D366' : 
                           type === 'error' ? '#dc3545' : 
                           type === 'warning' ? '#ffc107' : '#075E54';
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "left",
        style: {
            background: backgroundColor,
            borderRadius: '4px',
            fontFamily: "'Cairo', sans-serif"
        }
    }).showToast();
}

// دالة تصدير المنتجات
function exportProducts() {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `منتجات-المتجر-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('تم تصدير المنتجات بنجاح', 'success');
}

// دالة استيراد المنتجات
function importProducts(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedProducts = JSON.parse(e.target.result);
            
            // التحقق من صحة البيانات
            if (!Array.isArray(importedProducts)) {
                throw new Error('تنسيق الملف غير صحيح');
            }
            
            // دمج المنتجات (تجنب التكرار)
            importedProducts.forEach(newProduct => {
                if (!products.some(p => p.id === newProduct.id)) {
                    // تعيين تاريخ جديد إذا لم يكن موجوداً
                    if (!newProduct.createdAt) {
                        newProduct.createdAt = new Date().toISOString();
                    }
                    products.push(newProduct);
                }
            });
            
            saveProducts();
            loadProducts();
            showToast('تم استيراد المنتجات بنجاح', 'success');
            importSection.classList.add('hidden');
        } catch (error) {
            showToast('خطأ في تنسيق الملف', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

// دالة معاينة الصورة
function updateImagePreview(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        imagePreview.innerHTML = '<p>معاينة الصورة ستظهر هنا</p>';
        return;
    }
    
    imagePreview.innerHTML = `
        <img src="${imageUrl}" alt="معاينة الصورة" 
             onerror="this.onerror=null; this.parentElement.innerHTML='<p>رابط الصورة غير صالح</p>'">
    `;
}

// دالة إعداد المستمعين للأحداث
function setupEventListeners() {
    // فتح/إغلاق لوحة التحكم
    adminToggle.addEventListener('click', () => {
        adminPanel.classList.toggle('hidden');
        if (!adminPanel.classList.contains('hidden')) {
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    closeAdminPanel.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });
    
    // فتح لوحة التحكم من حالة المنتجات الفارغة
    openAdminFromEmpty.addEventListener('click', () => {
        adminPanel.classList.remove('hidden');
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    });
    
    // تحديث معاينة الصورة عند تغيير الرابط
    productImageInput.addEventListener('input', () => {
        updateImagePreview(productImageInput.value);
    });
    
    // البحث عن المنتجات
    productSearch.addEventListener('input', () => {
        displayAdminProducts(products);
    });
    
    // التصفية والترتيب
    categoryFilter.addEventListener('change', () => {
        displayProducts(products);
    });
    
    sortFilter.addEventListener('change', () => {
        displayProducts(products);
    });
    
    // تصدير البيانات
    exportDataBtn.addEventListener('click', exportProducts);
    exportProductsLink.addEventListener('click', (e) => {
        e.preventDefault();
        exportProducts();
    });
    
    // استيراد البيانات
    importDataBtn.addEventListener('click', () => {
        importSection.classList.toggle('hidden');
    });
    
    processImportBtn.addEventListener('click', () => {
        if (!importFile.files.length) {
            showToast('الرجاء اختيار ملف', 'warning');
            return;
        }
        importProducts(importFile.files[0]);
    });
    
    // حذف جميع البيانات
    clearAllDataBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف جميع المنتجات؟ لا يمكن التراجع عن هذا الإجراء!')) {
            products = [];
            saveProducts();
            loadProducts();
            showToast('تم حذف جميع المنتجات', 'success');
        }
    });
    
    // طباعة المنتجات
    printProducts.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
    });
    
    // القائمة الجانبية للجوّال
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });
    
    closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
    
    // إضافة بعض المنتجات الافتراضية إذا لم يكن هناك منتجات
    if (products.length === 0) {
        const defaultProducts = [
            {
                id: '1',
                name: 'ساعة ذكية حديثة',
                description: 'ساعة ذكية بشاشة AMOLED ومقاومة للماء',
                price: '499.99',
                category: 'إلكترونيات',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'حذاء رياضي مريح',
                description: 'حذاء رياعي عالي الجودة للمشي والجري',
                price: '199.99',
                category: 'ملابس',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'سماعات لاسلكية',
                description: 'سماعات بلوتوث مع عزل ضوضاء',
                price: '299.99',
                category: 'إلكترونيات',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        products = defaultProducts;
        saveProducts();
        loadProducts();
        showToast('تم إضافة منتجات افتراضية للبدء', 'info');
    }
}

// تهيئة المتجر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

