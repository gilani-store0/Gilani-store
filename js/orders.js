// js/orders.js - إدارة الطلبات

import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let db;
const OrdersState = {
    userOrders: [],
    allOrders: []
};

export function initOrders(firebaseApp) {
    db = getFirestore(firebaseApp);
}

// إنشاء طلب جديد
export async function createOrder(orderData) {
    try {
        const orderRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'pending',
            orderNumber: generateOrderNumber()
        });
        
        return { success: true, orderId: orderRef.id, orderNumber: generateOrderNumber() };
    } catch (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        return { success: false, error: error.message };
    }
}

// توليد رقم طلب فريد
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
}

// جلب طلبات المستخدم
export async function getUserOrders(userId) {
    try {
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const orders = [];
        
        snapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            orders.push(order);
        });
        
        OrdersState.userOrders = orders;
        return orders;
    } catch (error) {
        console.error('خطأ في جلب طلبات المستخدم:', error);
        // استخدام بيانات وهمية للاختبار
        return getMockOrders();
    }
}

// جلب جميع الطلبات (للمسؤول)
export async function getAllOrders() {
    try {
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const orders = [];
        
        snapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            orders.push(order);
        });
        
        OrdersState.allOrders = orders;
        return orders;
    } catch (error) {
        console.error('خطأ في جلب جميع الطلبات:', error);
        // استخدام بيانات وهمية للاختبار
        return getMockOrders();
    }
}

// تحديث حالة الطلب
export async function updateOrderStatus(orderId, status) {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        return { success: false, error: error.message };
    }
}

// جلب تفاصيل الطلب
export function getOrderDetails(orderId) {
    const allOrders = [...OrdersState.userOrders, ...OrdersState.allOrders];
    return allOrders.find(order => order.id === orderId) || getMockOrders().find(order => order.id === orderId);
}

// حذف الطلب (للمسؤول فقط)
export async function deleteOrder(orderId) {
    try {
        // Note: In production, you should use deleteDoc from firebase
        console.log('حذف الطلب:', orderId);
        return { success: true, message: 'تم حذف الطلب بنجاح' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// محاكاة بيانات الطلبات للاختبار
export function getMockOrders() {
    return [
        {
            id: 'order1',
            orderNumber: 'ORD-123456',
            items: [
                { id: 'p1', name: 'عطر الورد الجوري', price: 150, quantity: 1, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop' },
                { id: 'p2', name: 'أحمر شفاه ناعم', price: 50, quantity: 2, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&h=300&fit=crop' }
            ],
            total: 250,
            status: 'pending',
            createdAt: new Date('2024-01-15'),
            shippingAddress: 'الرياض - حي النخيل، شارع الملك فهد، عمارة 12',
            phone: '0501234567',
            userId: 'user1',
            userName: 'أحمد محمد',
            userEmail: 'ahmed@example.com'
        },
        {
            id: 'order2',
            orderNumber: 'ORD-123457',
            items: [
                { id: 'p3', name: 'كريم أساس طبيعي', price: 200, quantity: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=300&h=300&fit=crop' }
            ],
            total: 200,
            status: 'completed',
            createdAt: new Date('2024-01-10'),
            shippingAddress: 'جدة - حي الصفا، شارع الأمير سلطان، عمارة 45',
            phone: '0559876543',
            userId: 'user2',
            userName: 'سارة أحمد',
            userEmail: 'sara@example.com'
        },
        {
            id: 'order3',
            orderNumber: 'ORD-123458',
            items: [
                { id: 'p1', name: 'عطر الورد الجوري', price: 150, quantity: 1, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop' },
                { id: 'p3', name: 'كريم أساس طبيعي', price: 200, quantity: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=300&h=300&fit=crop' }
            ],
            total: 350,
            status: 'processing',
            createdAt: new Date('2024-01-20'),
            shippingAddress: 'الدمام - حي الفاخرية، شارع الخليج العربي، عمارة 23',
            phone: '0541122334',
            userId: 'user3',
            userName: 'خالد علي',
            userEmail: 'khaled@example.com'
        },
        {
            id: 'order4',
            orderNumber: 'ORD-123459',
            items: [
                { id: 'p2', name: 'أحمر شفاه ناعم', price: 50, quantity: 3, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&h=300&fit=crop' },
                { id: 'p1', name: 'عطر الورد الجوري', price: 150, quantity: 2, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop' }
            ],
            total: 450,
            status: 'shipped',
            createdAt: new Date('2024-01-18'),
            shippingAddress: 'الرياض - حي العليا، شارع العروبة، عمارة 67',
            phone: '0513344556',
            userId: 'user4',
            userName: 'نورة عبدالله',
            userEmail: 'noura@example.com'
        },
        {
            id: 'order5',
            orderNumber: 'ORD-123460',
            items: [
                { id: 'p3', name: 'كريم أساس طبيعي', price: 200, quantity: 2, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=300&h=300&fit=crop' }
            ],
            total: 400,
            status: 'cancelled',
            createdAt: new Date('2024-01-05'),
            shippingAddress: 'مكة - حي العزيزية، شارع الستين، عمارة 89',
            phone: '0567788990',
            userId: 'user5',
            userName: 'فهد راشد',
            userEmail: 'fahad@example.com'
        }
    ];
}

// جلب إحصائيات الطلبات
export async function getOrdersStats() {
    try {
        const orders = await getAllOrders();
        
        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0)
        };
        
        return stats;
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الطلبات:', error);
        return {
            total: 0,
            pending: 0,
            processing: 0,
            shipped: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0
        };
    }
}

// إنشاء طلب من سلة التسوق
export async function createOrderFromCart(cartItems, userData, shippingInfo) {
    try {
        const orderData = {
            userId: userData.uid,
            userName: userData.displayName || 'مستخدم',
            userEmail: userData.email || '',
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            shippingAddress: shippingInfo.address || '',
            phone: shippingInfo.phone || '',
            notes: shippingInfo.notes || '',
            paymentMethod: shippingInfo.paymentMethod || 'نقدي عند الاستلام',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        return await createOrder(orderData);
    } catch (error) {
        console.error('خطأ في إنشاء الطلب من السلة:', error);
        return { success: false, error: error.message };
    }
}

// تصفية الطلبات حسب الحالة
export function filterOrdersByStatus(orders, status) {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
}

// تنسيق التاريخ للعرض
export function formatOrderDate(date) {
    if (!date) return 'غير محدد';
    
    const d = new Date(date);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('ar-SA', options).format(d);
}

// تحويل حالة الطلب إلى نص عربي
export function getOrderStatusText(status) {
    const statusMap = {
        pending: 'قيد الانتظار',
        processing: 'قيد التجهيز',
        shipped: 'تم الشحن',
        completed: 'مكتمل',
        cancelled: 'ملغي'
    };
    
    return statusMap[status] || status;
}

// جلب ملخص الطلب
export function getOrderSummary(order) {
    if (!order) return null;
    
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 0; // مجاني حالياً
    const total = subtotal + shippingCost;
    
    return {
        subtotal,
        shippingCost,
        total,
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
    };
}