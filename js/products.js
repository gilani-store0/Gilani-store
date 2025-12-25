// js/products.js - إدارة المنتجات

import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let db;

export function initProducts(firebaseApp) {
    db = getFirestore(firebaseApp);
}

// حالة المنتجات
export const ProductsState = {
    products: [],
    filteredProducts: [],
    currentFilter: 'all',
    currentSort: 'newest',
    searchQuery: ''
};

// تحميل المنتجات
export async function loadProducts() {
    try {
        const productsSnapshot = await getDocs(
            query(collection(db, 'products'), orderBy('createdAt', 'desc'))
        );
        
        ProductsState.products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            ProductsState.products.push(product);
        });
        
        ProductsState.filteredProducts = [...ProductsState.products];
        return ProductsState.products;
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        return loadDefaultProducts();
    }
}

// تحميل منتجات افتراضية
function loadDefaultProducts() {
    ProductsState.products = [
        { 
            id: 'p1', 
            name: 'عطر الورد الجوري', 
            price: 150, 
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop', 
            description: 'عطر نسائي برائحة الورد الجوري الفاخرة',
            isNew: true,
            category: 'perfume'
        },
        { 
            id: 'p2', 
            name: 'أحمر شفاه ناعم', 
            price: 50, 
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&h=300&fit=crop', 
            description: 'أحمر شفاه طويل الأمد بنسيج ناعم',
            isNew: true,
            category: 'makeup'
        },
        { 
            id: 'p3', 
            name: 'كريم أساس طبيعي', 
            price: 200, 
            image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=300&h=300&fit=crop', 
            description: 'كريم أساس طبيعي للحصول على بشرة متألقة',
            isSale: true,
            category: 'skincare'
        }
    ];
    
    ProductsState.filteredProducts = [...ProductsState.products];
    return ProductsState.products;
}

// تصفية المنتجات
export function filterProducts(filter = 'all') {
    ProductsState.currentFilter = filter;
    
    let filtered = [...ProductsState.products];
    
    if (filter !== 'all') {
        filtered = filtered.filter(product => {
            if (filter === 'new') return product.isNew === true;
            if (filter === 'sale') return product.isSale === true;
            if (filter === 'best') return product.isBest === true;
            return product.category === filter;
        });
    }
    
    if (ProductsState.searchQuery) {
        const query = ProductsState.searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
            product.name?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
        );
    }
    
    ProductsState.filteredProducts = sortProducts(filtered, ProductsState.currentSort);
    return ProductsState.filteredProducts;
}

// ترتيب المنتجات
export function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
        case 'price-low':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'newest':
        default:
            return sorted;
    }
}

// البحث في المنتجات
export function searchProducts(query) {
    ProductsState.searchQuery = query;
    return filterProducts(ProductsState.currentFilter);
}

// تحديث واجهة المتجر
export function updateStoreUI(storeData) {
    if (storeData?.storeName) {
        document.querySelectorAll('.store-name').forEach(el => {
            el.textContent = storeData.storeName;
        });
    }
    
    if (storeData?.description) {
        const descEl = document.getElementById('storeDescription');
        if (descEl) descEl.textContent = storeData.description;
    }
    
    if (storeData?.phone) {
        const phoneEl = document.getElementById('contactPhone');
        if (phoneEl) phoneEl.textContent = storeData.phone;
    }
    
    if (storeData?.whatsapp) {
        const whatsappLink = document.getElementById('whatsappLink');
        if (whatsappLink) {
            whatsappLink.href = `https://wa.me/${storeData.whatsapp}`;
        }
    }
}