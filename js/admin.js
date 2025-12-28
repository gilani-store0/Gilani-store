// js/admin.js - النسخة الكاملة المحدَّثة مع رفع الصور

let pendingAction = null;
let pendingActionData = null;
let selectedImageFile = null;
let imagePreviewUrl = null;

// تهيئة الإدارة
function initAdmin() {
    console.log('تهيئة لوحة الإدارة...');
    setupAdminEventListeners();
    setupImageUpload();
    
    // التحقق من صلاحية المسؤول
    if (!isUserAdmin()) {
        console.warn('المستخدم ليس مسؤولاً، إخفاء لوحة الإدارة');
        return;
    }
}

// إعداد نظام رفع الصور
function setupImageUpload() {
    const imageInput = document.getElementById('productImageFile');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageUrlInput = document.getElementById('productImageUrl');
    
    if (!imageInput || !previewContainer) return;
    
    // اختيار صورة من المعرض
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // التحقق من نوع الملف
            if (!file.type.startsWith('image/')) {
                showToast('الرجاء اختيار ملف صورة فقط', true, 'error');
                return;
            }
            
            // التحقق من حجم الملف (5MB كحد أقصى)
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة كبير جداً (الحد الأقصى 5MB)', true, 'error');
                return;
            }
            
            selectedImageFile = file;
            
            // عرض معاينة الصورة
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreviewUrl = e.target.result;
                previewContainer.innerHTML = `
                    <div class="image-preview">
                        <img src="${imagePreviewUrl}" alt="معاينة الصورة">
                        <button type="button" class="btn small-btn danger-btn remove-image-btn">
                            <i class="fas fa-times"></i> حذف
                        </button>
                    </div>
                `;
                
                // إضافة حدث لحذف المعاينة
                previewContainer.querySelector('.remove-image-btn').addEventListener('click', removeImagePreview);
            };
            reader.readAsDataURL(file);
            
            // تفريغ حقل الرابط
            if (imageUrlInput) {
                imageUrlInput.value = '';
            }
        }
    });
    
    // زر رفع الصورة
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    // تفريغ معاينة الصورة
    function removeImagePreview() {
        selectedImageFile = null;
        imagePreviewUrl = null;
        previewContainer.innerHTML = `
            <div class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>انقر لرفع صورة</p>
                <p class="small">الحجم الأقصى: 5MB</p>
            </div>
        `;
        if (imageUrlInput) {
            imageUrlInput.value = '';
        }
    }
}

// رفع الصورة إلى Firebase Storage
async function uploadProductImage(file) {
    try {
        if (!window.storage) {
            throw new Error('Firebase Storage غير متاح');
        }
        
        const user = window.auth.currentUser;
        if (!user) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }
        
        // إنشاء اسم فريد للملف
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `products/${user.uid}_${timestamp}_${randomString}.jpg`;
        
        // رفع الملف
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(fileName);
        
        showToast('جاري رفع الصورة...', false, 'info');
        
        // رفع الملف مع تحديد نوع المحتوى
        const metadata = {
            contentType: file.type || 'image/jpeg'
        };
        
        const uploadTask = await fileRef.put(file, metadata);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        showToast('تم رفع الصورة بنجاح', false, 'success');
        return downloadURL;
        
    } catch (error) {
        console.error('❌ خطأ في رفع الصورة:', error);
        showToast('فشل رفع الصورة: ' + error.message, true, 'error');
        throw error;
    }
}

// حفظ المنتج
async function saveProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        const productName = document.getElementById('productName').value.trim();
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productStock = parseInt(document.getElementById('productStock').value);
        
        // التحقق من الحقول المطلوبة
        if (!productName || !productPrice || isNaN(productPrice) || isNaN(productStock)) {
            showToast('الرجاء ملء جميع الحقول المطلوبة بشكل صحيح', true, 'error');
            return;
        }
        
        if (productPrice <= 0) {
            showToast('السعر يجب أن يكون أكبر من صفر', true, 'error');
            return;
        }
        
        if (productStock < 0) {
            showToast('الكمية لا يمكن أن تكون سالبة', true, 'error');
            return;
        }
        
        let imageUrl = document.getElementById('productImageUrl').value.trim();
        
        // إذا كان هناك ملف صورة مرفوع
        if (selectedImageFile) {
            showToast('جاري رفع الصورة وحفظ المنتج...', false, 'info');
            imageUrl = await uploadProductImage(selectedImageFile);
        }
        
        // إذا لم يكن هناك رابط صورة ولا ملف مرفوع
        if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop';
        }
        
        const productData = {
            name: productName,
            price: productPrice,
            image: imageUrl,
            description: document.getElementById('productDescription').value.trim() || '',
            category: document.getElementById('productCategory').value || 'perfume',
            stock: productStock,
            isNew: document.getElementById('isNew').checked,
            isSale: document.getElementById('isSale').checked,
            isBest: document.getElementById('isBest').checked,
            isActive: document.getElementById('isActive').checked,
            views: productId ? undefined : 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // إضافة createdAt للمنتجات الجديدة فقط
        if (!productId) {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        if (window.db) {
            let productRef;
            if (productId) {
                // تحديث منتج موجود
                productRef = window.db.collection("products").doc(productId);
                await productRef.set(productData, { merge: true });
                showToast('✅ تم تحديث المنتج بنجاح', false, 'success');
            } else {
                // إضافة منتج جديد
                productRef = await window.db.collection("products").add(productData);
                showToast('✅ تم إضافة المنتج بنجاح', false, 'success');
                console.log('📝 المنتج أُضيف مع ID:', productRef.id);
            }
            
            // تفريغ الحقول وإعادة التعيين
            resetProductForm();
            
            // تحديث القائمة في الإدارة
            const products = await loadAllProducts();
            renderAdminProducts(products);
            
            // تحديث المنتجات في الواجهة الأمامية إذا كانت الدالة متاحة
            if (typeof loadProducts === 'function') {
                await loadProducts();
            }
            
            // إغلاق المودال بعد تأخير بسيط
            setTimeout(() => {
                const modal = document.getElementById('productModal');
                if (modal) modal.classList.add('hidden');
            }, 1000);
            
        } else {
            showToast('Firestore غير متاح، تعذر حفظ المنتج', true, 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ المنتج:', error);
        showToast('حدث خطأ أثناء حفظ المنتج: ' + error.message, true, 'error');
    }
}

// تفريغ نموذج المنتج
function resetProductForm() {
    selectedImageFile = null;
    imagePreviewUrl = null;
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>انقر لرفع صورة</p>
                <p class="small">الحجم الأقصى: 5MB</p>
            </div>
        `;
    }
    document.getElementById('productStock').value = 10;
    document.getElementById('isActive').checked = true;
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
        
        console.log(`📦 تم جلب ${products.length} منتج للإدارة`);
        return products;
    } catch (error) {
        console.error("❌ خطأ في جلب المنتجات:", error);
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
                email: "yxr.249@gmail.com",
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
                storeName: "QB",
                email: "yxr.249@gmail.com",
                phone1: "+249933002015",
                phone2: "",
                shippingCost: 15,
                freeShippingLimit: 200,
                address: "السعودية - الرياض",
                workingHours: "من الأحد إلى الخميس: 9 صباحاً - 10 مساءً",
                storeDescription: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
            };
        }
    } catch (error) {
        console.error("❌ خطأ في جلب الإعدادات:", error);
        return {};
    }
}

// جلب إحصائيات المتجر
async function getStoreStats() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، إرجاع إحصائيات افتراضية');
            return {
                totalProducts: 0,
                totalUsers: 0,
                totalOrders: 0,
                totalRevenue: 0
            };
        }
        
        const productsSnapshot = await window.db.collection("products").get();
        const totalProducts = productsSnapshot.size;
        
        const usersSnapshot = await window.db.collection("users").get();
        const totalUsers = usersSnapshot.size;
        
        const ordersSnapshot = await window.db.collection("orders").get();
        const totalOrders = ordersSnapshot.size;
        
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
        console.error("❌ خطأ في جلب الإحصائيات:", error);
        return {
            totalProducts: 0,
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0
        };
    }
}

// حفظ إعدادات الموقع
async function saveSiteSettings() {
    try {
        if (!window.db) {
            showToast('Firestore غير متاح، تعذر حفظ الإعدادات', true, 'error');
            return;
        }
        
        const settings = {
            storeName: document.getElementById('storeNameInput').value,
            email: document.getElementById('settingsEmailInput').value,
            phone1: document.getElementById('phone1Input').value,
            phone2: document.getElementById('phone2Input').value || '',
            address: document.getElementById('addressInput').value,
            shippingCost: parseFloat(document.getElementById('shippingCost').value) || 15,
            freeShippingLimit: parseFloat(document.getElementById('freeShippingLimit').value) || 200,
            workingHours: "من الأحد إلى الخميس: 9 صباحاً - 10 مساءً",
            storeDescription: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await window.db.collection("settings").doc("site_config").set(settings, { merge: true });
        showToast('✅ تم حفظ إعدادات الموقع بنجاح', false, 'success');
    } catch (error) {
        console.error('❌ خطأ في حفظ إعدادات الموقع:', error);
        showToast('حدث خطأ أثناء حفظ الإعدادات: ' + error.message, true, 'error');
    }
}

// حذف المنتج
async function deleteProduct(productId) {
    setupConfirmation(
        'هل أنت متأكد من حذف هذا المنتج؟',
        'هذا الإجراء لا يمكن التراجع عنه وسيتم حذف المنتج نهائياً',
        async () => {
            try {
                if (window.db) {
                    await window.db.collection("products").doc(productId).delete();
                    showToast('✅ تم حذف المنتج بنجاح', false, 'success');
                    
                    const products = await loadAllProducts();
                    renderAdminProducts(products);
                } else {
                    showToast('Firestore غير متاح، تعذر حذف المنتج', true, 'error');
                }
            } catch (error) {
                console.error('❌ خطأ في حذف المنتج:', error);
                showToast('حدث خطأ أثناء حذف المنتج: ' + error.message, true, 'error');
            }
        },
        productId
    );
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
            await saveProduct();
        });
    }
    
    // نموذج إعدادات الموقع
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSiteSettings();
        });
    }
    
    // إعدادات زر التأكيد
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (confirmBtn) confirmBtn.addEventListener('click', executePendingAction);
    if (cancelBtn) cancelBtn.addEventListener('click', clearConfirmation);
}

// عرض منتجات الإدارة
function renderAdminProducts(products) {
    if (typeof UI !== 'undefined' && typeof UI.renderAdminProducts === 'function') {
        UI.renderAdminProducts(products);
    }
}

// تحميل إعدادات الموقع للإدارة
async function loadSiteSettingsForAdmin() {
    try {
        const settings = await getSiteSettings();
        
        // تعبئة الحقول
        if (document.getElementById('storeNameInput')) {
            document.getElementById('storeNameInput').value = settings.storeName || 'QB';
        }
        if (document.getElementById('emailInput')) {
            document.getElementById('emailInput').value = settings.email || 'yxr.249@gmail.com';
        }
        if (document.getElementById('phone1Input')) {
            document.getElementById('phone1Input').value = settings.phone1 || '+249933002015';
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
        
        // تحديث حقل البريد في إعدادات الموقع
        if (document.getElementById('settingsEmailInput')) {
            document.getElementById('settingsEmailInput').value = settings.email || 'yxr.249@gmail.com';
        }
        
        return settings;
    } catch (error) {
        console.error('❌ خطأ في تحميل إعدادات الموقع للإدارة:', error);
        return null;
    }
}

// عرض مودال المنتج
function showProductModal() {
    document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
    resetProductForm();
    document.getElementById('productModal').classList.remove('hidden');
}

// تعديل منتج في المودال
function editProductModal(product) {
    document.getElementById('modalTitle').textContent = 'تعديل المنتج';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productImageUrl').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || 'perfume';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('isNew').checked = product.isNew || false;
    document.getElementById('isSale').checked = product.isSale || false;
    document.getElementById('isBest').checked = product.isBest || false;
    document.getElementById('isActive').checked = product.isActive !== false;
    
    // عرض معاينة الصورة الحالية
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (product.image && product.image.startsWith('http')) {
        previewContainer.innerHTML = `
            <div class="image-preview">
                <img src="${product.image}" alt="معاينة الصورة">
                <button type="button" class="btn small-btn danger-btn remove-image-btn">
                    <i class="fas fa-times"></i> حذف
                </button>
            </div>
        `;
        
        previewContainer.querySelector('.remove-image-btn').addEventListener('click', removeImagePreview);
    }
    
    document.getElementById('productModal').classList.remove('hidden');
}

// جلب جميع المستخدمين
async function getAllUsers() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح');
            return [];
        }
        
        const snapshot = await window.db.collection("users").orderBy("createdAt", "desc").get();
        const users = [];
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        return users;
    } catch (error) {
        console.error("❌ خطأ في جلب المستخدمين:", error);
        return [];
    }
}

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            const userId = btn.dataset.id;
            const user = users.find(u => u.uid === userId);
            showToast(`تعديل بيانات المستخدم ${user?.displayName || ''} ستكون متاحة قريباً`, false, 'info');
        });
    });
}

// منتجات افتراضية للإدارة
function getDefaultProducts() {
    return [
        {
            id: '1',
            name: 'عطر فاخر للرجال',
            description: 'عطر فاخر برائحة عطرية مميزة للرجال، يدوم طويلاً',
            price: 150,
            oldPrice: 200,
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
            isNew: true,
            isBest: true,
            category: 'perfume',
            stock: 25,
            views: 150,
            isActive: true,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'مكياج سائل عالي الجودة',
            description: 'مكياج سائل عالي الجودة يمنحك مظهراً طبيعياً',
            price: 85,
            image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=300&h=300&fit=crop',
            isSale: true,
            category: 'makeup',
            stock: 40,
            views: 120,
            isActive: true,
            createdAt: new Date('2024-01-10')
        }
    ];
}

// دالة عرض التنبيهات
function showToast(message, isPersistent = false, type = 'info') {
    if (typeof showMessage === 'function') {
        showMessage(type === 'error' ? 'خطأ' : 'تنبيه', message, type);
    } else {
        console.log(`Toast [${type}]: ${message}`);
        alert(message);
    }
}

// جعل الدوال متاحة عالمياً
window.showToast = showToast;
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
window.getDefaultProducts = getDefaultProducts;
window.saveProduct = saveProduct;
window.saveSiteSettings = saveSiteSettings;
window.getAllUsers = getAllUsers;
window.deleteProduct = deleteProduct;
window.uploadProductImage = uploadProductImage;
window.setupImageUpload = setupImageUpload;