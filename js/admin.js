// js/admin.js - لوحة الإدارة

import { db } from './firebase.js';
import { showToast } from './cart.js';
import { getUsersCount, getAllUsers } from './auth.js';

let pendingAction = null;
let pendingActionData = null;

// تهيئة الإدارة
export function initAdmin() {
    console.log('تهيئة لوحة الإدارة...');
    setupAdminEventListeners();
}

// جلب جميع المنتجات
export async function loadAllProducts() {
    try {
        const { collection, getDocs, query, orderBy } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
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
        return [];
    }
}

// إضافة منتج
export async function addNewProduct(productData) {
    try {
        const { addDoc, collection, serverTimestamp } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            views: 0,
            sales: 0,
            rating: 0,
            ratingCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('تم إضافة منتج جديد:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("خطأ في إضافة المنتج:", error);
        return { success: false, error: error.message };
    }
}

// تحديث منتج
export async function updateExistingProduct(productId, productData) {
    try {
        const { updateDoc, doc, serverTimestamp } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        await updateDoc(doc(db, "products", productId), {
            ...productData,
            updatedAt: serverTimestamp()
        });
        console.log('تم تحديث المنتج:', productId);
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث المنتج:", error);
        return { success: false, error: error.message };
    }
}

// حذف منتج
export async function deleteProductById(productId) {
    try {
        const { deleteDoc, doc } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        await deleteDoc(doc(db, "products", productId));
        console.log('تم حذف المنتج:', productId);
        return { success: true };
    } catch (error) {
        console.error("خطأ في حذف المنتج:", error);
        return { success: false, error: error.message };
    }
}

// جلب إعدادات الموقع
export async function getSiteSettings() {
    try {
        const { doc, getDoc } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const docRef = doc(db, "settings", "site_config");
        const docSnap = await getDoc(docRef);
        
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
                workingHours: "من الأحد إلى الخميس: 9 صباحاً - 10 مساءً"
            };
        }
    } catch (error) {
        console.error("خطأ في جلب الإعدادات:", error);
        return {};
    }
}

// تحديث إعدادات الموقع
export async function updateSiteSettings(settingsData) {
    try {
        const { setDoc, doc, serverTimestamp } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const docRef = doc(db, "settings", "site_config");
        await setDoc(docRef, {
            ...settingsData,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('تم تحديث إعدادات الموقع');
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث الإعدادات:", error);
        return { success: false, error: error.message };
    }
}

// جلب إحصائيات المتجر
export async function getStoreStats() {
    try {
        const { collection, getDocs } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const productsSnapshot = await getDocs(collection(db, "products"));
        const totalProducts = productsSnapshot.size;
        
        // جلب المستخدمين
        const totalUsers = await getUsersCount();
        
        // يمكن إضافة جلب الطلبات والإيرادات هنا
        const totalOrders = 0; // سيتم تطويره لاحقاً
        const totalRevenue = 0; // سيتم تطويره لاحقاً
        
        return {
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue
        };
    } catch (error) {
        console.error("خطأ في جلب الإحصائيات:", error);
        return {
            totalProducts: 0,
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0
        };
    }
}

// جلب عدد المنتجات
export async function getProductsCount() {
    try {
        const { collection, getDocs } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const productsSnapshot = await getDocs(collection(db, "products"));
        return productsSnapshot.size;
    } catch (error) {
        console.error("خطأ في جلب عدد المنتجات:", error);
        return 0;
    }
}

// جلب عدد الطلبات
export async function getOrdersCount() {
    try {
        const { collection, getDocs } = await import(
            "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
        );
        
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        return ordersSnapshot.size;
    } catch (error) {
        console.error("خطأ في جلب عدد الطلبات:", error);
        return 0;
    }
}

// تنسيق التاريخ
export function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('ar-SA', options).format(date);
    } catch (error) {
        return 'تاريخ غير صالح';
    }
}

// تنسيق العملة
export function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 2
    }).format(amount);
}

// إعداد التأكيد
export function setupConfirmation(message, details = '', callback, data = null) {
    pendingAction = callback;
    pendingActionData = data;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDetails').textContent = details;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// تنظيف التأكيد
export function clearConfirmation() {
    pendingAction = null;
    pendingActionData = null;
    document.getElementById('confirmModal').classList.add('hidden');
}

// تنفيذ الإجراء المؤكد
export function executePendingAction() {
    if (pendingAction) {
        pendingAction(pendingActionData);
        clearConfirmation();
    }
}

// عرض رسالة
export function showMessage(title, message, type = 'info') {
    const messageModal = document.getElementById('messageModal');
    const messageIcon = document.getElementById('messageIcon');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    
    // تعيين الأيقونة حسب النوع
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    messageIcon.className = `fas ${icons[type] || icons.info}`;
    messageTitle.textContent = title;
    messageText.textContent = message;
    
    messageModal.classList.remove('hidden');
    
    // إغلاق المودال عند النقر على الزر
    document.getElementById('messageCloseBtn').onclick = () => {
        messageModal.classList.add('hidden');
    };
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
            const settings = await getSiteSettings();
            populateSiteSettings(settings);
        }
    });
    
    // إضافة منتج جديد
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        showProductModal();
    });
    
    // إغلاق المودال
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('productModal').classList.add('hidden');
            document.getElementById('quantityModal').classList.add('hidden');
            document.getElementById('addedToCartModal').classList.add('hidden');
            document.getElementById('reviewsModal').classList.add('hidden');
        });
    });
    
    // حفظ المنتج
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            oldPrice: document.getElementById('productOldPrice').value ? parseFloat(document.getElementById('productOldPrice').value) : null,
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value,
            category: document.getElementById('productCategory').value,
            brand: document.getElementById('productBrand').value,
            stock: parseInt(document.getElementById('productStock').value),
            isNew: document.getElementById('isNew').checked,
            isSale: document.getElementById('isSale').checked,
            isBest: document.getElementById('isBest').checked,
            isActive: document.getElementById('isActive').checked
        };
        
        const productId = document.getElementById('editProductId').value;
        
        if (productId) {
            // تحديث منتج موجود
            const result = await updateExistingProduct(productId, productData);
            if (result.success) {
                showToast('تم تحديث المنتج بنجاح', false, 'success');
                document.getElementById('productModal').classList.add('hidden');
                
                // تحديث القائمة
                const products = await loadAllProducts();
                renderAdminProducts(products);
            } else {
                showToast('خطأ في تحديث المنتج', true);
            }
        } else {
            // إضافة منتج جديد
            const result = await addNewProduct(productData);
            if (result.success) {
                showToast('تم إضافة المنتج بنجاح', false, 'success');
                document.getElementById('productModal').classList.add('hidden');
                
                // تحديث القائمة
                const products = await loadAllProducts();
                renderAdminProducts(products);
            } else {
                showToast('خطأ في إضافة المنتج', true);
            }
        }
    });
    
    // حفظ إعدادات الموقع
    document.getElementById('siteSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const settingsData = {
            storeName: document.getElementById('storeNameInput').value,
            email: document.getElementById('emailInput').value,
            phone1: document.getElementById('phone1Input').value,
            phone2: document.getElementById('phone2Input').value,
            shippingCost: parseFloat(document.getElementById('shippingCost').value),
            freeShippingLimit: parseFloat(document.getElementById('freeShippingLimit').value)
        };
        
        const result = await updateSiteSettings(settingsData);
        if (result.success) {
            showToast('تم تحديث إعدادات الموقع بنجاح', false, 'success');
        } else {
            showToast('خطأ في تحديث الإعدادات', true);
        }
    });
    
    // علامات التبويب
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
}

// ملء إعدادات الموقع
function populateSiteSettings(settings) {
    document.getElementById('storeNameInput').value = settings.storeName || 'جمالك';
    document.getElementById('emailInput').value = settings.email || 'info@jamalek.com';
    document.getElementById('phone1Input').value = settings.phone1 || '+966500000000';
    document.getElementById('phone2Input').value = settings.phone2 || '';
    document.getElementById('shippingCost').value = settings.shippingCost || 15;
    document.getElementById('freeShippingLimit').value = settings.freeShippingLimit || 200;
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
                ${product.brand ? `<br><small>${product.brand}</small>` : ''}
                ${product.description ? `<br><small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
            </td>
            <td>${product.price} ر.س</td>
            <td>${product.stock || 0}</td>
            <td>
                <span class="product-status ${product.isActive ? 'status-active' : 'status-inactive'}">
                    ${product.isActive ? 'نشط' : 'غير نشط'}
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
                    const result = await deleteProductById(productId);
                    if (result.success) {
                        showToast('تم حذف المنتج بنجاح', false, 'success');
                        const updatedProducts = await loadAllProducts();
                        renderAdminProducts(updatedProducts);
                    } else {
                        showToast('خطأ في حذف المنتج', true);
                    }
                }
            );
        });
    });
}

// عرض مستخدمي الإدارة
function renderAdminUsers(users) {
    const tableBody = document.getElementById('usersTable');
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
}

// عرض مودال المنتج
function showProductModal() {
    document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('editProductId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.remove('hidden');
}

// تعديل منتج في المودال
function editProductModal(product) {
    document.getElementById('modalTitle').textContent = 'تعديل المنتج';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productOldPrice').value = product.oldPrice || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || 'perfume';
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('isNew').checked = product.isNew || false;
    document.getElementById('isSale').checked = product.isSale || false;
    document.getElementById('isBest').checked = product.isBest || false;
    document.getElementById('isActive').checked = product.isActive !== false;
    
    document.getElementById('productModal').classList.remove('hidden');
}