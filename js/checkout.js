// js/checkout.js - نظام إتمام الشراء

function initCheckout() {
    console.log('تهيئة نظام إتمام الشراء...');
}

// عرض نموذج إتمام الشراء
function showCheckoutForm() {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        showToast('سلة التسوق فارغة', true);
        return;
    }
    
    // إخفاء قسم السلة
    document.getElementById('cartSection').classList.add('hidden');
    
    // إنشاء قسم الشراء
    const checkoutHTML = `
        <section id="checkoutSection" class="checkout-section">
            <div class="container">
                <div class="checkout-steps">
                    <div class="checkout-step active">1. بيانات العميل</div>
                    <div class="checkout-step">2. تأكيد الطلب</div>
                    <div class="checkout-step">3. الإتمام</div>
                </div>
                
                <div class="checkout-content">
                    <div class="checkout-form">
                        <div class="checkout-form-card" id="customerInfoForm">
                            <h3><i class="fas fa-user"></i> بيانات العميل</h3>
                            <form id="checkoutCustomerForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>الاسم الكامل *</label>
                                        <input type="text" id="checkoutName" required>
                                    </div>
                                    <div class="form-group">
                                        <label>رقم الهاتف *</label>
                                        <input type="tel" id="checkoutPhone" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>العنوان بالتفصيل *</label>
                                    <textarea id="checkoutAddress" rows="3" required></textarea>
                                </div>
                                <div class="form-group">
                                    <label>ملاحظات إضافية</label>
                                    <textarea id="checkoutNotes" rows="2"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>طريقة الدفع</label>
                                    <div class="payment-methods">
                                        <label class="payment-method selected">
                                            <input type="radio" name="paymentMethod" value="cash" checked>
                                            <i class="fas fa-money-bill-wave"></i>
                                            <span>الدفع عند الاستلام</span>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" class="btn primary-btn w-100">
                                    <i class="fas fa-arrow-right"></i> التالي
                                </button>
                            </form>
                        </div>
                        
                        <div class="checkout-form-card hidden" id="orderReviewForm">
                            <h3><i class="fas fa-check-circle"></i> تأكيد الطلب</h3>
                            <div id="orderReviewContent"></div>
                            <div class="form-actions mt-20">
                                <button id="confirmOrderBtn" class="btn success-btn w-100">
                                    <i class="fas fa-check"></i> تأكيد الطلب
                                </button>
                                <button id="backToCustomerInfo" class="btn outline-btn w-100 mt-10">
                                    <i class="fas fa-arrow-right"></i> العودة للبيانات
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-card">
                            <h3><i class="fas fa-receipt"></i> ملخص الطلب</h3>
                            <div class="summary-details">
                                <div class="summary-row">
                                    <span>عدد المنتجات:</span>
                                    <span>${getCartItemCount()}</span>
                                </div>
                                <div class="summary-row">
                                    <span>المجموع الجزئي:</span>
                                    <span>${getCartTotal().toFixed(2)} ر.س</span>
                                </div>
                                <div class="summary-row">
                                    <span>التوصيل:</span>
                                    <span>${getShippingCost() === 0 ? 'مجاني' : getShippingCost().toFixed(2) + ' ر.س'}</span>
                                </div>
                                <div class="summary-row total">
                                    <span>الإجمالي النهائي:</span>
                                    <span class="total-amount">${getFinalTotal().toFixed(2)} ر.س</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    // إضافة قسم الشراء
    document.getElementById('cartSection').insertAdjacentHTML('afterend', checkoutHTML);
    document.getElementById('checkoutSection').classList.remove('hidden');
    
    // إعداد المستمعين
    setupCheckoutEventListeners();
}

// إعداد مستمعي أحداث الشراء
function setupCheckoutEventListeners() {
    // نموذج بيانات العميل
    const customerForm = document.getElementById('checkoutCustomerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            proceedToOrderReview();
        });
    }
    
    // زر العودة
    const backBtn = document.getElementById('backToCustomerInfo');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            document.getElementById('customerInfoForm').classList.remove('hidden');
            document.getElementById('orderReviewForm').classList.add('hidden');
            updateCheckoutStep(1);
        });
    }
    
    // زر تأكيد الطلب
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', completeOrder);
    }
    
    // طرق الدفع
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('selected');
            });
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
}

// الانتقال إلى مراجعة الطلب
function proceedToOrderReview() {
    // جمع بيانات العميل
    const customerInfo = {
        name: document.getElementById('checkoutName').value,
        phone: document.getElementById('checkoutPhone').value,
        address: document.getElementById('checkoutAddress').value,
        notes: document.getElementById('checkoutNotes').value,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value
    };
    
    // التحقق من صحة البيانات
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        showToast('يرجى ملء جميع الحقول المطلوبة', true);
        return;
    }
    
    // تحديث خطوات الشراء
    updateCheckoutStep(2);
    
    // عرض مراجعة الطلب
    const cartItems = getCartItems();
    const reviewHTML = `
        <div class="customer-info-review">
            <h4>بيانات العميل:</h4>
            <p><strong>الاسم:</strong> ${customerInfo.name}</p>
            <p><strong>الهاتف:</strong> ${customerInfo.phone}</p>
            <p><strong>العنوان:</strong> ${customerInfo.address}</p>
            ${customerInfo.notes ? `<p><strong>ملاحظات:</strong> ${customerInfo.notes}</p>` : ''}
            <p><strong>طريقة الدفع:</strong> الدفع عند الاستلام</p>
        </div>
        
        <div class="order-items-review mt-20">
            <h4>المنتجات:</h4>
            ${cartItems.map(item => `
                <div class="order-item-review">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} ر.س</span>
                </div>
            `).join('')}
        </div>
        
        <div class="order-total-review mt-20">
            <div class="summary-row">
                <span>المجموع:</span>
                <span>${getCartTotal().toFixed(2)} ر.س</span>
            </div>
            <div class="summary-row">
                <span>التوصيل:</span>
                <span>${getShippingCost() === 0 ? 'مجاني' : getShippingCost().toFixed(2) + ' ر.س'}</span>
            </div>
            <div class="summary-row total">
                <span>الإجمالي:</span>
                <span>${getFinalTotal().toFixed(2)} ر.س</span>
            </div>
        </div>
    `;
    
    document.getElementById('orderReviewContent').innerHTML = reviewHTML;
    document.getElementById('customerInfoForm').classList.add('hidden');
    document.getElementById('orderReviewForm').classList.remove('hidden');
}

// إكمال الطلب
async function completeOrder() {
    try {
        const customerInfo = {
            name: document.getElementById('checkoutName').value,
            phone: document.getElementById('checkoutPhone').value,
            address: document.getElementById('checkoutAddress').value,
            notes: document.getElementById('checkoutNotes').value,
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value
        };
        
        const orderData = {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerAddress: customerInfo.address,
            items: getCartItems(),
            subtotal: getCartTotal(),
            shipping: getShippingCost(),
            total: getFinalTotal(),
            paymentMethod: customerInfo.paymentMethod,
            notes: customerInfo.notes
        };
        
        // إنشاء الطلب
        const result = await createOrder(orderData);
        
        if (result.success) {
            // تحديث الخطوة الثالثة
            updateCheckoutStep(3);
            
            // عرض رسالة النجاح
            document.getElementById('orderReviewForm').innerHTML = `
                <div class="text-center">
                    <i class="fas fa-check-circle success-icon" style="font-size: 64px;"></i>
                    <h3>تم إنشاء الطلب بنجاح!</h3>
                    <p>رقم الطلب: <strong>${result.orderId}</strong></p>
                    <p>سيتم التواصل معك قريباً لتأكيد الطلب.</p>
                    
                    <div class="mt-30">
                        <button id="sendWhatsAppBtn" class="btn success-btn">
                            <i class="fab fa-whatsapp"></i> إرسال الطلب عبر واتساب
                        </button>
                        <button id="backToHome" class="btn outline-btn mt-10">
                            <i class="fas fa-home"></i> العودة للرئيسية
                        </button>
                    </div>
                </div>
            `;
            
            // إعداد زر واتساب
            document.getElementById('sendWhatsAppBtn').addEventListener('click', function() {
                sendOrderViaWhatsApp(result.order, customerInfo);
            });
            
            document.getElementById('backToHome').addEventListener('click', function() {
                location.reload();
            });
            
        } else {
            showToast('خطأ في إنشاء الطلب: ' + result.error, true);
        }
    } catch (error) {
        console.error('خطأ في إكمال الطلب:', error);
        showToast('حدث خطأ أثناء إنشاء الطلب', true);
    }
}

// تحديث خطوات الشراء
function updateCheckoutStep(step) {
    const steps = document.querySelectorAll('.checkout-step');
    steps.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
}

// جعل الدوال متاحة عالمياً
window.initCheckout = initCheckout;
window.showCheckoutForm = showCheckoutForm;
window.updateCheckoutStep = updateCheckoutStep;

