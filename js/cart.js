// js/cart.js - إدارة سلة التسوق والمفضلة

const CartState = {
    items: [],
    total: 0,
    itemCount: 0,
    shipping: 15,
    freeShippingLimit: 200
};

const WishlistState = {
    items: [],
    itemCount: 0
};

// تهيئة السلة
function initCart() {
    console.log('تهيئة سلة التسوق...');
    
    // تحميل السلة من localStorage
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
    
    // تحميل المفضلة من localStorage
    const savedWishlist = localStorage.getItem('jamalek_wishlist');
    if (savedWishlist) {
        try {
            WishlistState.items = JSON.parse(savedWishlist);
            WishlistState.itemCount = WishlistState.items.length;
        } catch (error) {
            console.error('خطأ في تحميل المفضلة:', error);
            WishlistState.items = [];
            WishlistState.itemCount = 0;
        }
    }
    
    console.log('سلة التسوق جاهزة:', CartState.items.length, 'عناصر');
    console.log('المفضلة جاهزة:', WishlistState.itemCount, 'عناصر');
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

// حفظ المفضلة في التخزين المحلي
function saveWishlistToStorage() {
    localStorage.setItem('jamalek_wishlist', JSON.stringify(WishlistState.items));
}

// تحديث واجهة سلة التسوق
function updateCartUI() {
    // تحديث عداد السلة
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
function addToCart(product, quantity = 1) {
    const existingItem = CartState.items.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        CartState.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
            description: product.description || '',
            category: product.category || 'general',
            quantity: quantity
        });
    }
    
    updateCartStats();
    return true;
}

// إزالة منتج من السلة
function removeFromCart(productId) {
    CartState.items = CartState.items.filter(item => item.id !== productId);
    updateCartStats();
    return true;
}

// تحديث كمية المنتج في السلة
function updateCartQuantity(productId, change) {
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

// إضافة منتج إلى المفضلة
function addToWishlist(product) {
    const existingItem = WishlistState.items.find(item => item.id === product.id);
    
    if (!existingItem) {
        WishlistState.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
            description: product.description,
            category: product.category
        });
        
        WishlistState.itemCount = WishlistState.items.length;
        saveWishlistToStorage();
        updateWishlistUI();
        return true;
    }
    
    return false;
}

// التحقق إذا كان المنتج في المفضلة
function isInWishlist(productId) {
    return WishlistState.items.some(item => item.id === productId);
}

// الحصول على عناصر السلة
function getCartItems() {
    return [...CartState.items];
}

// الحصول على عناصر المفضلة
function getWishlistItems() {
    return [...WishlistState.items];
}

// تفريغ السلة
function clearCart() {
    CartState.items = [];
    updateCartStats();
    return true;
}

// الحصول على إجمالي السعر
function getCartTotal() {
    return CartState.total;
}

// الحصول على تكلفة الشحن
function getShippingCost() {
    return CartState.total >= CartState.freeShippingLimit ? 0 : CartState.shipping;
}

// الحصول على الإجمالي النهائي
function getFinalTotal() {
    return CartState.total + getShippingCost();
}

// الحصول على عدد العناصر في السلة
function getCartItemCount() {
    return CartState.itemCount;
}

// الحصول على عدد العناصر في المفضلة
function getWishlistItemCount() {
    return WishlistState.itemCount;
}

// تحديث تكلفة الشحن
function updateShippingCost(cost) {
    CartState.shipping = cost;
    return cost;
}

// تحديث حد الشحن المجاني
function updateFreeShippingLimit(limit) {
    CartState.freeShippingLimit = limit;
    return limit;
}

// تحديث واجهة المفضلة
function updateWishlistUI() {
    const wishlistCount = document.getElementById('wishlistCount');
    const wishlistMobileCount = document.getElementById('wishlistMobileCount');
    
    if (wishlistCount) {
        if (WishlistState.itemCount > 0) {
            wishlistCount.textContent = WishlistState.itemCount;
            wishlistCount.classList.remove('hidden');
        } else {
            wishlistCount.classList.add('hidden');
        }
    }
    
    if (wishlistMobileCount) {
        if (WishlistState.itemCount > 0) {
            wishlistMobileCount.textContent = WishlistState.itemCount;
            wishlistMobileCount.classList.remove('hidden');
        } else {
            wishlistMobileCount.classList.add('hidden');
        }
    }
}

// عرض إشعار
function showToast(message, isError = false, type = 'info') {
    // إزالة عنصر Toast إذا كان موجوداً
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : type === 'success' ? 'toast-success' : type === 'warning' ? 'toast-warning' : 'toast-info'}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // إخفاء Toast بعد 3 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// جعل الدوال متاحة عالمياً
window.initCart = initCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.addToWishlist = addToWishlist;
window.isInWishlist = isInWishlist;
window.getCartItems = getCartItems;
window.getWishlistItems = getWishlistItems;
window.clearCart = clearCart;
window.getCartTotal = getCartTotal;
window.getShippingCost = getShippingCost;
window.getFinalTotal = getFinalTotal;
window.getCartItemCount = getCartItemCount;
window.getWishlistItemCount = getWishlistItemCount;
window.updateShippingCost = updateShippingCost;
window.updateFreeShippingLimit = updateFreeShippingLimit;
window.showToast = showToast;