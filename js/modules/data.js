// js/modules/data.js

import { db } from './firebase-config.js';
import { currentUser, isAdmin, logAdminAction } from './auth.js';
import { showCustomToast, showLoading, hideLoading } from './utils.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// بيانات المتجر
export let storeData = {
    settings: {
        storeName: "جمالك",
        whatsapp: "249123456789",
        phone: "+249 123 456 789",
        description: "متجر متخصص في بيع العطور ومستحضرات التجميل الأصلية"
    },
    products: [],
    categories: [
        { id: "featured", name: "المميز", icon: "fa-star" },
        { id: "new", name: "الجديد", icon: "fa-bolt" },
        { id: "sale", name: "العروض", icon: "fa-percentage" },
        { id: "best", name: "الأكثر مبيعاً", icon: "fa-fire" }
    ]
};

// حالة التطبيق
export let currentFilter = 'all';
export let currentSort = 'newest';
export let searchQuery = '';

// =====================================
// وظائف تحميل البيانات
// =====================================

// تحميل البيانات من Firestore
export async function loadStoreData() {
    try {
        // تحميل الإعدادات
        const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
        if (settingsDoc.exists()) {
            storeData.settings = settingsDoc.data();
        }
        
        // تحميل المنتجات
        const productsSnapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        
        storeData.products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            storeData.products.push(product);
        });
        
        console.log('تم تحميل البيانات:', storeData.products.length, 'منتج');
        
        updateStoreUI();
        renderProducts();
        updateCategoryCounts();
        
    } catch (e) {
        console.error('خطأ في تحميل البيانات:', e);
        loadDefaultProducts();
    }
}

// تحميل منتجات افتراضية في حالة فشل الاتصال بـ Firestore
function loadDefaultProducts() {
    // يمكن وضع قائمة منتجات افتراضية هنا
    storeData.products = [
        { id: 'p1', name: 'عطر الورد الجوري', price: 150, category: 'featured', image: 'https://via.placeholder.com/300x300?text=Perfume+1', isSale: true, isNew: false, isBest: true },
        { id: 'p2', name: 'أحمر شفاه مطفي', price: 50, category: 'new', image: 'https://via.placeholder.com/300x300?text=Lipstick+2', isSale: false, isNew: true, isBest: false },
        { id: 'p3', name: 'كريم أساس طبيعي', price: 200, category: 'sale', image: 'https://via.placeholder.com/300x300?text=Foundation+3', isSale: true, isNew: false, isBest: false },
    ];
    updateStoreUI();
    renderProducts();
    updateCategoryCounts();
    showCustomToast("فشل تحميل البيانات من السيرفر. تم عرض بيانات افتراضية.", "warning");
}

// =====================================
// وظائف واجهة المستخدم (البيانات)
// =====================================

// تحديث واجهة المتجر (الروابط، الأسماء، إلخ)
export function updateStoreUI() {
    // تحديث اسم المتجر
    document.querySelectorAll('.store-name-text').forEach(el => {
        el.textContent = storeData.settings.storeName;
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) {
        footerDesc.textContent = storeData.settings.description;
    }
    
    // تحديث روابط الواتساب
    const whatsappLink = `https://wa.me/${storeData.settings.whatsapp}`;
    document.getElementById('contactWhatsappLink')?.setAttribute('href', whatsappLink);
    document.getElementById('mobileWhatsappLink')?.setAttribute('href', whatsappLink);
    document.getElementById('whatsappLinkFooter')?.setAttribute('href', whatsappLink);
    document.getElementById('floatingWhatsapp')?.setAttribute('href', whatsappLink);
    
    // تحديث رقم الهاتف
    document.getElementById('contactPhone')?.textContent = storeData.settings.phone;
}

// عرض المنتجات
export function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    // تطبيق الفلترة والبحث
    let filteredProducts = storeData.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesFilter = true;
        if (currentFilter !== 'all') {
            if (currentFilter === 'featured') matchesFilter = product.isFeatured === true;
            else if (currentFilter === 'new') matchesFilter = product.isNew === true;
            else if (currentFilter === 'sale') matchesFilter = product.isSale === true;
            else if (currentFilter === 'best') matchesFilter = product.isBest === true;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    // تطبيق الفرز
    filteredProducts.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        // الفرز حسب الأحدث (افتراضياً)
        return 0;
    });
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                ${product.isSale ? '<span class="badge sale-badge">عرض</span>' : ''}
                ${product.isNew ? '<span class="badge new-badge">جديد</span>' : ''}
                <button class="wishlist-btn"><i class="far fa-heart"></i></button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">${product.price} ر.س</span>
                    ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ر.س</span>` : ''}
                </div>
                <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
            </div>
        </div>
    `).join('');
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p class="no-results">لا توجد منتجات مطابقة لنتائج البحث أو التصفية.</p>';
    }
}

// تحديث عدادات التصنيفات (لتحسين تجربة المستخدم)
export function updateCategoryCounts() {
    // يمكن تنفيذ منطق تحديث عدد المنتجات لكل تصنيف هنا
}

// =====================================
// وظائف معالجة الأحداث
// =====================================

// معالجة البحث
export function handleProductSearch(e) {
    searchQuery = e.target.value.trim();
    renderProducts();
}

// معالجة التصفية
export function handleFilterChange(e) {
    const newFilter = e.target.dataset.filter;
    if (newFilter === currentFilter) return;
    
    currentFilter = newFilter;
    
    // تحديث حالة الأزرار
    document.querySelectorAll('.cat-btn, .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === newFilter) {
            btn.classList.add('active');
        }
    });
    
    renderProducts();
}

// معالجة الفرز
export function handleSortChange(e) {
    currentSort = e.target.value;
    renderProducts();
}

// =====================================
// وظائف لوحة التحكم (البيانات)
// =====================================

// تحميل منتجات الأدمن
export function loadAdminProducts() {
    if (!isAdmin) return;
    // منطق تحميل وعرض المنتجات في لوحة التحكم
}

// ملء نموذج الإعدادات
export function fillSettingsForm() {
    if (!isAdmin) return;
    
    document.getElementById('storeNameInput').value = storeData.settings.storeName;
    document.getElementById('whatsappInput').value = storeData.settings.whatsapp;
    document.getElementById('phoneInput').value = storeData.settings.phone;
    document.getElementById('descriptionInput').value = storeData.settings.description;
}

// معالجة إرسال نموذج الإعدادات
export async function handleSettingsSubmit(e) {
    e.preventDefault();
    if (!isAdmin) {
        showCustomToast("ليس لديك صلاحية لتعديل الإعدادات", "error");
        return;
    }
    
    const form = e.target;
    const saveBtn = form.querySelector('button[type="submit"]');
    showLoading(saveBtn);
    
    const newSettings = {
        storeName: document.getElementById('storeNameInput').value,
        whatsapp: document.getElementById('whatsappInput').value,
        phone: document.getElementById('phoneInput').value,
        description: document.getElementById('descriptionInput').value,
    };
    
    try {
        // تحديث الإعدادات في Firestore
        await updateDoc(doc(db, 'settings', 'store'), newSettings);
        
        // تحديث البيانات المحلية
        storeData.settings = newSettings;
        updateStoreUI();
        
        await logAdminAction('UPDATE_SETTINGS', newSettings);
        showCustomToast("تم حفظ الإعدادات بنجاح", "success");
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showCustomToast("فشل حفظ الإعدادات. تأكد من قواعد أمان Firestore.", "error");
    } finally {
        hideLoading(saveBtn);
    }
}
