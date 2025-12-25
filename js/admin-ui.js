// js/admin-ui.js - واجهة لوحة التحكم
import { 
    loadAllProducts, 
    addNewProduct, 
    updateExistingProduct, 
    deleteProductById, 
    getAllUsers, 
    updateUserAdminStatus, 
    getStoreStats,
    getSiteSettings,
    updateSiteSettings,
    formatDate,
    getProductImageUrl,
    setupConfirmation,
    executePendingAction,
    clearConfirmation,
    uploadFile
} from './admin.js';

export const AdminUI = {
    currentTab: 'products',

    init() {
        this.setupEventListeners();
        this.loadTabContent('products');
        this.updateStats();
    },

    setupEventListeners() {
        // تبديل التبويبات
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // معاينة الصورة عند اختيار ملف
        document.getElementById('productImageFile')?.addEventListener('change', (e) => {
            this.previewImage(e.target.files[0]);
        });

        // إضافة منتج
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });

        // إغلاق المودال
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('productModal')?.classList.add('hidden');
                document.getElementById('confirmModal')?.classList.add('hidden');
                document.getElementById('messageModal')?.classList.add('hidden');
            });
        });

        // حفظ المنتج
        document.getElementById('productForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProductSubmit();
        });

        // تأكيد الحذف
        document.getElementById('confirmBtn')?.addEventListener('click', () => {
            executePendingAction();
        });

        // حفظ إعدادات الموقع
        document.getElementById('siteSettingsForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSiteSettingsSubmit();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            clearConfirmation();
        });
    },

    async switchTab(tabName) {
        this.currentTab = tabName;
        
        // تحديث الأزرار
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // تحديث المحتوى
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}Tab`);
            pane.classList.toggle('hidden', pane.id !== `${tabName}Tab`);
        });

        await this.loadTabContent(tabName);
    },

    async loadTabContent(tabName) {
        switch(tabName) {
            case 'products':
                await this.renderProductsTable();
                break;
            case 'users':
                await this.renderUsersTable();
                break;
            case 'orders':
                await this.renderOrdersTable();
                break;
            case 'settings':
                await this.renderSiteSettings();
                break;
        }
    },

    async updateStats() {
        const stats = await getStoreStats();
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
    },

    // ============ إعدادات الموقع ============
    async renderSiteSettings() {
        const settings = await getSiteSettings();
        document.getElementById('storeNameInput').value = settings.storeName || '';
        document.getElementById('logoInput').value = settings.logoUrl || '';
        document.getElementById('emailInput').value = settings.email || '';
        document.getElementById('phone1Input').value = settings.phone1 || '';
        document.getElementById('phone2Input').value = settings.phone2 || '';
        document.getElementById('deliveryTimeInput').value = settings.deliveryTime || 5;
    },

    async handleSiteSettingsSubmit() {
        const settingsData = {
            storeName: document.getElementById('storeNameInput').value,
            logoUrl: document.getElementById('logoInput').value,
            email: document.getElementById('emailInput').value,
            phone1: document.getElementById('phone1Input').value,
            phone2: document.getElementById('phone2Input').value,
            deliveryTime: parseInt(document.getElementById('deliveryTimeInput').value)
        };

        const result = await updateSiteSettings(settingsData);

        if (result.success) {
            this.showMessage('تم الحفظ', 'تم حفظ إعدادات الموقع بنجاح!', 'success');
            location.reload();
        } else {
            this.showMessage('خطأ', 'حدث خطأ أثناء حفظ الإعدادات: ' + result.error, 'error');
        }
    },

    // ============ المنتجات ============
    async renderProductsTable() {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">جاري التحميل...</td></tr>';
        
        const products = await loadAllProducts();
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد منتجات حالياً</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td><img src="${getProductImageUrl(product.image)}" class="product-thumb" alt=""></td>
                <td>
                    <div class="product-info-cell">
                        <span class="product-name-cell">${product.name}</span>
                        <small class="product-cat-cell">${product.category || 'بدون فئة'}</small>
                    </div>
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
                        <button class="btn small-btn primary-btn edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn small-btn danger-btn delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // إضافة أحداث الأزرار
        tableBody.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', () => this.showProductModal(btn.dataset.id, products.find(p => p.id === btn.dataset.id)));
        });

        tableBody.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                setupConfirmation('هل أنت متأكد من حذف هذا المنتج؟', async () => {
                    const result = await deleteProductById(btn.dataset.id);
                    if (result.success) {
                        this.renderProductsTable();
                        this.updateStats();
                        this.showMessage('تم الحذف', 'تم حذف المنتج بنجاح', 'success');
                    }
                });
            });
        });
    },

    // ============ المستخدمين ============
    async renderUsersTable() {
        const container = document.getElementById('usersTable');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"></div>';
        
        const users = await getAllUsers();
        
        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>لا يوجد مستخدمين مسجلين</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الصلاحية</th>
                            <th>آخر دخول</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>
                                    <div class="user-cell" style="display: flex; align-items: center; gap: 10px;">
                                        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'U')}" 
                                             class="product-thumb" 
                                             style="border-radius: 50%; width: 40px; height: 40px;">
                                        <span>${user.displayName || 'مستخدم'}</span>
                                    </div>
                                </td>
                                <td>${user.email || 'بدون بريد'}</td>
                                <td>
                                    <span class="product-status ${user.isAdmin ? 'status-active' : 'status-inactive'}">
                                        ${user.isAdmin ? 'مسؤول' : 'مستخدم'}
                                    </span>
                                </td>
                                <td>${formatDate(user.lastLogin)}</td>
                                <td>
                                    <button class="btn small-btn ${user.isAdmin ? 'danger-btn' : 'success-btn'} toggle-admin" 
                                            data-id="${user.id}" 
                                            data-admin="${user.isAdmin}">
                                        ${user.isAdmin ? 'إلغاء مسؤول' : 'تعيين مسؤول'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // إضافة أحداث الأزرار
        container.querySelectorAll('.toggle-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.id;
                const currentIsAdmin = btn.dataset.admin === 'true';
                const confirmMsg = currentIsAdmin 
                    ? 'هل أنت متأكد من إلغاء صلاحية المسؤول عن هذا المستخدم؟' 
                    : 'هل أنت متأكد من تعيين هذا المستخدم كمسؤول؟';
                
                if (confirm(confirmMsg)) {
                    const result = await updateUserAdminStatus(userId, !currentIsAdmin);
                    if (result.success) {
                        this.showMessage('تم التحديث', 'تم تحديث صلاحيات المستخدم بنجاح', 'success');
                        this.renderUsersTable();
                    }
                }
            });
        });
    },

    // ============ الطلبات ============
    async renderOrdersTable() {
        const container = document.getElementById('ordersTable');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"></div>';
        
        // محاكاة بيانات الطلبات
        setTimeout(() => {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>لا توجد طلبات حتى الآن</p>
                    <small>ستظهر الطلبات هنا عندما يقوم العملاء بالشراء</small>
                </div>
            `;
        }, 1000);
    },

    // ============ إدارة المنتجات ============
    showProductModal(productId = null, productData = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        form.reset();
        document.getElementById('editProductId').value = productId || '';
        title.textContent = productId ? 'تعديل المنتج' : 'إضافة منتج جديد';

        // إعادة تعيين معاينة الصورة
        document.getElementById('productImagePreview').classList.add('hidden');
        document.getElementById('productImagePreview').src = '';
        document.getElementById('productImageFile').value = '';
        document.getElementById('productImage').value = '';

        if (productData) {
            document.getElementById('productName').value = productData.name || '';
            document.getElementById('productPrice').value = productData.price || '';
            document.getElementById('productImage').value = productData.image || '';
            document.getElementById('productDescription').value = productData.description || '';
            document.getElementById('productCategory').value = productData.category || 'perfume';
            document.getElementById('productStock').value = productData.stock || 10;
            document.getElementById('isNew').checked = productData.isNew || false;
            document.getElementById('isSale').checked = productData.isSale || false;
            document.getElementById('isBest').checked = productData.isBest || false;
            document.getElementById('isActive').checked = productData.isActive !== false;

            // عرض الصورة الحالية إذا كانت موجودة
            if (productData.image) {
                this.displayImagePreview(productData.image);
            }
        }

        modal.classList.remove('hidden');
    },

    async handleProductSubmit() {
        const productId = document.getElementById('editProductId').value;
        const imageFile = document.getElementById('productImageFile').files[0];
        let imageUrl = document.getElementById('productImage').value;

        // 1. رفع الصورة الجديدة إذا وجدت
        if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const path = `product_images/${fileName}`;
            const uploadResult = await uploadFile(imageFile, path);
            
            if (uploadResult.success) {
                imageUrl = uploadResult.url;
            } else {
                this.showMessage('خطأ في الرفع', 'فشل رفع الصورة: ' + uploadResult.error, 'error');
                return;
            }
        }

        // 2. جمع بيانات المنتج
        const productData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            image: imageUrl,
            description: document.getElementById('productDescription').value,
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            isNew: document.getElementById('isNew').checked,
            isSale: document.getElementById('isSale').checked,
            isBest: document.getElementById('isBest').checked,
            isActive: document.getElementById('isActive').checked
        };

        // 3. التحقق من البيانات المطلوبة
        if (!productData.name || !productData.price) {
            this.showMessage('بيانات ناقصة', 'الرجاء إدخال اسم المنتج والسعر', 'warning');
            return;
        }

        // 4. حفظ البيانات
        let result;
        if (productId) {
            result = await updateExistingProduct(productId, productData);
        } else {
            result = await addNewProduct(productData);
        }

        if (result.success) {
            document.getElementById('productModal').classList.add('hidden');
            this.renderProductsTable();
            this.updateStats();
            this.showMessage('تم الحفظ', productId ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح', 'success');
        } else {
            this.showMessage('خطأ', 'حدث خطأ: ' + result.error, 'error');
        }
    },

    // ============ دوال مساعدة للصور ============
    previewImage(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.displayImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            this.displayImagePreview(null);
        }
    },

    displayImagePreview(url) {
        const preview = document.getElementById('productImagePreview');
        if (url) {
            preview.src = url;
            preview.classList.remove('hidden');
        } else {
            preview.src = '';
            preview.classList.add('hidden');
        }
    },

    // ============ دوال مساعدة للرسائل ============
    showMessage(title, text, type = 'info') {
        const messageModal = document.getElementById('messageModal');
        const messageIcon = document.getElementById('messageIcon');
        const messageTitle = document.getElementById('messageTitle');
        const messageText = document.getElementById('messageText');
        
        // تغيير الأيقونة حسب النوع
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };
        
        messageIcon.className = icons[type] || icons.info;
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageModal.classList.remove('hidden');
        
        // تغيير لون الأيقونة
        const colors = {
            info: '#17a2b8',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };
        
        messageIcon.style.color = colors[type] || colors.info;
    }
};