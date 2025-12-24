// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// بيانات المتجر
let storeData = {
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
let currentUser = null;
let isAdmin = false;
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

// تهيئة المتجر
document.addEventListener('DOMContentLoaded', function() {
    setupFirebaseAuth();
    setupEventListeners();
    checkInitialAuth();
    
    // إضافة تأثيرات تحميل أولية
    setTimeout(() => {
        document.querySelector('.auth-container').classList.add('loaded');
    }, 100);
});

// إعداد مصادقة Firebase
function setupFirebaseAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await checkUserAdminStatus(user);
            showMainApp();
            loadStoreData();
            updateUserUI();
            
            // تحديث آخر دخول للمستخدم
            if (user.email) {
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {});
            }
        } else {
            // لا يوجد مستخدم مسجل
            showAuthScreen();
        }
    });
}

// التحقق من حالة المسؤول
async function checkUserAdminStatus(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            isAdmin = userData.isAdmin === true;
            
            // إظهار/إخفاء زر الإدارة
            const adminBtn = document.getElementById('adminToggle');
            const mobileAdminBtn = document.getElementById('mobileAdminToggle');
            
            if (isAdmin) {
                if (adminBtn) adminBtn.classList.remove('hidden');
                if (mobileAdminBtn) mobileAdminBtn.classList.remove('hidden');
                showToast("مرحباً بك مسؤول المتجر", "success");
            } else {
                if (adminBtn) adminBtn.classList.add('hidden');
                if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
            }
        } else {
            // إنشاء سجل مستخدم جديد إذا لم يكن موجوداً
            await createUserRecord(user);
            isAdmin = false;
        }
    } catch (error) {
        console.error('خطأ في التحقق من حالة المسؤول:', error);
        isAdmin = false;
    }
}

// إنشاء سجل مستخدم جديد
async function createUserRecord(user) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || 'مستخدم',
            photoURL: user.photoURL || null,
            isAdmin: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        console.log('تم إنشاء سجل مستخدم جديد');
    } catch (error) {
        console.error('خطأ في إنشاء سجل المستخدم:', error);
    }
}

// التحقق من المصادقة الأولية
function checkInitialAuth() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// إظهار صفحة المصادقة
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    closeAdminPanel();
    closeUserProfile();
}

// إظهار التطبيق الرئيسي
function showMainApp() {
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    // إضافة تأثير ظهور تدريجي
    mainApp.style.opacity = '0';
    setTimeout(() => {
        mainApp.style.transition = 'opacity 0.5s ease';
        mainApp.style.opacity = '1';
    }, 50);
}

// تحديث واجهة المستخدم
function updateUserUI() {
    if (!currentUser) return;
    
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');
    const userRole = document.getElementById('userRole');
    
    if (userNameDisplay) {
        userNameDisplay.textContent = currentUser.displayName || 'حسابي';
    }
    
    if (userDisplayName) {
        userDisplayName.textContent = currentUser.displayName || 'مستخدم';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || 'مستخدم ضيف';
    }
    
    if (userPhoto && currentUser.photoURL) {
        userPhoto.src = currentUser.photoURL;
    }
    
    if (userRole) {
        userRole.textContent = isAdmin ? 'مسؤول' : 'مستخدم عادي';
        userRole.className = isAdmin ? 'role-badge admin' : 'role-badge';
    }
}

// تسجيل الدخول بجوجل
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        // إضافة نطاقات إضافية إذا لزم الأمر
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        showToast("تم تسجيل الدخول بنجاح", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول بجوجل:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showToast("تم إغلاق نافذة تسجيل الدخول", "warning");
        } else {
            showToast("فشل تسجيل الدخول بجوجل", "error");
        }
        return null;
    }
}

// تسجيل الدخول بالبريد الإلكتروني
async function signInWithEmail(email, password) {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        showToast("تم تسجيل الدخول بنجاح", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        
        if (error.code === 'auth/user-not-found') {
            showToast("المستخدم غير موجود", "error");
        } else if (error.code === 'auth/wrong-password') {
            showToast("كلمة المرور غير صحيحة", "error");
        } else if (error.code === 'auth/invalid-email') {
            showToast("البريد الإلكتروني غير صالح", "error");
        } else {
            showToast("فشل تسجيل الدخول", "error");
        }
        
        return null;
    }
}

// إنشاء حساب جديد
async function signUpWithEmail(email, password, displayName) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({
            displayName: displayName || email.split('@')[0]
        });
        
        await createUserRecord(result.user);
        showToast("تم إنشاء الحساب بنجاح", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showToast("هذا البريد الإلكتروني مستخدم بالفعل", "error");
        } else if (error.code === 'auth/weak-password') {
            showToast("كلمة المرور ضعيفة جداً", "error");
        } else if (error.code === 'auth/invalid-email') {
            showToast("البريد الإلكتروني غير صالح", "error");
        } else {
            showToast("فشل إنشاء الحساب", "error");
        }
        
        return null;
    }
}

// تسجيل الدخول كضيف
async function signInAsGuest() {
    try {
        const result = await auth.signInAnonymously();
        showToast("مرحباً بك كضيف", "success");
        return result.user;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول كضيف:', error);
        showToast("فشل تسجيل الدخول كضيف", "error");
        return null;
    }
}

// إعادة تعيين كلمة المرور
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        showToast("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني", "success");
        return true;
    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        
        if (error.code === 'auth/user-not-found') {
            showToast("المستخدم غير موجود", "error");
        } else if (error.code === 'auth/invalid-email') {
            showToast("البريد الإلكتروني غير صالح", "error");
        } else {
            showToast("فشل إرسال رابط إعادة التعيين", "error");
        }
        
        return false;
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        await auth.signOut();
        showToast("تم تسجيل الخروج بنجاح", "success");
        currentUser = null;
        isAdmin = false;
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        showToast("فشل تسجيل الخروج", "error");
    }
}

// تحميل البيانات
async function loadStoreData() {
    try {
        // تحميل الإعدادات
        const settingsDoc = await db.collection('settings').doc('store').get();
        if (settingsDoc.exists) {
            storeData.settings = settingsDoc.data();
        }
        
        // تحميل المنتجات
        const productsSnapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        storeData.products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            storeData.products.push(product);
        });
        
        console.log('تم تحميل البيانات:', storeData.products.length, 'منتج');
        
        // تحديث الواجهة
        updateStoreUI();
        renderProducts();
        updateCategoryCounts();
        
    } catch (e) {
        console.error('خطأ في تحميل البيانات:', e);
        loadDefaultProducts();
    }
}

// منتجات افتراضية (للحالات الطارئة)
function loadDefaultProducts() {
    storeData.products = [
        {
            id: "1",
            name: "عطر فلورال رومانسي",
            description: "عطر نسائي برائحة الأزهار الطازجة يدوم طويلاً",
            price: 35000,
            category: "featured",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop&crop=center",
            badge: "الأكثر طلباً",
            stock: 10,
            createdAt: new Date().toISOString()
        }
    ];
}

// حفظ البيانات
async function saveStoreData() {
    try {
        // حفظ الإعدادات
        await db.collection('settings').doc('store').set(storeData.settings, { merge: true });
        
        showToast("تم حفظ البيانات", "success");
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        showToast("حدث خطأ في حفظ البيانات", "error");
        return false;
    }
}

// تحديث الواجهة
function updateStoreUI() {
    // تحديث اسم المتجر
    document.querySelectorAll('.store-name-text').forEach(el => {
        el.textContent = storeData.settings.storeName;
    });
    
    // تحديث وصف المتجر
    const footerDesc = document.getElementById('footerStoreDescription');
    if (footerDesc) {
        footerDesc.textContent = storeData.settings.description;
    }
    
    // تحديث رقم الهاتف
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        contactPhone.textContent = storeData.settings.phone;
    }
    
    // تحديث روابط الواتساب
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=مرحباً%20${encodeURIComponent(storeData.settings.storeName)}%20،%20أود%20الاستفسار%20عن%20المنتجات`;
    
    ['whatsappNavLink', 'mobileWhatsappLink', 'floatingWhatsapp', 'contactWhatsappLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = waLink;
    });
    
    // تحديث السنة
    updateCurrentYear();
}

// تحديث عدد المنتجات في الفئات
function updateCategoryCounts() {
    storeData.categories.forEach(cat => {
        const count = storeData.products.filter(p => p.category === cat.id).length;
        const el = document.getElementById(`${cat.id}Count`);
        if (el) el.textContent = `${count} منتج`;
    });
}

// عرض المنتجات
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // فلترة المنتجات
    let filtered = storeData.products.filter(product => {
        const matchesFilter = currentFilter === 'all' || product.category === currentFilter;
        const matchesSearch = searchQuery ? 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
            true;
        return matchesFilter && matchesSearch;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // إذا لم توجد منتجات
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>${searchQuery ? 'لا توجد نتائج' : 'لا توجد منتجات'}</h3>
                <p>${searchQuery ? 'لم يتم العثور على منتجات تطابق بحثك' : 'لم تتم إضافة منتجات بعد'}</p>
            </div>
        `;
        return;
    }

    // عرض المنتجات
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            <div class="product-image">
                <div class="image-square-container">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</span>
                <h3 class="product-name">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <p class="product-price">${formatPrice(product.price)}</p>
                <div class="product-stock-info">
                    <small><i class="fas fa-cubes"></i> المتوفر: ${product.stock || 0}</small>
                </div>
                <div class="product-quantity-selector">
                    <button onclick="changeQty('${product.id}', -1)"><i class="fas fa-minus"></i></button>
                    <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock || 99}" readonly>
                    <button onclick="changeQty('${product.id}', 1)"><i class="fas fa-plus"></i></button>
                </div>
                <div class="product-actions">
                    <button class="buy-btn" onclick="orderViaWhatsapp('${product.id}')">
                        <i class="fab fa-whatsapp"></i> اطلب الآن
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// تنسيق السعر
function formatPrice(price) {
    return new Intl.NumberFormat('ar-SD').format(price) + ' ج.س';
}

// الطلب عبر الواتساب
function orderViaWhatsapp(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) {
        showToast("المنتج غير موجود", "error");
        return;
    }
    
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    const totalPrice = product.price * quantity;
    
    const userName = currentUser?.displayName || 'عميل';
    const userContact = currentUser?.email ? `\nالبريد الإلكتروني: ${currentUser.email}` : '';
    
    const message = `مرحباً ${storeData.settings.storeName}، 

أنا ${userName}، أود طلب المنتج التالي:

المنتج: ${product.name}
الكمية: ${quantity}
السعر الإجمالي: ${formatPrice(totalPrice)}
الفئة: ${storeData.categories.find(c => c.id === product.category)?.name || product.category}
${product.description ? `الوصف: ${product.description}` : ''}
${userContact}

يرجى التواصل معي للتفاصيل.`;
    
    const waLink = `https://wa.me/${storeData.settings.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // تسجيل الدخول
    document.getElementById('googleSignInBtn')?.addEventListener('click', () => signInWithGoogle());
    document.getElementById('signInWithEmailBtn')?.addEventListener('click', handleEmailSignIn);
    document.getElementById('signUpWithEmailBtn')?.addEventListener('click', handleEmailSignUp);
    document.getElementById('guestSignInBtn')?.addEventListener('click', () => signInAsGuest());
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', handleForgotPassword);
    
    // تبديل عرض كلمة المرور
    document.getElementById('togglePassword')?.addEventListener('click', togglePasswordVisibility);
    
    // تسجيل الخروج
    document.getElementById('profileLogoutBtn')?.addEventListener('click', () => signOut());
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => signOut());
    
    // القائمة الجانبية للجوال
    setupMobileMenu();
    
    // البحث والفلترة
    setupSearchAndFilter();
    
    // لوحة التحكم
    setupAdminPanel();
    
    // حساب المستخدم
    setupUserProfile();
    
    // الأحداث الأخرى
    setupOtherListeners();
}

// تسجيل الدخول بالبريد
async function handleEmailSignIn() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showToast("الرجاء إدخال البريد الإلكتروني وكلمة المرور", "error");
        return;
    }
    
    // إضافة تأثير تحميل
    const signInBtn = document.getElementById('signInWithEmailBtn');
    const originalText = signInBtn.innerHTML;
    signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
    signInBtn.disabled = true;
    
    await signInWithEmail(email, password);
    
    // استعادة الحالة الأصلية
    signInBtn.innerHTML = originalText;
    signInBtn.disabled = false;
}

// إنشاء حساب بالبريد
async function handleEmailSignUp() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showToast("الرجاء إدخال البريد الإلكتروني وكلمة المرور", "error");
        return;
    }
    
    if (password.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }
    
    const displayName = prompt("الرجاء إدخال اسمك:");
    if (!displayName || displayName.trim() === '') {
        showToast("الرجاء إدخال اسم صحيح", "error");
        return;
    }
    
    // إضافة تأثير تحميل
    const signUpBtn = document.getElementById('signUpWithEmailBtn');
    const originalText = signUpBtn.innerHTML;
    signUpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
    signUpBtn.disabled = true;
    
    await signUpWithEmail(email, password, displayName.trim());
    
    // استعادة الحالة الأصلية
    signUpBtn.innerHTML = originalText;
    signUpBtn.disabled = false;
}

// إعادة تعيين كلمة المرور
async function handleForgotPassword() {
    const email = document.getElementById('emailInput').value.trim();
    
    if (!email) {
        showToast("الرجاء إدخال بريدك الإلكتروني", "error");
        return;
    }
    
    const confirmReset = confirm(`هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى ${email}؟`);
    if (!confirmReset) return;
    
    // إضافة تأثير تحميل
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    const originalText = forgotBtn.innerHTML;
    forgotBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    forgotBtn.disabled = true;
    
    await resetPassword(email);
    
    // استعادة الحالة الأصلية
    forgotBtn.innerHTML = originalText;
    forgotBtn.disabled = false;
}

// تبديل عرض كلمة المرور
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleBtn.setAttribute('aria-label', 'إخفاء كلمة المرور');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleBtn.setAttribute('aria-label', 'إظهار كلمة المرور');
    }
}

// القائمة الجانبية للجوال
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeMobileMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // زر الإدارة في الجوال
    document.getElementById('mobileAdminToggle')?.addEventListener('click', () => {
        closeMobileMenu();
        openAdminPanel();
    });
    
    // زر حساب المستخدم في الجوال
    document.getElementById('mobileUserToggle')?.addEventListener('click', () => {
        closeMobileMenu();
        openUserProfile();
    });
}

function closeMobileMenu() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// البحث والفلترة
function setupSearchAndFilter() {
    const productSearch = document.getElementById('productSearch');
    const productSort = document.getElementById('productSort');
    
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }
    
    if (productSort) {
        productSort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }
    
    // أزرار الفلترة
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });
}

// لوحة التحكم
function setupAdminPanel() {
    const adminToggle = document.getElementById('adminToggle');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (adminToggle) {
        adminToggle.addEventListener('click', openAdminPanel);
    }
    
    if (adminOverlay) {
        adminOverlay.addEventListener('click', closeAdminPanel);
    }
    
    // تبويبات لوحة التحكم
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
            this.classList.add('active');
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');
            
            if (this.dataset.tab === 'products-list') {
                loadAdminProducts();
            } else if (this.dataset.tab === 'users') {
                loadAdminUsers();
            } else if (this.dataset.tab === 'settings') {
                fillSettingsForm();
            }
        });
    });
    
    // نموذج إضافة منتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }
    
    // نموذج الإعدادات
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
}

function openAdminPanel() {
    if (!isAdmin) {
        showToast("ليس لديك صلاحية للوصول إلى لوحة التحكم", "error");
        return;
    }
    
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.add('active');
    if (adminOverlay) adminOverlay.classList.add('active');
    
    loadAdminProducts();
    fillSettingsForm();
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    
    if (adminSidebar) adminSidebar.classList.remove('active');
    if (adminOverlay) adminOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// تحميل المنتجات في لوحة التحكم
async function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (!list) return;
    
    if (storeData.products.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>لا توجد منتجات</h3>
                <p>قم بإضافة منتجك الأول</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = storeData.products.map(product => `
        <div class="admin-product-item">
            <div class="product-info-small">
                <div class="admin-product-image-container">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <p>${formatPrice(product.price)}</p>
                    <small>${storeData.categories.find(c => c.id === product.category)?.name || 'عام'}</small>
                </div>
            </div>
            <div class="product-actions-small">
                <button class="edit-btn" onclick="openEditModal('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// حذف منتج
async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        await db.collection('products').doc(id).delete();
        
        // تحديث القائمة المحلية
        storeData.products = storeData.products.filter(p => p.id !== id);
        
        // تحديث الواجهات
        loadAdminProducts();
        renderProducts();
        updateCategoryCounts();
        
        showToast("تم حذف المنتج", "success");
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        showToast("حدث خطأ في حذف المنتج", "error");
    }
}

// إضافة منتج جديد
async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const category = document.getElementById('pCategory').value;
    const imageBase64 = document.getElementById('pImageBase64').value;
    const badge = document.getElementById('pBadge').value.trim();
    const description = document.getElementById('pDesc').value.trim();
    const stock = parseInt(document.getElementById('pStock').value) || 0;
    
    // التحقق من البيانات
    if (!name || !price || !imageBase64) {
        showToast("الرجاء ملء جميع الحقول المطلوبة (بما في ذلك الصورة)", "error");
        return;
    }
    
    if (price <= 0) {
        showToast("الرجاء إدخال سعر صحيح", "error");
        return;
    }
    
    try {
        // إنشاء المنتج الجديد في Firestore
        const newProduct = {
            name: name,
            price: price,
            category: category,
            image: imageBase64,
            stock: stock,
            badge: badge || null,
            description: description || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('products').add(newProduct);
        
        // إضافة المعرف المحلي
        newProduct.id = docRef.id;
        
        // تحديث القائمة المحلية
        storeData.products.unshift(newProduct);
        
        // إعادة تعيين النموذج
        e.target.reset();
        removeSelectedImage();
        
        // تحديث الواجهات
        renderProducts();
        loadAdminProducts();
        updateCategoryCounts();
        
        // الانتقال إلى قائمة المنتجات
        const productsTab = document.querySelector('.admin-tab-btn[data-tab="products-list"]');
        if (productsTab) productsTab.click();
        
        showToast("تم إضافة المنتج بنجاح", "success");
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        showToast("حدث خطأ في إضافة المنتج", "error");
    }
}

// تعبئة نموذج الإعدادات
function fillSettingsForm() {
    document.getElementById('sName').value = storeData.settings.storeName;
    document.getElementById('sWhatsapp').value = storeData.settings.whatsapp;
    document.getElementById('sDescription').value = storeData.settings.description;
    document.getElementById('sPhone').value = storeData.settings.phone;
}

// تحديث الإعدادات
async function handleUpdateSettings(e) {
    e.preventDefault();
    
    storeData.settings.storeName = document.getElementById('sName').value.trim();
    storeData.settings.whatsapp = document.getElementById('sWhatsapp').value.trim();
    storeData.settings.description = document.getElementById('sDescription').value.trim();
    storeData.settings.phone = document.getElementById('sPhone').value.trim();
    
    if (await saveStoreData()) {
        updateStoreUI();
        e.target.reset();
        fillSettingsForm();
        showToast("تم تحديث الإعدادات بنجاح", "success");
    }
}

// إدارة المستخدمين
async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            user.id = doc.id;
            users.push(user);
        });
        
        if (users.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h3>لا توجد مستخدمين</h3>
                </div>
            `;
            return;
        }
        
        list.innerHTML = users.map(user => `
            <div class="admin-user-item">
                <div class="user-info-small">
                    <div class="admin-user-image-container">
                        <img src="${user.photoURL || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23FF6B8B%22/><text x=%2250%22 y=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>👤</text></svg>'}" alt="${user.displayName}">
                    </div>
                    <div class="user-details">
                        <h4>${user.displayName}</h4>
                        <p>${user.email || 'بريد غير متوفر'}</p>
                        <small>${user.isAdmin ? 'مسؤول' : 'مستخدم عادي'}</small>
                    </div>
                </div>
                <div class="user-actions-small">
                    <button class="role-btn ${user.isAdmin ? 'admin-btn' : 'user-btn'}" onclick="toggleUserRole('${user.id}', ${user.isAdmin})">
                        ${user.isAdmin ? 'إلغاء الإدارة' : 'تعيين كمسؤول'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        list.innerHTML = `<p style="color: #ff4757;">خطأ في تحميل المستخدمين</p>`;
    }
}

// تبديل صلاحية المستخدم
async function toggleUserRole(userId, isCurrentlyAdmin) {
    if (!confirm(`هل تريد ${isCurrentlyAdmin ? 'إلغاء صلاحية الإدارة' : 'تعيين كمشرف'} لهذا المستخدم؟`)) return;
    
    try {
        await db.collection('users').doc(userId).update({
            isAdmin: !isCurrentlyAdmin
        });
        
        showToast("تم تحديث صلاحية المستخدم", "success");
        loadAdminUsers();
    } catch (error) {
        console.error('خطأ في تحديث صلاحية المستخدم:', error);
        showToast("حدث خطأ في تحديث الصلاحية", "error");
    }
}

// إعداد بطاقات الفئات
function setupCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // تحديث أزرار الفلترة
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            // تطبيق الفلترة
            currentFilter = category;
            renderProducts();
            
            // التمرير إلى قسم المنتجات
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// حساب المستخدم
function setupUserProfile() {
    const userToggle = document.getElementById('userToggle');
    const userProfileModal = document.getElementById('userProfileModal');
    
    if (userToggle) {
        userToggle.addEventListener('click', openUserProfile);
    }
}

function openUserProfile() {
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal) {
        userProfileModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeUserProfile() {
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal) {
        userProfileModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// الأحداث الأخرى
function setupOtherListeners() {
    // تحديث السنة
    updateCurrentYear();
    
    // إغلاق لوحات التحكم بمفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeAdminPanel();
            closeUserProfile();
            closeEditModal();
        }
    });
    
    // إغلاق النوافذ المنبثقة بالنقر خارجها
    document.addEventListener('click', (e) => {
        const userProfileModal = document.getElementById('userProfileModal');
        const editProductModal = document.getElementById('editProductModal');
        
        if (userProfileModal && !userProfileModal.classList.contains('hidden') && 
            e.target === userProfileModal) {
            closeUserProfile();
        }
        
        if (editProductModal && !editProductModal.classList.contains('hidden') && 
            e.target === editProductModal) {
            closeEditModal();
        }
    });
}

// تحديث السنة الحالية
function updateCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// تصدير البيانات
async function exportData() {
    try {
        // جلب جميع البيانات
        const [productsSnapshot, settingsDoc] = await Promise.all([
            db.collection('products').get(),
            db.collection('settings').doc('store').get()
        ]);
        
        const products = [];
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        
        const settings = settingsDoc.exists ? settingsDoc.data() : storeData.settings;
        
        const exportData = {
            settings: settings,
            products: products,
            categories: storeData.categories,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `beauty-store-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showToast("تم تصدير البيانات", "success");
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showToast("حدث خطأ في تصدير البيانات", "error");
    }
}

// استيراد البيانات
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // التحقق من صحة البيانات
                if (importedData.settings && Array.isArray(importedData.products)) {
                    if (confirm('هل تريد استيراد البيانات الجديدة؟ سيتم استبدال البيانات الحالية.')) {
                        // استيراد الإعدادات
                        await db.collection('settings').doc('store').set(importedData.settings);
                        
                        // استيراد المنتجات
                        const batch = db.batch();
                        const productsRef = db.collection('products');
                        
                        // حذف المنتجات القديمة أولاً
                        const oldProducts = await productsRef.get();
                        oldProducts.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        
                        // إضافة المنتجات الجديدة
                        importedData.products.forEach(product => {
                            const { id, ...productData } = product;
                            const newRef = productsRef.doc();
                            batch.set(newRef, {
                                ...productData,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        });
                        
                        await batch.commit();
                        
                        // إعادة تحميل البيانات
                        await loadStoreData();
                        showToast("تم استيراد البيانات بنجاح", "success");
                    }
                } else {
                    showToast("ملف غير صالح", "error");
                }
            } catch (err) {
                console.error('خطأ في قراءة الملف:', err);
                showToast("خطأ في قراءة الملف", "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// عرض الإشعارات
function showToast(message, type = "info") {
    let backgroundColor = "#9D4EDD";
    
    switch(type) {
        case "success":
            backgroundColor = "#06D6A0";
            break;
        case "error":
            backgroundColor = "#ff4757";
            break;
        case "warning":
            backgroundColor = "#FFD166";
            break;
    }
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: backgroundColor,
        stopOnFocus: true,
        style: {
            fontFamily: "'Cairo', sans-serif",
            borderRadius: "8px",
            padding: "12px 20px"
        }
    }).showToast();
}

// وظائف معالجة الصور
document.addEventListener('DOMContentLoaded', function() {
    const imageFileInput = document.getElementById('pImageFile');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // التحقق من حجم الملف (أقصى حد 2 ميجابايت)
            if (file.size > 2 * 1024 * 1024) {
                showToast("حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)", "error");
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                document.getElementById('pImageBase64').value = base64String;
                
                const preview = document.getElementById('imagePreview');
                const placeholder = document.querySelector('.upload-placeholder');
                
                preview.querySelector('img').src = base64String;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        });
    }
});

function removeSelectedImage() {
    const imageFileInput = document.getElementById('pImageFile');
    const imageBase64Input = document.getElementById('pImageBase64');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.querySelector('.upload-placeholder');
    
    if (imageFileInput) imageFileInput.value = '';
    if (imageBase64Input) imageBase64Input.value = '';
    if (preview) {
        preview.classList.add('hidden');
        preview.querySelector('img').src = '';
    }
    if (placeholder) placeholder.classList.remove('hidden');
}

// وظائف تعديل المنتج
async function openEditModal(id) {
    const product = storeData.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editPId').value = product.id;
    document.getElementById('editPName').value = product.name;
    document.getElementById('editPPrice').value = product.price;
    document.getElementById('editPCategory').value = product.category;
    document.getElementById('editPStock').value = product.stock || 0;
    document.getElementById('editPBadge').value = product.badge || '';
    document.getElementById('editPDesc').value = product.description || '';

    document.getElementById('editProductModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editProductModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// تحديث المنتج
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const id = document.getElementById('editPId').value;
            const name = document.getElementById('editPName').value.trim();
            const price = parseFloat(document.getElementById('editPPrice').value);
            const category = document.getElementById('editPCategory').value;
            const stock = parseInt(document.getElementById('editPStock').value) || 0;
            const badge = document.getElementById('editPBadge').value.trim();
            const description = document.getElementById('editPDesc').value.trim();

            try {
                // تحديث في Firestore
                await db.collection('products').doc(id).update({
                    name,
                    price,
                    category,
                    stock,
                    badge: badge || null,
                    description,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // تحديث المحلي
                const index = storeData.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    storeData.products[index] = {
                        ...storeData.products[index],
                        name,
                        price,
                        category,
                        stock,
                        badge: badge || null,
                        description
                    };
                }
                
                // تحديث الواجهات
                renderProducts();
                loadAdminProducts();
                updateCategoryCounts();
                closeEditModal();
                
                showToast("تم تحديث المنتج بنجاح", "success");
            } catch (error) {
                console.error('خطأ في تحديث المنتج:', error);
                showToast("حدث خطأ في تحديث المنتج", "error");
            }
        });
    }
});

// وظيفة تغيير الكمية
function changeQty(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    
    let val = parseInt(input.value) + delta;
    const max = parseInt(input.getAttribute('max')) || 99;
    
    if (val < 1) val = 1;
    if (val > max) val = max;
    
    input.value = val;
}

// إعداد التطبيق بعد تحميل الصفحة
setTimeout(() => {
    if (!currentUser) {
        showAuthScreen();
    }
}, 100);

// إضافة تأثيرات CSS إضافية
document.addEventListener('DOMContentLoaded', function() {
    // إضافة تأثيرات للعناصر عند التحميل
    const style = document.createElement('style');
    style.textContent = `
        .auth-container {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .auth-container.loaded {
            opacity: 1;
            transform: translateY(0);
        }
        
        .feature-item, .social-auth-btn, .auth-input {
            transform: translateY(0);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature-item:hover, .social-auth-btn:hover {
            transform: translateY(-3px);
        }
        
        .auth-input:focus {
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);
});