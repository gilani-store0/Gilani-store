// js/cart.js - إدارة سلة التسوق

export const CartState = {
    items: [],
    total: 0,
    itemCount: 0
};

// تهيئة السلة
export function initCart() {
    const savedCart = localStorage.getItem('jamalek_cart');
    if (savedCart) {
        try {
            CartState.items = JSON.parse(savedCart);
            updateCartStats();
        } catch (error) {
            console.error('خطأ في تحميل السلة:', error);
            CartState.items = [];
        }
    }
}

// تحديث إحصائيات السلة
function updateCartStats() {
    CartState.itemCount = CartState.items.reduce((sum, item) => sum + item.quantity, 0);
    CartState.total = CartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saveCartToStorage();
    updateCartUI();
}

// حفظ السلة في التخزين المحلي
function saveCartToStorage() {
    localStorage.setItem('jamalek_cart', JSON.stringify(CartState.items));
}

// تحديث واجهة سلة التسوق
function updateCartUI() {
    // تحديث العداد
    const cartCount = document.getElementById('cartCount');
    const cartMobileCount = document.getElementById('cartMobileCount');
    
    if (cartCount) {
        if (CartState.itemCount > 0) {
            cartCount.textContent = CartState.itemCount;
            cartCount.classList.remove('hidden');
        } else {
            cartCount.classList.add('hidden');
        }
    }
    
    if (cartMobileCount) {
        if (CartState.itemCount > 0) {
            cartMobileCount.textContent = CartState.itemCount;
            cartMobileCount.classList.remove('hidden');
        } else {
            cartMobileCount.classList.add('hidden');
        }
    }
}

// إضافة منتج إلى السلة
export function addToCart(product, quantity = 1) {
    const existingItem = CartState.items.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        CartState.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
            quantity: quantity
        });
    }
    
    updateCartStats();
    showToast(`تم إضافة "${product.name}" إلى السلة`);
    return true;
}

// إزالة منتج من السلة
export function removeFromCart(productId) {
    const item = CartState.items.find(item => item.id === productId);
    CartState.items = CartState.items.filter(item => item.id !== productId);
    updateCartStats();
    
    if (item) {
        showToast(`تم إزالة "${item.name}" من السلة`);
    }
    
    return true;
}

// تحديث كمية المنتج
export function updateCartQuantity(productId, change) {
    const item = CartState.items.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            return removeFromCart(productId);
        }
        
        updateCartStats();
        return true;
    }
    
    return false;
}

// الحصول على عناصر السلة
export function getCartItems() {
    return [...CartState.items];
}

// تفريغ السلة
export function clearCart() {
    CartState.items = [];
    updateCartStats();
    showToast('تم تفريغ سلة التسوق');
    return true;
}

// الحصول على إجمالي السعر
export function getCartTotal() {
    return CartState.total;
}

// الحصول على عدد العناصر
export function getCartItemCount() {
    return CartState.itemCount;
}

// عرض إشعار
function showToast(message, isError = false) {
    // إنصراف عنصر Toast إذا كان موجوداً
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // إخفاء Toast بعد 3 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// حفظ السلة للمستخدم (للاستخدام المستقبلي مع Firebase)
export async function saveUserCart(userId) {
    console.log('حفظ سلة المستخدم:', userId, CartState.items);
    return { success: true };
}

// تحميل سلة المستخدم (للاستخدام المستقبلي مع Firebase)
export async function loadUserCart(userId) {
    console.log('تحميل سلة المستخدم:', userId);
    return { success: true, items: [] };
}

// تصدير دالة showToast للاستخدام الخارجي
export { showToast };