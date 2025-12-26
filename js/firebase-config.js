// js/firebase-config.js - تهيئة Firebase (النسخة المتوافقة)

// جعل Firebase متاحاً عالمياً
const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

console.log('تهيئة Firebase...');

// تهيئة Firebase بطريقة متوافقة
try {
    // تأكد من أن Firebase تم تحميله أولاً
    if (typeof firebase !== 'undefined') {
        // تهيئة التطبيق
        const app = firebase.initializeApp(firebaseConfig);
        
        // الحصول على الخدمات
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();
        
        // جعلها متاحة عالمياً
        window.firebaseApp = app;
        window.auth = auth;
        window.db = db;
        window.storage = storage;
        
        console.log('Firebase تم تهيئته بنجاح!');
    } else {
        console.error('Firebase لم يتم تحميله!');
        // تهيئة كائنات وهمية لمنع الأخطاء
        window.auth = {
            currentUser: null,
            onAuthStateChanged: (callback) => {
                callback(null);
                return () => {};
            }
        };
        window.db = {
            collection: () => ({
                doc: () => ({
                    get: () => Promise.resolve({ exists: false, data: () => null }),
                    set: () => Promise.resolve(),
                    update: () => Promise.resolve(),
                    delete: () => Promise.resolve()
                }),
                get: () => Promise.resolve({ docs: [] })
            })
        };
    }
} catch (error) {
    console.error('خطأ في تهيئة Firebase:', error);
    
    // تهيئة كائنات وهمية لمنع الأخطاء
    window.auth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
            setTimeout(() => callback(null), 100);
            return () => {};
        }
    };
    window.db = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.resolve({ exists: false, data: () => null }),
                set: () => Promise.resolve(),
                update: () => Promise.resolve(),
                delete: () => Promise.resolve()
            }),
            get: () => Promise.resolve({ docs: [] })
        })
    };
}