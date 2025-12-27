// js/products.js - عرض المنتجات (النسخة المتوافقة)

// حالة المنتجات
const ProductsState = {
    products: [],
    filteredProducts: [],
    currentFilter: 'all',
    currentSort: 'newest',
    searchQuery: '',
    categories: {
        'perfume': 'عطور',
        'makeup': 'مكياج',
        'skincare': 'عناية بالبشرة',
        'haircare': 'عناية بالشعر'
    }
};

// تهيئة المنتجات
function initProducts() {
    console.log('تهيئة المنتجات...');
}

// تحميل المنتجات
async function loadProducts() {
    try {
        if (!window.db) {
            console.warn('Firestore غير متاح، استخدام منتجات افتراضية');
            ProductsState.products = getDefaultProducts();
            ProductsState.filteredProducts = [...ProductsState.products];
            return ProductsState.products;
        }
        
        const snapshot = await window.db.collection('products').orderBy('createdAt', 'desc').get();
        
        ProductsState.products = [];
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            ProductsState.products.push(product);
        });
        
        ProductsState.filteredProducts = [...ProductsState.products];
        console.log(`تم تحميل ${ProductsState.products.length} منتج`);
        return ProductsState.products;
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        
        // استخدام منتجات افتراضية في حالة الخطأ
        ProductsState.products = getDefaultProducts();
        ProductsState.filteredProducts = [...ProductsState.products];
        return ProductsState.products;
    }
}

// تصفية المنتجات
function filterProducts(filter = 'all') {
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
            product.description?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
        );
    }
    
    ProductsState.filteredProducts = sortProducts(filtered, ProductsState.currentSort);
    return ProductsState.filteredProducts;
}

// ترتيب المنتجات
function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
        case 'price-low':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'popular':
            return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'newest':
        default:
            return sorted;
    }
}

// البحث في المنتجات
function searchProducts(query) {
    ProductsState.searchQuery = query;
    return filterProducts(ProductsState.currentFilter);
}

// الحصول على منتج بواسطة ID
function getProductById(productId) {
    return ProductsState.products.find(product => product.id === productId);
}

// الحصول على اسم الفئة
function getCategoryName(category) {
    return ProductsState.categories[category] || category;
}

// منتجات افتراضية
function getDefaultProducts() {
    return [
        {
            id: '1',
            name: 'عطر فاخر للرجال',
            description: 'عطر فاخر برائحة عطرية مميزة للرجال، يدوم طويلاً',
            price: 150,
            oldPrice: 200,
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop',
            isNew: true,
            isBest: true,
            category: 'perfume',
            stock: 25,
            views: 150,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'مكياج سائل عالي الجودة',
            description: 'مكياج سائل عالي الجودة يمنحك مظهراً طبيعياً',
            price: 85,
            image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=300&h=300&fit=crop',
            isSale: true,
            category: 'makeup',
            stock: 40,
            views: 120,
            createdAt: new Date('2024-01-10')
        },
        {
            id: '3',
            name: 'عطر نسائي زهري',
            description: 'عطر نسائي برائحة زهرية مميزة تدوم طوال اليوم',
            price: 200,
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=300&h=300&fit=crop',
            isBest: true,
            category: 'perfume',
            stock: 15,
            views: 180,
            createdAt: new Date('2024-01-05')
        },
        {
            id: '4',
            name: 'كريم ترطيب للبشرة',
            description: 'كريم ترطيب عميق للبشرة، مناسب لجميع أنواع البشرة',
            price: 65,
            image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?q=80&w=300&h=300&fit=crop',
            category: 'skincare',
            stock: 50,
            views: 90,
            createdAt: new Date('2024-01-08')
        },
        {
            id: '5',
            name: 'شامبو للعناية بالشعر',
            description: 'شامبو للعناية بالشعر يمنحه لمعاناً وقوة',
            price: 45,
            oldPrice: 60,
            image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=300&h=300&fit=crop',
            isSale: true,
            category: 'haircare',
            stock: 35,
            views: 110,
            createdAt: new Date('2024-01-12')
        },
        {
            id: '6',
            name: 'ماسكرا طويلة الأمد',
            description: 'ماسكرا طويلة الأمد تمنح رموشك طولاً وكثافة',
            price: 75,
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&h=300&fit=crop',
            isNew: true,
            category: 'makeup',
            stock: 30,
            views: 85,
            createdAt: new Date('2024-01-20')
        }
    ];
}

// جعل الدوال متاحة عالمياً
window.initProducts = initProducts;
window.loadProducts = loadProducts;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.searchProducts = searchProducts;
window.getProductById = getProductById;
window.getCategoryName = getCategoryName;