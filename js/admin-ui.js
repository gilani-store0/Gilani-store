// js/admin-ui.js - واجهة لوحة التحكم
import { 
    loadAllProducts, 
    addNewProduct, 
    updateExistingProduct, 
    deleteProductById, 
    getAllUsers, 
    updateUserAdminStatus, 
    getStoreStats,
    formatDate,
    getProductImageUrl,
    setupConfirmation,
    executePendingAction,
    clearConfirmation
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

        // إضافة منتج
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });

        // إغلاق المودال
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('productModal').classList.add('hidden');
                document.getElementById('confirmModal').classList.add('hidden');
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
                // يمكن إضافة إدارة الطلبات لاحقاً
                break;
        }
    },

    async updateStats() {
        const stats = await getStoreStats();
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
    },

    async renderProductsTable() {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">جاري التحميل...</td></tr>';
        
        const products = await loadAllProducts();
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد منتجات حالياً</td></tr>';
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
                    }
                });
            });
        });
    },

    async renderUsersTable() {
        const container = document.getElementById('usersTable');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"></div>';
        
        const users = await getAllUsers();
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-center">لا يوجد مستخدمين مسجلين</p>';
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
                                    <div class="user-cell">
                                        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'U')}" class="product-thumb" style="border-radius: 50%">
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
                                    <button class="btn small-btn ${user.isAdmin ? 'danger-btn' : 'success-btn'} toggle-admin" data-id="${user.id}" data-admin="${user.isAdmin}">
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
                const result = await updateUserAdminStatus(userId, !currentIsAdmin);
                if (result.success) {
                    this.renderUsersTable();
                }
            });
        });
    },

    showProductModal(productId = null, productData = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        form.reset();
        document.getElementById('editProductId').value = productId || '';
        title.textContent = productId ? 'تعديل المنتج' : 'إضافة منتج جديد';

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
        }

        modal.classList.remove('hidden');
    },

    async handleProductSubmit() {
        const productId = document.getElementById('editProductId').value;
        const productData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value,
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value),
            isNew: document.getElementById('isNew').checked,
            isSale: document.getElementById('isSale').checked,
            isBest: document.getElementById('isBest').checked,
            isActive: document.getElementById('isActive').checked
        };

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
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
};
