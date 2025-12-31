// main.js - النسخة الكاملة المعدلة مع نظام تسجيل مستخدمين جديد

// ======================== تهيئة التطبيق ========================

let currentUser = null;
let isGuest = false;
let isAdmin = false;
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let allProducts = [];
let siteCurrency = 'ر.س';
let siteSettings = {};

// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1vNmCapPK0MI4H_Q0ilO7OnOgZa02jx0",
    authDomain: "queen-beauty-b811b.firebaseapp.com",
    projectId: "queen-beauty-b811b",
    storageBucket: "queen-beauty-b811b.firebasestorage.app",
    messagingSenderId: "418964206430",
    appId: "1:418964206430:web:8c9451fc56ca7f956bd5cf"
};

let app, auth, db;

// بدء التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 بدء تحميل تطبيق Queen Beauty...');
    
    try {
        // تهيئة Firebase
        app = window.firebaseModules.initializeApp(firebaseConfig);
        auth = window.firebaseModules.getAuth(app);
        db = window.firebaseModules.getFirestore(app);
        
        console.log('✅ Firebase مهيأ بنجاح');
        
        // تحميل إعدادات الموقع
        await loadSiteConfig();
        
        // إعداد جميع الأحداث
        setupAllEventListeners();
        setupRegistrationEventListeners();
        
        // التحقق من المستخدم الحالي
        await checkCurrentUser();
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة Firebase:', error);
        // الاستمرار في وضع الضيف حتى بدون Firebase
        setupAllEventListeners();
        setupRegistrationEventListeners();
        checkCurrentUser();
    }
});

// ======================== إدارة المستخدمين ========================

// تسجيل الدخول كضيف
function signInAsGuest() {
    console.log('👤 تسجيل الدخول كضيف...');
    
    currentUser = {
        uid: 'guest_' + Date.now(),
        displayName: 'زائر',
        email: null,
        photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        isGuest: true
    };
    
    isGuest = true;
    isAdmin = false;
    
    // حفظ بيانات المستخدم
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // إخفاء زر المدير
    updateAdminButton();
    
    // إظهار التطبيق الرئيسي
    showMainApp();
    updateUserProfile();
    loadProducts();
    updateCartCount();
    
    showToast('مرحباً بك يا زائر! يمكنك التسوق الآن', 'success');
}

// تسجيل الدخول بـ Google
async function signInWithGoogle() {
    try {
        console.log('🔑 تسجيل الدخول بـ Google...');
        
        const provider = new window.firebaseModules.GoogleAuthProvider();
        const result = await window.firebaseModules.signInWithPopup(auth, provider);
        
        currentUser = result.user;
        isGuest = false;
        
        // التحقق إذا كان المستخدم جديداً
        await checkAndCreateUserInFirestore(currentUser);
        
        // التحقق من صلاحيات المدير
        await checkAdminPermissions(currentUser.uid);

        // حفظ بيانات المستخدم مع حالة الأدمن
        localStorage.setItem('currentUser', JSON.stringify({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            isGuest: false,
            isAdmin: isAdmin
        }));
        
        showMainApp();
        updateUserProfile();
        loadProducts();
        updateCartCount();
        
        showToast(`مرحباً بك ${currentUser.displayName}!`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول بـ Google:', error);
        showToast('حدث خطأ في تسجيل الدخول', 'error');
    }
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, name, phone = '') {
    try {
        console.log('📝 إنشاء حساب جديد...');
        
        // التحقق من المدخلات
        if (!email || !password || !name) {
            showToast('الرجاء ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
            return;
        }
        
        if (!validateEmail(email)) {
            showToast('البريد الإلكتروني غير صالح', 'warning');
            return;
        }
        
        // 1. إنشاء المستخدم في Firebase Authentication
        console.log('🔐 إنشاء مستخدم في Firebase Auth...');
        const result = await window.firebaseModules.createUserWithEmailAndPassword(auth, email, password);
        
        // 2. تحديث ملف تعريف المستخدم في Auth
        console.log('👤 تحديث ملف تعريف المستخدم...');
        await window.firebaseModules.updateProfile(result.user, {
            displayName: name,
            photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });
        
        currentUser = result.user;
        isGuest = false;
        isAdmin = false;
        
        // 3. إنشاء وثيقة المستخدم في Firestore
        console.log('💾 حفظ بيانات المستخدم في Firestore...');
        const userData = {
            email: email,
            name: name,
            phone: phone,
            address: '',
            photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            role: 'user',
            isAdmin: false,
            isGuest: false,
            isActive: true,
            totalOrders: 0,
            totalSpent: 0,
            favorites: [],
            createdAt: window.firebaseModules.serverTimestamp(),
            updatedAt: window.firebaseModules.serverTimestamp()
        };
        
        const userRef = window.firebaseModules.doc(db, "users", currentUser.uid);
        await window.firebaseModules.setDoc(userRef, userData);
        
        console.log('✅ تم إنشاء حساب المستخدم بنجاح في قاعدة البيانات');
        
        // 4. حفظ بيانات المستخدم في localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            uid: currentUser.uid,
            displayName: name,
            email: email,
            photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            isGuest: false,
            isAdmin: false,
            role: 'user'
        }));
        
        // 5. إظهار التطبيق الرئيسي
        showMainApp();
        updateUserProfile();
        loadProducts();
        updateCartCount();
        updateAdminButton();
        
        // 6. إرسال إشعار نجاح
        showToast(`تم إنشاء حسابك بنجاح ${name}!`, 'success');
        
        // 7. إخفاء نموذج التسجيل
        hideEmailAuthForm();
        
        // 8. تحديث الإحصائيات في لوحة التحكم (إذا كان المستخدم أدمن)
        if (isAdmin && db) {
            setTimeout(() => {
                window.firebaseModules.updateDoc(
                    window.firebaseModules.doc(db, "stats", "users"),
                    {
                        totalUsers: window.firebaseModules.increment(1),
                        updatedAt: window.firebaseModules.serverTimestamp()
                    },
                    { merge: true }
                );
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الحساب:', error);
        
        // رسائل خطأ محددة
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'عملية إنشاء الحساب غير مسموحة';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالشبكة';
                break;
        }
        
        showToast(errorMessage, 'error');
    }
}

// تسجيل الدخول بالبريد
async function signInWithEmail(email, password) {
    try {
        console.log('📧 تسجيل الدخول بالبريد...');
        
        const result = await window.firebaseModules.signInWithEmailAndPassword(auth, email, password);
        
        currentUser = result.user;
        isGuest = false;
        
        // التحقق من وجود المستخدم في قاعدة البيانات
        await checkAndUpdateUserInFirestore(currentUser);
        
        // التحقق من صلاحيات المدير
        await checkAdminPermissions(currentUser.uid);
        
        // حفظ بيانات المستخدم مع حالة الأدمن
        localStorage.setItem('currentUser', JSON.stringify({
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            email: currentUser.email,
            photoURL: currentUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            isGuest: false,
            isAdmin: isAdmin
        }));
        
        showMainApp();
        updateUserProfile();
        loadProducts();
        updateCartCount();
        updateAdminButton();
        
        showToast(`مرحباً بعودتك ${currentUser.displayName}!`, 'success');
        
        hideEmailAuthForm();
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        
        let errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'المستخدم غير موجود';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/user-disabled':
                errorMessage = 'تم تعطيل هذا الحساب';
                break;
        }
        
        showToast(errorMessage, 'error');
    }
}

// التحقق وتحديث بيانات المستخدم في Firestore
async function checkAndUpdateUserInFirestore(user) {
    try {
        const userRef = window.firebaseModules.doc(db, "users", user.uid);
        const userDoc = await window.firebaseModules.getDoc(userRef);
        
        if (!userDoc.exists()) {
            // إنشاء المستخدم في Firestore إذا لم يكن موجوداً
            console.log('👤 إنشاء مستخدم جديد في Firestore...');
            
            const userData = {
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                phone: '',
                address: '',
                photoURL: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                role: 'user',
                isAdmin: false,
                isGuest: false,
                isActive: true,
                totalOrders: 0,
                totalSpent: 0,
                favorites: [],
                createdAt: window.firebaseModules.serverTimestamp(),
                updatedAt: window.firebaseModules.serverTimestamp()
            };
            
            await window.firebaseModules.setDoc(userRef, userData);
            console.log('✅ تم إنشاء المستخدم في Firestore');
        } else {
            // تحديث آخر مرة دخول
            await window.firebaseModules.updateDoc(userRef, {
                lastLogin: window.firebaseModules.serverTimestamp(),
                updatedAt: window.firebaseModules.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
    }
}

// التحقق وتهيئة المستخدم في Firestore
async function checkAndCreateUserInFirestore(user) {
    try {
        const userDoc = await window.firebaseModules.getDoc(
            window.firebaseModules.doc(db, "users", user.uid)
        );
        
        if (!userDoc.exists()) {
            await window.firebaseModules.setDoc(
                window.firebaseModules.doc(db, "users", user.uid), 
                {
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    phone: '',
                    address: '',
                    photoURL: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                    role: 'user',
                    isAdmin: false,
                    isGuest: false,
                    totalOrders: 0,
                    totalSpent: 0,
                    favorites: [],
                    createdAt: window.firebaseModules.serverTimestamp(),
                    updatedAt: window.firebaseModules.serverTimestamp()
                }
            );
        }
    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
    }
}

// التحقق من صلاحيات المدير
async function checkAdminPermissions(userId) {
    console.log('🔍 التحقق من صلاحيات المدير للمستخدم:', userId);
    
    try {
        if (!db) {
            isAdmin = false;
            console.log('❌ قاعدة البيانات غير متاحة');
            return false;
        }
        
        const userRef = window.firebaseModules.doc(db, "users", userId);
        const userSnap = await window.firebaseModules.getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('📄 بيانات المستخدم:', userData);
            
            if (userData.isAdmin === true || userData.role === 'admin') {
                isAdmin = true;
                console.log('✅ المستخدم أدمن');
            } else {
                isAdmin = false;
                console.log('❌ المستخدم ليس أدمن');
            }
        } else {
            console.log('⚠️ المستخدم غير موجود في قاعدة البيانات');
            isAdmin = false;
        }
        
        // تحديث زر الأدمن
        updateAdminButton();
        
        return isAdmin;
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من صلاحيات المستخدم:', error);
        isAdmin = false;
        updateAdminButton();
        return false;
    }
}

// تحديث زر الأدمن في الواجهة
function updateAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    const adminMobileLink = document.getElementById('adminMobileLink');
    
    console.log('🔄 تحديث زر الأدمن - حالة isAdmin:', isAdmin);
    
    if (adminBtn) {
        if (isAdmin && !isGuest) {
            adminBtn.style.display = 'flex';
            adminBtn.style.alignItems = 'center';
            adminBtn.style.justifyContent = 'center';
            console.log('✅ زر الأدمن معروض');
        } else {
            adminBtn.style.display = 'none';
            console.log('❌ زر الأدمن مخفي');
        }
    }
    
    if (adminMobileLink) {
        if (isAdmin && !isGuest) {
            adminMobileLink.style.display = 'block';
            console.log('✅ رابط الأدمن في الموبايل معروض');
        } else {
            adminMobileLink.style.display = 'none';
            console.log('❌ رابط الأدمن في الموبايل مخفي');
        }
    }
}

// تسجيل الخروج
function signOutUser() {
    console.log('🚪 تسجيل الخروج...');
    
    if (!isGuest) {
        window.firebaseModules.signOut(auth);
    }
    
    // مسح بيانات المستخدم
    localStorage.removeItem('currentUser');
    currentUser = null;
    isGuest = false;
    isAdmin = false;
    
    // إخفاء زر المدير
    updateAdminButton();
    
    // العودة لشاشة المصادقة
    showAuthScreen();
    
    showToast('تم تسجيل الخروج بنجاح', 'success');
}

// التحقق من المستخدم الحالي
async function checkCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            
            if (userData.isGuest) {
                // مستخدم ضيف
                currentUser = userData;
                isGuest = true;
                isAdmin = false;
                showMainApp();
                updateUserProfile();
                loadProducts();
                updateCartCount();
                
                // إخفاء زر المدير
                updateAdminButton();
            } else {
                // مستخدم مسجل
                currentUser = userData;
                isGuest = false;
                isAdmin = userData.isAdmin || false;
                
                // محاولة تحديث الصلاحيات من Firebase إذا كان متاحاً
                if (auth?.currentUser) {
                    currentUser = auth.currentUser;
                    await checkAdminPermissions(currentUser.uid);
                }
                
                showMainApp();
                updateUserProfile();
                loadProducts();
                updateCartCount();
                updateAdminButton();
            }
        } catch (e) {
            console.log('خطأ في تحليل بيانات المستخدم:', e);
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
}

// ======================== إدارة المنتجات ========================

// تحميل المنتجات
async function loadProducts() {
    console.log('🛍️ جاري تحميل المنتجات من Firebase...');
    
    try {
        if (!db) {
            console.log('❌ قاعدة البيانات غير متاحة، جارٍ تحميل بيانات تجريبية...');
            displaySampleProducts();
            return;
        }
        
        const productsRef = window.firebaseModules.collection(db, "products");
        const q = window.firebaseModules.query(
            productsRef, 
            window.firebaseModules.where("isActive", "==", true)
        );
        
        const querySnapshot = await window.firebaseModules.getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('⚠️ لا توجد منتجات في قاعدة البيانات');
            displaySampleProducts();
            return;
        }
        
        allProducts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'بدون اسم',
                price: data.price || 0,
                originalPrice: data.originalPrice || null,
                image: data.image || 'https://via.placeholder.com/300x200?text=صورة',
                category: data.category || 'غير مصنف',
                stock: data.stock || 0,
                description: data.description || '',
                isNew: data.isNew || false,
                isSale: data.isSale || false,
                isBest: data.isBest || false,
                isActive: data.isActive !== false,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            };
        });
        
        console.log(`✅ تم تحميل ${allProducts.length} منتج من Firebase`);
        
        displayProducts();
        displayFeaturedProducts();
        
        // اختبار: البحث عن المنتج المحدد 7suAJZDW7qqDMho1922R
        const testProduct = allProducts.find(p => p.id === '7suAJZDW7qqDMho1922R');
        if (testProduct) {
            console.log('✅ المنتج 7suAJZDW7qqDMho1922R موجود:', testProduct.name);
        } else {
            console.log('❌ المنتج 7suAJZDW7qqDMho1922R غير موجود في النتائج');
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات من Firebase:', error);
        console.error('تفاصيل الخطأ:', error.message, error.code);
        displaySampleProducts();
    }
}

// عرض المنتجات
function displayProducts(products = allProducts) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">لا توجد منتجات متاحة حالياً</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => {
        const isNew = product.isNew === true || product.isNew === 'true';
        const isSale = product.isSale === true || product.isSale === 'true';
        const isBest = product.isBest === true || product.isBest === 'true';
        const isInFavorites = favorites.some(f => f.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=صورة'">
                    ${isNew ? '<div class="badge new">جديد</div>' : ''}
                    ${isSale ? '<div class="badge sale">عرض</div>' : ''}
                    ${isBest ? '<div class="badge best">الأفضل</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price">
                        <span class="current-price">${product.price} ${siteCurrency}</span>
                        ${product.originalPrice ? `<span class="original-price">${product.originalPrice} ${siteCurrency}</span>` : ''}
                    </div>
                    <div class="product-stock">
                        <span>المخزون: ${product.stock || 0}</span>
                    </div>
                    <div class="product-actions">
                        <button class="action-btn add-to-cart" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i> أضف للسلة
                        </button>
                        <button class="action-btn favorite-btn ${isInFavorites ? 'active' : ''}" onclick="toggleFavorite('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// عرض المنتجات المميزة
function displayFeaturedProducts() {
    const featuredGrid = document.getElementById('featuredProductsGrid');
    if (!featuredGrid) return;
    
    const featuredProducts = allProducts.filter(p => 
        p.isBest === true || p.isBest === 'true'
    ).slice(0, 6);
    
    if (featuredProducts.length === 0) {
        featuredGrid.innerHTML = '<p class="no-products">لا توجد منتجات مميزة حالياً</p>';
        return;
    }
    
    featuredGrid.innerHTML = featuredProducts.map(product => {
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=صورة'">
                    <div class="badge best">الأفضل</div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${product.price} ${siteCurrency}</span>
                    </div>
                    <div class="product-actions">
                        <button class="action-btn add-to-cart" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// منتجات تجريبية
function displaySampleProducts() {
    console.log('📦 عرض منتجات تجريبية...');
    
    const sampleProducts = [
        {
            id: '1',
            name: 'عطر فاخر - رائحة المسك',
            price: 199,
            originalPrice: 249,
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            category: 'perfume',
            stock: 10,
            isNew: true,
            isBest: true,
            description: 'عطر فاخر برائحة المسك الطبيعية'
        },
        {
            id: '2',
            name: 'مكياج سائل - اللون الطبيعي',
            price: 89,
            image: 'https://images.unsplash.com/photo-1522338242990-e1a0f6e39c13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            category: 'makeup',
            stock: 15,
            isSale: true,
            description: 'مكياج سائل طبيعي يدوم طويلاً'
        },
        {
            id: '3',
            name: 'كريم ترطيب البشرة',
            price: 120,
            image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            category: 'skincare',
            stock: 20,
            isBest: true,
            description: 'كريم ترطيب عميق للبشرة'
        },
        {
            id: '4',
            name: 'شامبو للشعر الجاف',
            price: 75,
            originalPrice: 95,
            image: 'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            category: 'haircare',
            stock: 25,
            isSale: true,
            description: 'شامبو مخصص للشعر الجاف والمتقصف'
        }
    ];
    
    allProducts = sampleProducts;
    displayProducts();
    displayFeaturedProducts();
}

// ======================== إدارة السلة ========================

// إضافة منتج للسلة
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('المنتج غير موجود', 'error');
        return;
    }
    
    // التحقق من المخزون
    if (product.stock <= 0) {
        showToast('المنتج غير متوفر في المخزون', 'warning');
        return;
    }
    
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        // التحقق من توفر الكمية في المخزون
        if (existingItem.quantity >= product.stock) {
            showToast('لا توجد كمية متاحة إضافية في المخزون', 'warning');
            return;
        }
        existingItem.quantity++;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            quantity: 1,
            stock: product.stock
        });
    }
    
    // حفظ السلة في localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // تحديث العدادات
    updateCartCount();
    
    // تحديث عرض السلة إذا كانت مفتوحة
    if (document.getElementById('cart').classList.contains('active')) {
        updateCartDisplay();
    }
    
    showToast('تمت إضافة المنتج إلى السلة', 'success');
}

// تحديث عدد العناصر في السلة
function updateCartCount() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// تحديث عرض السلة
function updateCartDisplay() {
    const cartItemsElement = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.querySelector('.cart-summary');
    
    if (!cartItemsElement || !emptyCartMessage) return;
    
    if (cartItems.length === 0) {
        cartItemsElement.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    cartItemsElement.style.display = 'block';
    emptyCartMessage.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    
    // عرض عناصر السلة
    cartItemsElement.innerHTML = cartItems.map(item => {
        const totalPrice = item.price * item.quantity;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=صورة'">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-price">${item.price} ${siteCurrency}</p>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                    <p class="cart-item-total">المجموع: ${totalPrice} ${siteCurrency}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // تحديث الملخص
    updateCartSummary();
}

// تحديث كمية المنتج في السلة
function updateCartQuantity(productId, change) {
    const item = cartItems.find(item => item.id === productId);
    if (!item) return;
    
    const product = allProducts.find(p => p.id === productId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    // التحقق من المخزون
    if (newQuantity > (product?.stock || item.stock || 99)) {
        showToast('لا توجد كمية كافية في المخزون', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCount();
    updateCartDisplay();
}

// إزالة منتج من السلة
function removeFromCart(productId) {
    if (!confirm('هل تريد إزالة هذا المنتج من السلة؟')) return;
    
    cartItems = cartItems.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCount();
    updateCartDisplay();
    showToast('تم إزالة المنتج من السلة', 'info');
}

// تحديث ملخص السلة
function updateCartSummary() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = siteSettings.shippingCost || 15;
    const freeShippingLimit = siteSettings.freeShippingLimit || 200;
    
    let finalShippingCost = 0;
    if (subtotal > 0 && subtotal < freeShippingLimit) {
        finalShippingCost = shippingCost;
    }
    
    const total = subtotal + finalShippingCost;
    
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shippingCost');
    const totalAmountElement = document.getElementById('totalAmount');
    const shippingNoteElement = document.getElementById('shippingNote');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (subtotalElement) subtotalElement.textContent = `${subtotal} ${siteCurrency}`;
    if (shippingCostElement) shippingCostElement.textContent = `${finalShippingCost} ${siteCurrency}`;
    if (totalAmountElement) totalAmountElement.textContent = `${total} ${siteCurrency}`;
    
    if (shippingNoteElement) {
        if (subtotal > 0 && subtotal < freeShippingLimit) {
            const remaining = freeShippingLimit - subtotal;
            shippingNoteElement.innerHTML = `
                <i class="fas fa-truck"></i>
                أضف ${remaining} ${siteCurrency} أخرى للحصول على شحن مجاني
            `;
        } else if (subtotal >= freeShippingLimit) {
            shippingNoteElement.innerHTML = `
                <i class="fas fa-check-circle"></i>
                الشحن مجاني
            `;
        } else {
            shippingNoteElement.innerHTML = '';
        }
    }
    
    if (checkoutBtn) {
        checkoutBtn.disabled = subtotal === 0;
    }
}

// تفريغ السلة
function clearCart() {
    if (cartItems.length === 0) return;
    
    if (confirm('هل تريد تفريغ السلة بالكامل؟')) {
        cartItems = [];
        localStorage.removeItem('cart');
        updateCartCount();
        updateCartDisplay();
        showToast('تم تفريغ السلة', 'info');
    }
}

// ======================== المفضلة ========================

// تبديل حالة المفضلة
function toggleFavorite(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const index = favorites.findIndex(f => f.id === productId);
    
    if (index === -1) {
        favorites.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category
        });
        showToast('تم إضافة المنتج إلى المفضلة', 'success');
    } else {
        favorites.splice(index, 1);
        showToast('تم إزالة المنتج من المفضلة', 'info');
    }
    
    // حفظ المفضلة
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // تحديث العرض إذا كان قسم المفضلة مفتوح
    if (document.getElementById('favorites').classList.contains('active')) {
        updateFavoritesDisplay();
    }
    
    // تحديث أيقونة القلب في قائمة المنتجات
    updateFavoriteIcons();
    
    // تحديث عدد المفضلة في الملف الشخصي
    updateProfileStats();
}

// تحديث أيقونات القلب في المنتجات
function updateFavoriteIcons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (!onclickAttr) return;
        
        const match = onclickAttr.match(/'([^']+)'/);
        if (!match) return;
        
        const productId = match[1];
        const isFavorite = favorites.some(f => f.id === productId);
        
        if (isFavorite) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// عرض المفضلة
function updateFavoritesDisplay() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    const emptyFavoritesMessage = document.getElementById('emptyFavoritesMessage');
    
    if (!favoritesGrid || !emptyFavoritesMessage) return;
    
    if (favorites.length === 0) {
        favoritesGrid.style.display = 'none';
        emptyFavoritesMessage.style.display = 'block';
        return;
    }
    
    favoritesGrid.style.display = 'grid';
    emptyFavoritesMessage.style.display = 'none';
    
    favoritesGrid.innerHTML = favorites.map(product => {
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=صورة'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${product.price} ${siteCurrency}</span>
                    </div>
                    <div class="product-actions">
                        <button class="action-btn add-to-cart" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i> أضف للسلة
                        </button>
                        <button class="action-btn favorite-btn active" onclick="toggleFavorite('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ======================== البحث والفلاتر ========================

// البحث عن منتجات
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        displayProducts();
        return;
    }
    
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
    );
    
    displayFilteredProducts(filteredProducts);
    showSection('products');
}

// تطبيق الفلاتر
function filterProducts() {
    let filteredProducts = [...allProducts];
    
    // فلترة حسب الفئة
    const category = document.getElementById('categoryFilter')?.value;
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    // ترتيب النتائج
    const sortBy = document.getElementById('sortFilter')?.value;
    if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
        filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    // الفلاتر الخاصة
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'));
    activeFilters.forEach(btn => {
        const filterType = btn.getAttribute('data-filter');
        if (filterType === 'isNew') {
            filteredProducts = filteredProducts.filter(p => p.isNew === true || p.isNew === 'true');
        } else if (filterType === 'isSale') {
            filteredProducts = filteredProducts.filter(p => p.isSale === true || p.isSale === 'true');
        } else if (filterType === 'isBest') {
            filteredProducts = filteredProducts.filter(p => p.isBest === true || p.isBest === 'true');
        }
    });
    
    displayFilteredProducts(filteredProducts);
}

// عرض المنتجات بعد الفلترة
function displayFilteredProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">لا توجد منتجات تطابق معايير البحث</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => {
        const isNew = product.isNew === true || product.isNew === 'true';
        const isSale = product.isSale === true || product.isSale === 'true';
        const isBest = product.isBest === true || product.isBest === 'true';
        const isInFavorites = favorites.some(f => f.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=صورة'">
                    ${isNew ? '<div class="badge new">جديد</div>' : ''}
                    ${isSale ? '<div class="badge sale">عرض</div>' : ''}
                    ${isBest ? '<div class="badge best">الأفضل</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price">
                        <span class="current-price">${product.price} ${siteCurrency}</span>
                        ${product.originalPrice ? `<span class="original-price">${product.originalPrice} ${siteCurrency}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="action-btn add-to-cart" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i> أضف للسلة
                        </button>
                        <button class="action-btn favorite-btn ${isInFavorites ? 'active' : ''}" onclick="toggleFavorite('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ======================== الطلبات ========================

// إنشاء طلب جديد
async function createOrder() {
    if (!currentUser || isGuest) {
        showToast('يجب تسجيل الدخول لإتمام الطلب', 'warning');
        showEmailAuthForm();
        return;
    }
    
    if (cartItems.length === 0) {
        showToast('السلة فارغة', 'warning');
        return;
    }
    
    try {
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shippingCost = siteSettings.shippingCost || 15;
        const freeShippingLimit = siteSettings.freeShippingLimit || 200;
        const finalShippingCost = subtotal < freeShippingLimit ? shippingCost : 0;
        const total = subtotal + finalShippingCost;
        
        const orderData = {
            userId: currentUser.uid,
            items: cartItems,
            subtotal: subtotal,
            shippingCost: finalShippingCost,
            total: total,
            status: 'pending',
            shippingAddress: '',
            paymentMethod: 'cash',
            customerName: currentUser.displayName || 'زائر',
            customerEmail: currentUser.email || '',
            orderNumber: 'ORD-' + Date.now(),
            createdAt: new Date().toISOString()
        };
        
        // حفظ الطلب في Firebase للمستخدمين المسجلين
        if (!isGuest && db) {
            try {
                const ordersRef = window.firebaseModules.collection(db, "orders");
                const docRef = await window.firebaseModules.addDoc(ordersRef, {
                    ...orderData,
                    createdAt: window.firebaseModules.serverTimestamp(),
                    updatedAt: window.firebaseModules.serverTimestamp()
                });
                
                orderData.id = docRef.id;
                
                // تحديث إحصائيات المستخدم
                const userRef = window.firebaseModules.doc(db, "users", currentUser.uid);
                const userDoc = await window.firebaseModules.getDoc(userRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const newTotalOrders = (userData.totalOrders || 0) + 1;
                    const newTotalSpent = (userData.totalSpent || 0) + total;
                    
                    await window.firebaseModules.updateDoc(userRef, {
                        totalOrders: newTotalOrders,
                        totalSpent: newTotalSpent,
                        updatedAt: window.firebaseModules.serverTimestamp()
                    });
                }
                
                showToast('تم حفظ الطلب في سجلاتك', 'info');
            } catch (firebaseError) {
                console.error('خطأ في حفظ الطلب في Firebase:', firebaseError);
            }
        }
        
        // حفظ الطلب في localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // تفريغ السلة
        cartItems = [];
        localStorage.removeItem('cart');
        updateCartCount();
        updateCartDisplay();
        
        // عرض تأكيد الطلب
        showOrderConfirmation(orderData);
        
        showToast('تم إنشاء الطلب بنجاح! رقم الطلب: ' + orderData.orderNumber, 'success');
        
        // تحديث إحصائيات الملف الشخصي
        updateProfileStats();
        
    } catch (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        showToast('حدث خطأ في إنشاء الطلب', 'error');
    }
}

// عرض تأكيد الطلب
function showOrderConfirmation(order) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>تم تأكيد طلبك!</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 60px; color: #27ae60; margin-bottom: 20px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">شكراً لشرائك من متجرنا</h3>
                    <p style="margin-bottom: 10px;"><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
                    <p style="margin-bottom: 10px;"><strong>المجموع:</strong> ${order.total} ${siteCurrency}</p>
                    <p style="margin-bottom: 20px;"><strong>الحالة:</strong> قيد المعالجة</p>
                    <p style="color: #7f8c8d;">سيتم التواصل معك لتأكيد تفاصيل الشحن</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">إغلاق</button>
                <button class="btn-primary" onclick="showSection('orders'); this.closest('.modal').remove()">عرض الطلبات</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// تحميل الطلبات من Firebase
async function loadUserOrders() {
    if (!currentUser || isGuest || !db) {
        displayOrders();
        return;
    }
    
    try {
        const ordersRef = window.firebaseModules.collection(db, "orders");
        const q = window.firebaseModules.query(
            ordersRef,
            window.firebaseModules.where("userId", "==", currentUser.uid),
            window.firebaseModules.orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await window.firebaseModules.getDocs(q);
        const firebaseOrders = [];
        
        querySnapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            // تحويل الطابع الزمني إلى تاريخ
            if (order.createdAt && order.createdAt.toDate) {
                order.createdAt = order.createdAt.toDate();
            }
            firebaseOrders.push(order);
        });
        
        // دمج مع الطلبات المحلية
        const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const allOrders = [...firebaseOrders, ...localOrders];
        
        // عرض الطلبات
        displayOrders(allOrders);
        
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        displayOrders();
    }
}

// عرض الطلبات السابقة
function displayOrders(orders = null) {
    const ordersList = document.getElementById('ordersList');
    const emptyOrdersMessage = document.getElementById('emptyOrdersMessage');
    
    if (!ordersList || !emptyOrdersMessage) return;
    
    let ordersToDisplay = orders;
    
    if (!ordersToDisplay) {
        if (isGuest) {
            ordersToDisplay = JSON.parse(localStorage.getItem('orders')) || [];
        } else {
            // للمستخدمين المسجلين، يجب استدعاء loadUserOrders أولاً
            return;
        }
    }
    
    if (!ordersToDisplay || ordersToDisplay.length === 0) {
        ordersList.style.display = 'none';
        emptyOrdersMessage.style.display = 'block';
        return;
    }
    
    ordersList.style.display = 'block';
    emptyOrdersMessage.style.display = 'none';
    
    // ترتيب الطلبات من الأحدث للأقدم
    ordersToDisplay.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateB - dateA;
    });
    
    ordersList.innerHTML = ordersToDisplay.map(order => {
        const orderDate = new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let statusText = 'قيد المعالجة';
        let statusClass = 'status-pending';
        
        if (order.status === 'delivered') {
            statusText = 'تم التوصيل';
            statusClass = 'status-delivered';
        } else if (order.status === 'shipped') {
            statusText = 'قيد الشحن';
            statusClass = 'status-pending';
        } else if (order.status === 'cancelled') {
            statusText = 'ملغى';
            statusClass = 'status-cancelled';
        }
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <span class="order-id">رقم الطلب: ${order.orderNumber || order.id}</span>
                        <span class="order-date">${orderDate}</span>
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-items">
                    ${order.items ? order.items.map(item => `
                        <div class="order-item">
                            <div>
                                <strong>${item.name}</strong>
                                <p>${item.quantity} × ${item.price} ${siteCurrency}</p>
                            </div>
                            <span>${item.price * item.quantity} ${siteCurrency}</span>
                        </div>
                    `).join('') : ''}
                </div>
                <div class="order-summary">
                    <div class="summary-item">
                        <span>المجموع الفرعي:</span>
                        <span>${order.subtotal || 0} ${siteCurrency}</span>
                    </div>
                    <div class="summary-item">
                        <span>رسوم الشحن:</span>
                        <span>${order.shippingCost || 0} ${siteCurrency}</span>
                    </div>
                    <div class="summary-item total">
                        <span>المجموع الكلي:</span>
                        <span>${order.total || 0} ${siteCurrency}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ======================== الملف الشخصي ========================

// تحديث الملف الشخصي
function updateUserProfile() {
    if (!currentUser) return;
    
    const savedUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const userName = currentUser.displayName || savedUser.displayName || savedUser.name || 'زائر';
    const userEmail = currentUser.email || savedUser.email || 'ليس لديك حساب';
    
    // تحديث العناصر
    const elements = [
        { id: 'profileName', text: userName },
        { id: 'mobileUserName', text: userName },
        { id: 'profileEmail', text: userEmail },
        { id: 'mobileUserEmail', text: userEmail },
        { id: 'detailName', text: userName },
        { id: 'detailEmail', text: userEmail }
    ];
    
    elements.forEach(el => {
        const element = document.getElementById(el.id);
        if (element) element.textContent = el.text;
    });
    
    // تحديث الصورة
    if (currentUser.photoURL) {
        const images = document.querySelectorAll('#profileImage, #mobileUserImage');
        images.forEach(img => {
            img.src = currentUser.photoURL;
        });
    }
    
    // تحديث الإحصائيات
    updateProfileStats();
}

// تحديث إحصائيات الملف الشخصي
async function updateProfileStats() {
    // تحديث عدد المفضلة
    const favoritesCount = favorites.length;
    document.getElementById('favoritesCount').textContent = favoritesCount;
    
    // تحديث عدد الطلبات وإجمالي المشتريات
    let ordersCount = 0;
    let totalSpent = 0;
    
    if (isGuest) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        ordersCount = orders.length;
        totalSpent = orders.reduce((total, order) => total + (order.total || 0), 0);
    } else if (db && currentUser) {
        try {
            const userRef = window.firebaseModules.doc(db, "users", currentUser.uid);
            const userDoc = await window.firebaseModules.getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                ordersCount = userData.totalOrders || 0;
                totalSpent = userData.totalSpent || 0;
            }
        } catch (error) {
            console.error('خطأ في تحميل إحصائيات المستخدم:', error);
        }
    }
    
    document.getElementById('ordersCount').textContent = ordersCount;
    document.getElementById('totalSpent').textContent = totalSpent;
}

// تحرير الملف الشخصي
function editProfile() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;
    
    // تعبئة البيانات الحالية
    document.getElementById('editName').value = currentUser?.displayName || '';
    document.getElementById('editPhone').value = '';
    document.getElementById('editAddress').value = '';
    
    modal.classList.add('active');
}

// حفظ تعديلات الملف الشخصي
async function saveProfileChanges() {
    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    const address = document.getElementById('editAddress').value;
    
    if (!name.trim()) {
        showToast('الرجاء إدخال الاسم', 'warning');
        return;
    }
    
    try {
        if (!isGuest && currentUser && db) {
            // تحديث في Firebase Auth
            await window.firebaseModules.updateProfile(currentUser, { displayName: name });
            
            // تحديث في Firestore
            const userRef = window.firebaseModules.doc(db, "users", currentUser.uid);
            await window.firebaseModules.updateDoc(userRef, {
                name: name,
                phone: phone,
                address: address,
                updatedAt: window.firebaseModules.serverTimestamp()
            });
        }
        
        // تحديث بيانات المستخدم المحلية
        currentUser.displayName = name;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // تحديث الواجهة
        updateUserProfile();
        
        document.getElementById('editProfileModal').classList.remove('active');
        showToast('تم تحديث الملف الشخصي بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        showToast('حدث خطأ في تحديث الملف الشخصي', 'error');
    }
}

// ======================== إعدادات الموقع ========================

// تحميل إعدادات الموقع
async function loadSiteConfig() {
    try {
        if (!db) return;
        
        const configRef = window.firebaseModules.doc(db, "settings", "site_config");
        const configSnap = await window.firebaseModules.getDoc(configRef);
        
        if (configSnap.exists()) {
            siteSettings = configSnap.data();
            siteCurrency = siteSettings.currency || 'ر.س';
            updateUIWithSettings();
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الموقع:', error);
    }
}

// تحديث واجهة المستخدم بالإعدادات
function updateUIWithSettings() {
    if (!siteSettings) return;
    
    // اسم المتجر
    if (siteSettings.storeName) {
        document.title = siteSettings.storeName;
        
        const storeNameElements = [
            document.getElementById('siteStoreName'),
            document.getElementById('footerStoreName')
        ];
        
        storeNameElements.forEach(el => {
            if (el) el.textContent = siteSettings.storeName;
        });
    }
    
    // معلومات الاتصال في الفوتر
    const footerElements = {
        'footerEmail': 'email',
        'footerPhone': 'phone',
        'footerAddress': 'address',
        'footerHours': 'workingHours'
    };
    
    for (const [elementId, settingKey] of Object.entries(footerElements)) {
        const element = document.getElementById(elementId);
        if (element && siteSettings[settingKey]) {
            element.textContent = siteSettings[settingKey];
        }
    }
    
    // وصف المتجر
    const aboutEl = document.getElementById('storeDescription');
    if (aboutEl && siteSettings.aboutUs) {
        aboutEl.textContent = siteSettings.aboutUs;
    }
}

// ======================== إدارة الأحداث ========================

// إعداد جميع المستمعين للأحداث
function setupAllEventListeners() {
    console.log('⚙️ إعداد جميع الأحداث...');
    
    // أحداث المصادقة
    setupAuthEventListeners();
    
    // أحداث التنقل
    setupNavigationEventListeners();
    
    // أحداث التطبيق
    setupAppEventListeners();
    
    // أحداث النوافذ المنبثقة
    setupModalEventListeners();
    
    console.log('✅ جميع الأحداث جاهزة');
}

// إعداد أحداث المصادقة
function setupAuthEventListeners() {
    // زر Google
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }
    
    // زر البريد الإلكتروني
    const emailBtn = document.getElementById('emailSignInBtn');
    if (emailBtn) {
        emailBtn.addEventListener('click', showEmailAuthForm);
    }
    
    // زر الضيف
    const guestBtn = document.getElementById('guestSignInBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', signInAsGuest);
    }
    
    // زر الرجوع
    const backBtn = document.getElementById('backToAuthOptions');
    if (backBtn) {
        backBtn.addEventListener('click', hideEmailAuthForm);
    }
    
    // إدخال كلمة المرور بالـ Enter
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = document.getElementById('emailInput')?.value || '';
                const password = passwordInput.value;
                if (email && password) {
                    signInWithEmail(email, password);
                }
            }
        });
    }
}

// إعداد أحداث التنقل
function setupNavigationEventListeners() {
    // قائمة الجوال
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mobileNav = document.getElementById('mobileNav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => mobileNav.classList.add('active'));
    }
    
    if (closeMenu && mobileNav) {
        closeMenu.addEventListener('click', () => mobileNav.classList.remove('active'));
    }
    
    // الروابط
    document.querySelectorAll('a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            
            if (mobileNav) mobileNav.classList.remove('active');
        });
    });
    
    // زر تسجيل الخروج المتنقل
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', signOutUser);
    }
}

// إعداد أحداث التطبيق
function setupAppEventListeners() {
    // الأزرار الرئيسية
    const buttons = {
        'shopNowBtn': () => showSection('products'),
        'continueShoppingBtn': () => showSection('products'),
        'browseProductsBtn': () => showSection('products'),
        'startShoppingBtn': () => showSection('products'),
        'homeBtn': () => showSection('home'),
        'cartBtn': () => showSection('cart'),
        'favoritesBtn': () => showSection('favorites'),
        'profileBtn': () => showSection('profile'),
        'logoutBtn': signOutUser,
        'checkoutBtn': createOrder,
        'editProfileBtn': editProfile,
        'saveProfileBtn': saveProfileChanges,
        'clearCartBtn': clearCart,
        'adminBtn': () => {
            console.log('🛠️ فتح لوحة التحكم...');
            window.open('admin.html', '_blank');
        }
    };
    
    for (const [btnId, action] of Object.entries(buttons)) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', action);
        }
    }
    
    // البحث
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // الفلاتر
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', filterProducts);
    }
    
    // أزرار الفلاتر
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            filterProducts();
        });
    });
}

// إعداد أحداث النوافذ المنبثقة
function setupModalEventListeners() {
    // إغلاق النوافذ
    document.querySelectorAll('.close-modal, .btn-secondary.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // النقر خارج النافذة لإغلاقها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// ======================== أحداث التسجيل ========================

function setupRegistrationEventListeners() {
    // زر إنشاء حساب جديد من الشاشة الرئيسية
    const signUpBtn = document.getElementById('signUpBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', showRegistrationForm);
    }
    
    // زر إنشاء حساب في نموذج التسجيل
    const completeSignUpBtn = document.getElementById('completeSignUpBtn');
    if (completeSignUpBtn) {
        completeSignUpBtn.addEventListener('click', handleRegistration);
    }
    
    // زر التبديل إلى تسجيل الدخول
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', showLoginForm);
    }
    
    // زر تسجيل الدخول
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', handleLogin);
    }
    
    // إدخال كلمة المرور بالـ Enter في نموذج التسجيل
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRegistration();
            }
        });
    }
}

function showRegistrationForm() {
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        // تحديث عنوان النموذج
        const formHeader = emailAuthForm.querySelector('.form-header h2');
        if (formHeader) formHeader.textContent = 'إنشاء حساب جديد';
        
        // إظهار حقول التسجيل
        const registerName = document.getElementById('registerName');
        const registerEmail = document.getElementById('registerEmail');
        const registerPassword = document.getElementById('registerPassword');
        const registerPhone = document.getElementById('registerPhone');
        
        if (registerName) registerName.style.display = 'block';
        if (registerEmail) registerEmail.style.display = 'block';
        if (registerPassword) registerPassword.style.display = 'block';
        if (registerPhone) registerPhone.style.display = 'block';
        
        // إخفاء حقول تسجيل الدخول القديمة
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        
        if (emailInput) emailInput.style.display = 'none';
        if (passwordInput) passwordInput.style.display = 'none';
        
        // إظهار زر الإنشاء وإخفاء زر تسجيل الدخول
        const signInBtn = document.getElementById('signInBtn');
        const completeSignUpBtn = document.getElementById('completeSignUpBtn');
        const switchToLoginBtn = document.getElementById('switchToLoginBtn');
        
        if (signInBtn) signInBtn.style.display = 'none';
        if (completeSignUpBtn) completeSignUpBtn.style.display = 'block';
        if (switchToLoginBtn) switchToLoginBtn.style.display = 'block';
        
        // إظهار النموذج
        emailAuthForm.style.display = 'block';
        
        // التركيز على أول حقل
        if (registerName) registerName.focus();
    }
}

function showLoginForm() {
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        // تحديث عنوان النموذج
        const formHeader = emailAuthForm.querySelector('.form-header h2');
        if (formHeader) formHeader.textContent = 'تسجيل الدخول';
        
        // إظهار حقول تسجيل الدخول
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        
        if (emailInput) emailInput.style.display = 'block';
        if (passwordInput) passwordInput.style.display = 'block';
        
        // إخفاء حقول التسجيل الجديدة
        const registerName = document.getElementById('registerName');
        const registerEmail = document.getElementById('registerEmail');
        const registerPassword = document.getElementById('registerPassword');
        const registerPhone = document.getElementById('registerPhone');
        
        if (registerName) registerName.style.display = 'none';
        if (registerEmail) registerEmail.style.display = 'none';
        if (registerPassword) registerPassword.style.display = 'none';
        if (registerPhone) registerPhone.style.display = 'none';
        
        // إظهار زر تسجيل الدخول وإخفاء زر الإنشاء
        const signInBtn = document.getElementById('signInBtn');
        const completeSignUpBtn = document.getElementById('completeSignUpBtn');
        const switchToLoginBtn = document.getElementById('switchToLoginBtn');
        
        if (signInBtn) signInBtn.style.display = 'block';
        if (completeSignUpBtn) completeSignUpBtn.style.display = 'none';
        if (switchToLoginBtn) switchToLoginBtn.style.display = 'none';
        
        // التركيز على حقل البريد
        if (emailInput) emailInput.focus();
    }
}

async function handleRegistration() {
    const name = document.getElementById('registerName')?.value || '';
    const email = document.getElementById('registerEmail')?.value || '';
    const password = document.getElementById('registerPassword')?.value || '';
    const phone = document.getElementById('registerPhone')?.value || '';
    
    // التحقق الأساسي
    if (!name || !email || !password) {
        showAuthMessage('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAuthMessage('البريد الإلكتروني غير صالح', 'error');
        return;
    }
    
    // إظهار رسالة تحميل
    showAuthMessage('جاري إنشاء حسابك...', 'info');
    
    // استدعاء دالة إنشاء الحساب
    await signUpWithEmail(email, password, name, phone);
}

async function handleLogin() {
    const email = document.getElementById('emailInput')?.value || '';
    const password = document.getElementById('passwordInput')?.value || '';
    
    if (!email || !password) {
        showAuthMessage('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    // إظهار رسالة تحميل
    showAuthMessage('جاري تسجيل الدخول...', 'info');
    
    // استدعاء دالة تسجيل الدخول
    await signInWithEmail(email, password);
}

// ======================== دوال الواجهة ========================

// عرض/إخفاء شاشة المصادقة
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const appContainer = document.getElementById('appContainer');
    
    if (authScreen) authScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
}

function showMainApp() {
    const authScreen = document.getElementById('authScreen');
    const appContainer = document.getElementById('appContainer');
    
    if (authScreen) authScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
}

// عرض/إخفاء نموذج البريد
function showEmailAuthForm() {
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        emailAuthForm.style.display = 'block';
        // إظهار نموذج تسجيل الدخول افتراضياً
        showLoginForm();
    }
}

function hideEmailAuthForm() {
    const emailAuthForm = document.getElementById('emailAuthForm');
    if (emailAuthForm) {
        emailAuthForm.style.display = 'none';
        clearEmailForm();
    }
}

function clearEmailForm() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const authMessage = document.getElementById('emailAuthMessage');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (authMessage) {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
    }
}

function showAuthMessage(message, type = 'error') {
    const authMessage = document.getElementById('emailAuthMessage');
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
    }
}

// عرض الأقسام
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تحميل محتوى خاص لكل قسم
        switch(sectionId) {
            case 'cart':
                updateCartDisplay();
                break;
            case 'favorites':
                updateFavoritesDisplay();
                break;
            case 'orders':
                if (!isGuest && db) {
                    loadUserOrders();
                } else {
                    displayOrders();
                }
                break;
            case 'profile':
                updateProfileStats();
                break;
        }
    }
}

// الإشعارات
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // إزالة بعد 3 ثواني
    setTimeout(() => toast.remove(), 3000);
}

// ======================== التصدير للاستخدام في HTML ========================

// تصدير الدوال للاستخدام في onclick في HTML
window.addToCart = addToCart;
window.toggleFavorite = toggleFavorite;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.signInAsGuest = signInAsGuest;
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.showSection = showSection;
window.clearCart = clearCart;
window.editProfile = editProfile;
window.saveProfileChanges = saveProfileChanges;
window.performSearch = performSearch;
window.filterProducts = filterProducts;
window.createOrder = createOrder;
window.signUpWithEmail = signUpWithEmail;
window.handleRegistration = handleRegistration;
window.handleLogin = handleLogin;
window.showRegistrationForm = showRegistrationForm;
window.showLoginForm = showLoginForm;

console.log('🚀 تطبيق Queen Beauty جاهز للعمل!');