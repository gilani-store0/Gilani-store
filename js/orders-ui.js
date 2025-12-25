// js/orders-ui.js - عرض وإدارة الطلبات

export const OrdersUI = {
    currentStatusFilter: 'all',

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // تصفية الطلبات حسب الحالة
        document.querySelectorAll('.orders-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const status = e.currentTarget.dataset.status;
                this.filterOrdersByStatus(status);
            });
        });
    },

    // عرض طلبات المستخدم
    async renderUserOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        // استخدام بيانات وهمية للاختبار
        const orders = this.getMockOrders();
        
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>لم تقم بتقديم أي طلبات بعد.</p>
                    <a href="#" class="btn primary-btn" data-section="products">
                        <i class="fas fa-store"></i> تصفح المنتجات
                    </a>
                </div>
            `;
            return;
        }

        // تصفية الطلبات حسب الحالة المحددة
        let filteredOrders = orders;
        if (this.currentStatusFilter !== 'all') {
            filteredOrders = orders.filter(order => order.status === this.currentStatusFilter);
        }

        if (filteredOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>لا توجد طلبات في هذه الفئة.</p>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = filteredOrders.map(order => `
            <div class="order-card" data-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h4>طلب #${order.orderNumber}</h4>
                        <span class="order-date">${this.formatDate(order.createdAt)}</span>
                    </div>
                    <span class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span class="item-name">${item.name} × ${item.quantity}</span>
                            <span class="item-price">${item.price * item.quantity} ر.س</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        <span>المجموع:</span>
                        <span class="total-amount">${order.total} ر.س</span>
                    </div>
                    <button class="btn outline-btn view-order-details" data-id="${order.id}">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                </div>
            </div>
        `).join('');

        // إضافة أحداث عرض التفاصيل
        ordersList.querySelectorAll('.view-order-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.id;
                this.showOrderDetails(orderId);
            });
        });
    },

    // عرض جميع الطلبات (للمسؤول)
    async renderAllOrders() {
        const ordersTable = document.getElementById('ordersTable');
        if (!ordersTable) return;

        ordersTable.innerHTML = '<div class="loading-spinner"></div>';

        // استخدام بيانات وهمية للاختبار
        const orders = this.getMockOrders();

        setTimeout(() => {
            if (orders.length === 0) {
                ordersTable.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>لا توجد طلبات حتى الآن</p>
                    </div>
                `;
                return;
            }

            ordersTable.innerHTML = `
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>المستخدم</th>
                                <th>المبلغ</th>
                                <th>الحالة</th>
                                <th>التاريخ</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>${order.orderNumber}</td>
                                    <td>${order.phone || 'غير محدد'}</td>
                                    <td>${order.total} ر.س</td>
                                    <td>
                                        <span class="product-status ${order.status === 'completed' ? 'status-active' : order.status === 'cancelled' ? 'status-inactive' : ''}">
                                            ${this.getStatusText(order.status)}
                                        </span>
                                    </td>
                                    <td>${this.formatDate(order.createdAt)}</td>
                                    <td>
                                        <button class="btn small-btn primary-btn view-order-admin" data-id="${order.id}">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn small-btn danger-btn delete-order" data-id="${order.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // إضافة الأحداث
            ordersTable.querySelectorAll('.view-order-admin').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.currentTarget.dataset.id;
                    this.showAdminOrderDetails(orderId);
                });
            });

            ordersTable.querySelectorAll('.delete-order').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.currentTarget.dataset.id;
                    this.deleteOrder(orderId);
                });
            });
        }, 1000);
    },

    // تصفية الطلبات حسب الحالة
    filterOrdersByStatus(status) {
        this.currentStatusFilter = status;
        
        // تحديث أزرار التبويب
        document.querySelectorAll('.orders-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === status);
        });

        // تصفية وعرض الطلبات
        this.renderUserOrders();
    },

    // عرض تفاصيل الطلب
    showOrderDetails(orderId) {
        const order = this.getMockOrders().find(o => o.id === orderId);
        if (!order) return;

        const modal = this.createModal(`
            <div class="order-details-modal">
                <h3>تفاصيل الطلب #${order.orderNumber}</h3>
                
                <div class="details-section">
                    <h4>معلومات الطلب</h4>
                    <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
                    <p><strong>التاريخ:</strong> ${this.formatDate(order.createdAt)}</p>
                    <p><strong>الحالة:</strong> <span class="status-${order.status}">${this.getStatusText(order.status)}</span></p>
                </div>
                
                <div class="details-section">
                    <h4>عنوان الشحن</h4>
                    <p>${order.shippingAddress || 'غير محدد'}</p>
                    <p><strong>الهاتف:</strong> ${order.phone || 'غير محدد'}</p>
                </div>
                
                <div class="details-section">
                    <h4>المنتجات</h4>
                    <div class="order-items-list">
                        ${order.items.map(item => `
                            <div class="order-item-detail">
                                <span>${item.name}</span>
                                <span>${item.quantity} × ${item.price} ر.س = ${item.quantity * item.price} ر.س</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="details-total">
                    <h4>الملخص</h4>
                    <div class="total-row">
                        <span>المجموع:</span>
                        <span>${order.total} ر.س</span>
                    </div>
                    <div class="total-row">
                        <span>التوصيل:</span>
                        <span>مجاني</span>
                    </div>
                    <div class="total-row final">
                        <span>الإجمالي:</span>
                        <span>${order.total} ر.س</span>
                    </div>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
    },

    // عرض تفاصيل الطلب للمسؤول
    showAdminOrderDetails(orderId) {
        const order = this.getMockOrders().find(o => o.id === orderId);
        if (!order) return;

        const modal = this.createModal(`
            <div class="order-details-modal admin">
                <h3>تفاصيل الطلب #${order.orderNumber}</h3>
                
                <div class="admin-order-info">
                    <div class="info-row">
                        <span>رقم الطلب:</span>
                        <span>${order.orderNumber}</span>
                    </div>
                    <div class="info-row">
                        <span>المستخدم:</span>
                        <span>${order.phone || 'غير محدد'}</span>
                    </div>
                    <div class="info-row">
                        <span>التاريخ:</span>
                        <span>${this.formatDate(order.createdAt)}</span>
                    </div>
                    <div class="info-row">
                        <span>الحالة:</span>
                        <select class="order-status-select" data-order-id="${order.id}">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد التجهيز</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                        </select>
                    </div>
                </div>
                
                <div class="order-items-section">
                    <h4>المنتجات المطلوبة</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>السعر</th>
                                <th>الكمية</th>
                                <th>المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.price} ر.س</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.price * item.quantity} ر.س</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="order-summary">
                    <div class="summary-row">
                        <span>مجموع المنتجات:</span>
                        <span>${order.total} ر.س</span>
                    </div>
                    <div class="summary-row">
                        <span>رسوم الشحن:</span>
                        <span>مجاني</span>
                    </div>
                    <div class="summary-row total">
                        <span>الإجمالي:</span>
                        <span>${order.total} ر.س</span>
                    </div>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
    },

    // حذف الطلب
    async deleteOrder(orderId) {
        if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            console.log('حذف الطلب:', orderId);
            this.showMessage('تم الحذف', 'تم حذف الطلب بنجاح', 'success');
            setTimeout(() => {
                this.renderAllOrders();
            }, 1000);
        }
    },

    // دالة مساعدة: تنسيق التاريخ
    formatDate(date) {
        if (!date) return 'غير محدد';
        
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('ar-SA', options).format(d);
    },

    // دالة مساعدة: نص حالة الطلب
    getStatusText(status) {
        const statusTexts = {
            pending: 'قيد الانتظار',
            processing: 'قيد التجهيز',
            shipped: 'تم الشحن',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        
        return statusTexts[status] || status;
    },

    // دالة مساعدة: إنشاء مودال
    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content medium">
                <div class="modal-header">
                    <h3>تفاصيل الطلب</h3>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn gray-btn close-modal">إغلاق</button>
                </div>
            </div>
        `;

        // إضافة أحداث الإغلاق
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        return modal;
    },

    // دالة مساعدة: بيانات وهمية للطلبات
    getMockOrders() {
        return [
            {
                id: 'order1',
                orderNumber: 'ORD-123456',
                items: [
                    { id: 'p1', name: 'عطر الورد الجوري', price: 150, quantity: 1 },
                    { id: 'p2', name: 'أحمر شفاه ناعم', price: 50, quantity: 2 }
                ],
                total: 250,
                status: 'pending',
                createdAt: new Date('2024-01-15'),
                shippingAddress: 'الرياض - حي النخيل',
                phone: '0501234567'
            },
            {
                id: 'order2',
                orderNumber: 'ORD-123457',
                items: [
                    { id: 'p3', name: 'كريم أساس طبيعي', price: 200, quantity: 1 }
                ],
                total: 200,
                status: 'completed',
                createdAt: new Date('2024-01-10'),
                shippingAddress: 'جدة - حي الصفا',
                phone: '0559876543'
            },
            {
                id: 'order3',
                orderNumber: 'ORD-123458',
                items: [
                    { id: 'p1', name: 'عطر الورد الجوري', price: 150, quantity: 1 },
                    { id: 'p3', name: 'كريم أساس طبيعي', price: 200, quantity: 1 }
                ],
                total: 350,
                status: 'processing',
                createdAt: new Date('2024-01-20'),
                shippingAddress: 'الدمام - حي الفاخرية',
                phone: '0541122334'
            }
        ];
    },

    // دالة مساعدة: عرض رسالة
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
    }
};