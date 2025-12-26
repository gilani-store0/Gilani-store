// js/admin.js - لوحة الإدارة

let pendingAction = null;
let pendingActionData = null;

// تهيئة الإدارة
function initAdmin() {
    console.log('تهيئة لوحة الإدارة...');
    setupAdminEventListeners();
}

// جلب جميع المنتجات
async function loadAllProducts() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، استخدام منتجات افتراضية');
            return getDefaultProducts();
        }
        
        const snapshot = await window.db.collection("products").orderBy("createdAt", "desc").get();
        const products = [];
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        
        console.log(`تم جلب ${products.length} منتج للإدارة`);
        return products;
    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
        return getDefaultProducts();
    }
}

// جلب إعدادات الموقع
async function getSiteSettings() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، إرجاع إعدادات افتراضية');
            return {
                storeName: "QB",
                email: "yxr.249@gmai.com",
                phone1: "+249933002015",
                phone2: "",
                shippingCost: 15,
                freeShippingLimit: 200,
                address: "السعودية - الرياض",
                workingHours: "من الأحد إلى الخميس: 9 صباحاً - 10 مساءً",
                storeDescription: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
            };
        }
        
        const docRef = window.db.collection("settings").doc("site_config");
        const docSnap = await docRef.get();
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // إعدادات افتراضية
            return {
                storeName: "جمالك",
                email: "info@jamalek.com",
                phone1: "+966500000000",
                phone2: "",
                shippingCost: 15,
                freeShippingLimit: 200,
                address: "السعودية - الرياض",
                workingHours: "من الأحد إلى الخميس: 9 صباحاً - 10 مساءً",
                storeDescription: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
            };
        }
    } catch (error) {
        console.error("خطأ في جلب الإعدادات:", error);
        return {};
    }
}

// تحميل إعدادات الموقع للإدارة
async function loadSiteSettingsForAdmin() {
    try {
        const settings = await getSiteSettings();
        
        // تعبئة الحقول
        if (document.getElementById('storeNameInput')) {
            document.getElementById('storeNameInput').value = settings.storeName || 'جمالك';
        }
        if (document.getElementById('emailInput')) {
            document.getElementById('emailInput').value = settings.email || 'info@jamalek.com';
        }
        if (document.getElementById('phone1Input')) {
            document.getElementById('phone1Input').value = settings.phone1 || '+966500000000';
        }
        if (document.getElementById('phone2Input')) {
            document.getElementById('phone2Input').value = settings.phone2 || '';
        }
        if (document.getElementById('addressInput')) {
            document.getElementById('addressInput').value = settings.address || 'السعودية - الرياض';
        }
        if (document.getElementById('shippingCost')) {
            document.getElementById('shippingCost').value = settings.shippingCost || 15;
        }
        if (document.getElementById('freeShippingLimit')) {
            document.getElementById('freeShippingLimit').value = settings.freeShippingLimit || 200;
        }
        
        return settings;
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الموقع للإدارة:', error);
        return null;
    }
}

// جلب إحصائيات المتجر
async function getStoreStats() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، إرجاع إحصائيات افتراضية');
            return {
                totalProducts: 6,
                totalUsers: 0,
                totalOrders: 0,
                totalRevenue: 0
            };
        }
        
        const productsSnapshot = await window.db.collection("products").get();
        const totalProducts = productsSnapshot.size;
        
        // جلب المستخدمين
        const usersSnapshot = await window.db.collection("users").get();
        const totalUsers = usersSnapshot.size;
        
        // جلب الطلبات
        const ordersSnapshot = await window.db.collection("orders").get();
        const totalOrders = ordersSnapshot.size;
        
        // حساب الإيرادات
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.total) {
                totalRevenue += order.total;
            }
        });
        
        return {
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue
        };
    } catch (error) {
        console.error("خطأ في جلب الإحصائيات:", error);
        return {
            totalProducts: 6,
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0
        };
    }
}

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('ar-SA', options).format(date);
    } catch (error) {
        return 'تاريخ غير صالح';
    }
}

// إعداد التأكيد
function setupConfirmation(message, details = '', callback, data = null) {
    pendingAction = callback;
    pendingActionData = data;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDetails').textContent = details;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// تنظيف التأكيد
function clearConfirmation() {
    pendingAction = null;
    pendingActionData = null;
    document.getElementById('confirmModal').classList.add('hidden');
}

// تنفيذ الإجراء المؤكد
function executePendingAction() {
    if (pendingAction) {
        pendingAction(pendingActionData);
        clearConfirmation();
    }
}

// إعداد مستمعي الأحداث للإدارة
function setupAdminEventListeners() {
    // تحديث المنتجات عند فتح تبويب المنتجات
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#productsTab') || e.target.closest('.admin-tab[data-tab="products"]')) {
            const products = await loadAllProducts();
            renderAdminProducts(products);
        }
        
        if (e.target.closest('#usersTab') || e.target.closest('.admin-tab[data-tab="users"]')) {
            const users = await getAllUsers();
            renderAdminUsers(users);
        }
        
        if (e.target.closest('#settingsTab') || e.target.closest('.admin-tab[data-tab="settings"]')) {
            await loadSiteSettingsForAdmin();
        }
    });
    
    // زر إضافة منتج جديد
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            showProductModal();
        });
    }
    
    // إغلاق المودال
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('productModal').classList.add('hidden');
        });
    });
    
    // علامات التبويب
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // نموذج المنتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast('سيتم تنفيذ هذه الميزة في التحديث القادم', false, 'info');
            document.getElementById('productModal').classList.add('hidden');
        });
    }
    
    // نموذج إعدادات الموقع
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast('سيتم تنفيذ هذه الميزة في التحديث القادم', false, 'info');
        });
    }
}

// تبديل علامات التبويب
function switchTab(tabId) {
    // إزالة النشاط من جميع التبويبات
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });
    
    // إضافة النشاط للتبويب المحدد
    const activeTab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // إظهار المحتوى المناسب
    const tabContent = document.getElementById(`${tabId}Tab`);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
}

// عرض منتجات الإدارة
function renderAdminProducts(products) {
    const tableBody = document.getElementById('productsTable');
    if (!tableBody) return;
    
    if (!products || products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>لا توجد منتجات</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'}" 
                     alt="${product.name}" 
                     class="product-thumb"
                     onerror="this.src='https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop'">
            </td>
            <td>
                <strong>${product.name}</strong>
                ${product.description ? `<br><small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
            </td>
            <td>${product.price} ر.س</td>
            <td>${product.stock || 0}</td>
            <td>
                <span class="product-status ${product.isActive !== false ? 'status-active' : 'status-inactive'}">
                    ${product.isActive !== false ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${formatDate(product.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn small-btn edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn small-btn danger-btn delete-product" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة مستمعي الأحداث للأزرار
    tableBody.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            if (product) {
                editProductModal(product);
            }
        });
    });
    
    tableBody.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            setupConfirmation(
                'هل أنت متأكد من حذف هذا المنتج؟',
                product ? `سوف يتم حذف "${product.name}" نهائياً` : '',
                async () => {
                    showToast('تم حذف المنتج بنجاح (وهمي)', false, 'success');
                    // في الإصدار الحقيقي، هنا سيتم استدعاء دالة الحذف من Firestore
                }
            );
        });
    });
}

// عرض مستخدمي الإدارة
function renderAdminUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>لا يوجد مستخدمين</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>
                <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'مستخدم')}&background=C89B3C&color=fff`}" 
                     alt="${user.displayName}" 
                     class="product-thumb">
            </td>
            <td>
                <strong>${user.displayName || 'مستخدم'}</strong>
                ${user.isAdmin ? '<br><span class="badge admin-badge">مسؤول</span>' : ''}
            </td>
            <td>${user.email || 'غير محدد'}</td>
            <td>
                <span class="product-status ${user.isAdmin ? 'status-active' : 'status-inactive'}">
                    ${user.isAdmin ? 'مسؤول' : 'مستخدم عادي'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn small-btn edit-user" data-id="${user.uid}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة مستمعي الأحداث
    tableBody.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('ميزة تعديل المستخدم ستكون متاحة قريباً', false, 'info');
        });
    });
}

// عرض مودال المنتج
function showProductModal() {
    document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('editProductId').value = '';
    document.getElementById('productForm').reset();
    
    // تعيين القيم الافتراضية
    document.getElementById('productStock').value = 10;
    document.getElementById('isActive').checked = true;
    
    document.getElementById('productModal').classList.remove('hidden');
}

// تعديل منتج في المودال
function editProductModal(product) {
    document.getElementById('modalTitle').textContent = 'تعديل المنتج';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || 'perfume';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('isNew').checked = product.isNew || false;
    document.getElementById('isSale').checked = product.isSale || false;
    document.getElementById('isBest').checked = product.isBest || false;
    document.getElementById('isActive').checked = product.isActive !== false;
    
    document.getElementById('productModal').classList.remove('hidden');
}

// جعل الدوال متاحة عالمياً
window.initAdmin = initAdmin;
window.loadAllProducts = loadAllProducts;
window.getSiteSettings = getSiteSettings;
window.loadSiteSettingsForAdmin = loadSiteSettingsForAdmin;
window.getStoreStats = getStoreStats;
window.formatDate = formatDate;
window.setupConfirmation = setupConfirmation;
window.clearConfirmation = clearConfirmation;
window.executePendingAction = executePendingAction;
window.switchTab = switchTab;
window.editProductModal = editProductModal;
window.showProductModal = showProductModal;