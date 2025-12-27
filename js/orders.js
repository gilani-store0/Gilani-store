// js/orders.js - نظام الطلبات الكامل

let ordersState = {
    orders: []
};

// تهيئة نظام الطلبات
function initOrders() {
    console.log('تهيئة نظام الطلبات...');
}

// إنشاء طلب جديد
async function createOrder(orderData) {
    try {
        const user = getCurrentUser();
        
        if (!window.db) {
            console.warn('Firestore غير متاح، حفظ محلي');
            return saveOrderLocally(orderData);
        }
        
        const orderRef = window.db.collection("orders").doc();
        
        const order = {
            id: orderRef.id,
            userId: user?.uid || 'guest',
            userEmail: user?.email || 'guest',
            userName: orderData.customerName || user?.displayName || 'ضيف',
            userPhone: orderData.customerPhone,
            userAddress: orderData.customerAddress,
            items: orderData.items || [],
            subtotal: orderData.subtotal || 0,
            shipping: orderData.shipping || 0,
            total: orderData.total || 0,
            status: 'pending',
            paymentMethod: orderData.paymentMethod || 'cash',
            notes: orderData.notes || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await orderRef.set(order);
        
        // تفريغ السلة بعد إنشاء الطلب
        clearCart();
        
        return { 
            success: true, 
            orderId: orderRef.id, 
            order 
        };
        
    } catch (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// جلب طلبات المستخدم
async function getUserOrders(userId) {
    try {
        if (!window.db) {
            return getLocalOrders(userId);
        }
        
        const snapshot = await window.db.collection("orders")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            orders.push(order);
        });
        
        return orders;
    } catch (error) {
        console.error('خطأ في جلب طلبات المستخدم:', error);
        return [];
    }
}

// جلب جميع الطلبات (للإدارة)
async function getAllOrders() {
    try {
        if (!window.db) {
            return [];
        }
        
        const snapshot = await window.db.collection("orders")
            .orderBy("createdAt", "desc")
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            orders.push(order);
        });
        
        return orders;
    } catch (error) {
        console.error('خطأ في جلب جميع الطلبات:', error);
        return [];
    }
}

// تحديث حالة الطلب
async function updateOrderStatus(orderId, status) {
    try {
        if (!window.db) {
            return { success: false };
        }
        
        await window.db.collection("orders").doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// حفظ محلي للطلبات (للضيف)
function saveOrderLocally(orderData) {
    try {
        const order = {
            id: 'local_' + Date.now(),
            ...orderData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        const localOrders = JSON.parse(localStorage.getItem('jamalek_orders') || '[]');
        localOrders.push(order);
        localStorage.setItem('jamalek_orders', JSON.stringify(localOrders));
        
        clearCart();
        
        return { 
            success: true, 
            orderId: order.id, 
            order 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// جلب الطلبات المحلية
function getLocalOrders(userId) {
    try {
        const localOrders = JSON.parse(localStorage.getItem('jamalek_orders') || '[]');
        return localOrders.filter(order => order.userId === userId);
    } catch (error) {
        console.error('خطأ في جلب الطلبات المحلية:', error);
        return [];
    }
}

// إرسال طلب عبر واتساب
function sendOrderViaWhatsApp(order, customerInfo) {
    try {
        const itemsText = order.items.map(item => 
            `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ر.س`
        ).join('%0A');
        
        const message = `🎯 *طلب جديد من متجر QB*%0A%0A`
            + `📋 *رقم الطلب:* ${order.id}%0A`
            + `👤 *العميل:* ${customerInfo.name}%0A`
            + `📞 *الهاتف:* ${customerInfo.phone}%0A`
            + `📍 *العنوان:* ${customerInfo.address}%0A%0A`
            + `🛒 *المنتجات:*%0A${itemsText}%0A%0A`
            + `💰 *الإجمالي:* ${order.total} ر.س%0A`
            + `📝 *ملاحظات:* ${customerInfo.notes || 'لا يوجد'}%0A%0A`
            + `🕒 *التاريخ:* ${new Date().toLocaleString('ar-SA')}`;
        
        const phoneNumber = "249933002015";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        window.open(whatsappUrl, '_blank');
        return { success: true };
    } catch (error) {
        console.error('خطأ في إرسال الطلب عبر واتساب:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// جعل الدوال متاحة عالمياً
window.initOrders = initOrders;
window.createOrder = createOrder;
window.getUserOrders = getUserOrders;
window.getAllOrders = getAllOrders;
window.updateOrderStatus = updateOrderStatus;
window.sendOrderViaWhatsApp = sendOrderViaWhatsApp;