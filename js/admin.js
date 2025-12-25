// js/admin.js - إدارة المتجر
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let db;
let pendingAction = null;

export function initAdmin(firebaseApp) {
    db = getFirestore(firebaseApp);
}

// ============ المنتجات ============

// جلب جميع المنتجات
export async function loadAllProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const products = [];
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        
        return products;
    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
        return [];
    }
}

// إضافة منتج
export async function addNewProduct(productData) {
    try {
        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("خطأ في إضافة المنتج:", error);
        return { success: false, error: error.message };
    }
}

// تحديث منتج
export async function updateExistingProduct(productId, productData) {
    try {
        await updateDoc(doc(db, "products", productId), {
            ...productData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("خطأ في تحديث المنتج:", error);
        return { success: false, error: error.message };
    }
}

// حذف منتج
export async function deleteProductById(productId) {
    try {
        await deleteDoc(doc(db, "products", productId));
        return { success: true };
    } catch (error) {
        console.error("خطأ في حذف المنتج:", error);
        return { success: false, error: error.message };
    }
}

// ============ المستخدمين ============

// جلب المستخدمين
export async function getAllUsers() {
    try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = [];
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        return users;
    } catch (error) {
        console.error("خطأ في جلب المستخدمين:", error);
        return [];
    }
}

// تحديث صلاحيات المستخدم
export async function updateUserAdminStatus(userId, isAdmin) {
    try {
        await updateDoc(doc(db, "users", userId), {
            isAdmin,
            updatedAt: serverTimestamp()
        });
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
        const [productsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(collection(db, "products")),
            getDocs(collection(db, "users"))
        ]);
        
        return {
            totalProducts: productsSnapshot.size,
            totalUsers: usersSnapshot.size,
            totalOrders: 0
        };
    } catch (error) {
        console.error("خطأ في جلب الإحصائيات:", error);
        return {
            totalProducts: 0,
            totalUsers: 0,
            totalOrders: 0
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