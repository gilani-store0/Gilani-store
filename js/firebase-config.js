// js/firebase-config.js - النسخة الكاملة المحدثة

const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK لم يتم تحميله');
            return { success: false, error: 'Firebase SDK لم يتم تحميله' };
        }
        
        // التحقق من الدومين الحالي
        const currentHost = window.location.hostname;
        console.log('🌐 الدومين الحالي:', currentHost);
        console.log('📡 البروتوكول:', window.location.protocol);
        
        // تحقق إذا كان على GitHub Pages
        const isGitHubPages = currentHost.includes('github.io');
        console.log('🚀 على GitHub Pages:', isGitHubPages);
        
        // تهيئة Firebase مرة واحدة فقط
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase تم تهيئته بنجاح');
        } else {
            app = firebase.apps[0];
            console.log('✅ Firebase مهيأ بالفعل');
        }
        
        // الحصول على الخدمات
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // إعدادات خاصة لـ GitHub Pages
        if (isGitHubPages) {
            console.log('⚙️ تطبيق إعدادات GitHub Pages');
            
            // إعدادات Auth لـ GitHub Pages
            try {
                auth.useDeviceLanguage();
                console.log('✅ تم تعيين لغة الجهاز');
            } catch (e) {
                console.warn('⚠️ خطأ في تعيين لغة الجهاز:', e);
            }
            
            // إعدادات Firestore
            if (db) {
                try {
                    db.settings({
                        timestampsInSnapshots: true,
                        ignoreUndefinedProperties: true,
                        merge: true
                    });
                    console.log('✅ تم تعيين إعدادات Firestore');
                } catch (e) {
                    console.warn('⚠️ خطأ في إعدادات Firestore:', e);
                }
            }
        }
        
        // إعدادات عامة
        if (auth && auth.setPersistence) {
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => console.log('✅ تم تعيين ثبات الجلسة'))
                .catch(err => console.warn('⚠️ خطأ في ثبات الجلسة:', err));
        }
        
        // جعلها متاحة عالمياً
        window.firebaseApp = app;
        window.auth = auth;
        window.db = db;
        
        console.log('🎉 خدمات Firebase جاهزة للعمل:', {
            auth: !!auth,
            db: !!db,
            isGitHubPages: isGitHubPages
        });
        
        return { success: true, auth, db, isGitHubPages };
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة Firebase:', error);
        
        // محاولة بديلة إذا فشلت التهيئة
        if (error.code === 'app/duplicate-app') {
            console.log('⚠️ Firebase مهيأ مسبقاً، استخدام النسخة الحالية');
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            return { success: true, auth: window.auth, db: window.db };
        }
        
        return { success: false, error: error.message };
    }
}

// دالة للتحقق من اتصال Firebase
async function testFirebaseConnection() {
    try {
        if (!window.auth || !window.db) {
            return { success: false, error: 'Firebase غير مهيأ' };
        }
        
        console.log('🧪 اختبار اتصال Firebase...');
        
        // اختبار Auth
        const authUser = window.auth.currentUser;
        console.log('👤 المستخدم الحالي في Auth:', authUser?.email || 'لا يوجد');
        
        // اختبار Firestore
        const testRef = window.db.collection('_test').doc('connection');
        try {
            await testRef.set({ test: true, timestamp: new Date() });
            console.log('✅ Firestore يمكن الكتابة');
        } catch (e) {
            console.log('⚠️ Firestore يحتاج إلى تهيئة القواعد:', e.message);
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ فشل اختبار اتصال Firebase:', error);
        return { success: false, error: error.message };
    }
}

window.initializeFirebase = initializeFirebase;
window.testFirebaseConnection = testFirebaseConnection;