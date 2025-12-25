// js/products.js - عرض المنتجات

import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import { app } from './firebase.js';

let db = null;

// حالة المنتجات
export const ProductsState = {
    products: [],
    filteredProducts: [],
    currentFilter: 'all',
    currentSort: 'newest',
    searchQuery: ''
};

// تهيئة المنتجات
export function initProducts() {
    console.log('تهيئة المنتجات...');
    if (!db) db = getFirestore(app);
}

// تحميل المنتجات
export async function loadProducts() {
    try {
        if (!db) db = getFirestore(app);
        
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
        console.log(`تم تحميل ${ProductsState.products.length} منتج`);
        return ProductsState.products;
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        return [];
    }
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

// الحصول على منتج بواسطة ID
export function getProductById(productId) {
    return ProductsState.products.find(product => product.id === productId);
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