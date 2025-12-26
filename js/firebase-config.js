// js/firebase-config.js - تهيئة Firebase (النسخة المصححة)

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
function initializeFirebase() {
    try {
        // تأكد من أن Firebase تم تحميله أولاً
        if (typeof firebase !== 'undefined') {
            // تهيئة التطبيق
            const app = firebase.initializeApp(firebaseConfig);
            
            // الحصول على الخدمات
            const auth = firebase.auth();
            const db = firebase.firestore();
            
            // جعلها متاحة عالمياً
            window.firebaseApp = app;
            window.auth = auth;
            window.db = db;
            
            console.log('Firebase تم تهيئته بنجاح!');
            return { success: true, app, auth, db };
        } else {
            console.error('Firebase لم يتم تحميله!');
            return { success: false, error: 'Firebase لم يتم تحميله' };
        }
    } catch (error) {
        console.error('خطأ في تهيئة Firebase:', error);
        return { success: false, error: error.message };
    }
}

// استدعاء التهيئة عند تحميل الصفحة
window.initializeFirebase = initializeFirebase;