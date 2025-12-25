// js/admin.js - لوحة الإدارة

import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    query,
    orderBy,
    serverTimestamp,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

import { app, storage } from './firebase.js';
import { showToast } from './cart.js';

let db = null;
let pendingAction = null;

// تهيئة الإدارة
export function initAdmin() {
    console.log('تهيئة لوحة الإدارة...');
    if (!db) db = getFirestore(app);
}

// ============ التخزين السحابي ============

// رفع ملف إلى التخزين السحابي
export async function uploadFile(file, path) {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("خطأ في رفع الملف:", error);
        return { success: false, error: error.message };
    }
}

// ============ المنتجات ============

// جلب جميع المنتجات
export async function loadAllProducts() {
    try {
        if (!db) db = getFirestore(app);
        
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const products = [];
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        
        console.log(`تم جلب ${products.length} منتج للإدارة`);
        return products;
    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
        return [];
    }
}

// إضافة منتج
export async function addNewProduct(productData) {
    try {
        if (!db) db = getFirestore(app);
        
        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('تم إضافة منتج جديد:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("خطأ في إضافة المنتج:", error);
        return { success: false, error: error.message };
    }
}

// تحديث منتج
export async function updateExistingProduct(productId, productData) {
    try {
        if (!db) db = getFirestore(app);
        
        await updateDoc(doc(db, "products", productId), {
            ...productData,
            updatedAt: serverTimestamp()
        });
        console.log('تم تحديث المنتج:', productId);
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث المنتج:", error);
        return { success: false, error: error.message };
    }
}

// حذف منتج
export async function deleteProductById(productId) {
    try {
        if (!db) db = getFirestore(app);
        
        await deleteDoc(doc(db, "products", productId));
        console.log('تم حذف المنتج:', productId);
        return { success: true };
    } catch (error) {
        console.error("خطأ في حذف المنتج:", error);
        return { success: false, error: error.message };
    }
}

// ============ إعدادات الموقع ============

// جلب إعدادات الموقع
export async function getSiteSettings() {
    try {
        if (!db) db = getFirestore(app);
        
        const docRef = doc(db, "settings", "site_config");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // إعدادات افتراضية
            return {
                storeName: "جمالك",
                logoUrl: "https://ui-avatars.com/api/?name=J&background=C89B3C&color=fff",
                email: "support@jamalek.com",
                phone1: "00966500000000",
                phone2: "",
                deliveryTime: 5,
                shippingCost: 0
            };
        }
    } catch (error) {
        console.error("خطأ في جلب الإعدادات:", error);
        return {};
    }
}

// تحديث إعدادات الموقع
export async function updateSiteSettings(settingsData) {
    try {
        if (!db) db = getFirestore(app);
        
        const docRef = doc(db, "settings", "site_config");
        await setDoc(docRef, {
            ...settingsData,
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('تم تحديث إعدادات الموقع');
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث الإعدادات:", error);
        return { success: false, error: error.message };
    }
}

// ============ المستخدمين ============

// جلب المستخدمين
export async function getAllUsers() {
    try {
        if (!db) db = getFirestore(app);
        
        const snapshot = await getDocs(collection(db, "users"));
        const users = [];
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        console.log(`تم جلب ${users.length} مستخدم`);
        return users;
    } catch (error) {
        console.error("خطأ في جلب المستخدمين:", error);
        return [];
    }
}

// تحديث صلاحيات المستخدم
export async function updateUserAdminStatus(userId, isAdmin) {
    try {
        if (!db) db = getFirestore(app);
        
        await updateDoc(doc(db, "users", userId), {
            isAdmin,
            updatedAt: serverTimestamp()
        });
        console.log('تم تحديث صلاحيات المستخدم:', userId, isAdmin);
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث المستخدم:", error);
        return { success: false, error: error.message };
    }
}

// ============ الإحصائيات ============

// جلب الإحصائيات
export async function getStoreStats() {
    try {
        if (!db) db = getFirestore(app);
        
        const productsSnapshot = await getDocs(collection(db, "products"));
        const usersSnapshot = await getDocs(collection(db, "users"));
        
        return {
            totalProducts: productsSnapshot.size,
            totalUsers: usersSnapshot.size,
            totalOrders: 0,
            totalRevenue: 0
        };
    } catch (error) {
        console.error("خطأ في جلب الإحصائيات:", error);
        return {
            totalProducts: 0,
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0
        };
    }
}

// ============ دوال مساعدة ============

// تنسيق التاريخ
export function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('ar-SA', options).format(date);
}

// الحصول على صورة المنتج
export function getProductImageUrl(imageUrl) {
    if (imageUrl && imageUrl.startsWith('http')) {
        return imageUrl;
    }
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&h=300&fit=crop';
}

// إعداد التأكيد
export function setupConfirmation(message, callback) {
    pendingAction = callback;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// تنظيف التأكيد
export function clearConfirmation() {
    pendingAction = null;
    document.getElementById('confirmModal').classList.add('hidden');
}

// تنفيذ الإجراء المؤكد
export function executePendingAction() {
    if (pendingAction) {
        pendingAction();
        clearConfirmation();
    }
}

// عرض رسالة
export function showMessage(title, message, type = 'info') {
    const messageModal = document.getElementById('messageModal');
    const messageIcon = document.getElementById('messageIcon');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    
    // تعيين الأيقونة حسب النوع
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    messageIcon.className = `fas ${icons[type] || icons.info}`;
    messageTitle.textContent = title;
    messageText.textContent = message;
    
    messageModal.classList.remove('hidden');
    
    // إغلاق المودال عند النقر على الزر
    document.getElementById('messageCloseBtn').onclick = () => {
        messageModal.classList.add('hidden');
    };
}