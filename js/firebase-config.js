// js/firebase-config.js - النسخة النهائية المعدلة

const firebaseConfig = {
    apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
    authDomain: "qb-store.firebaseapp.com",
    projectId: "qb-store",
    storageBucket: "qb-store.firebasestorage.app",
    messagingSenderId: "81820788306",
    appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
    measurementId: "G-4K0MDY0W5M"
};

let firebaseInitialized = false;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK لم يتم تحميله');
            return { success: false, error: 'Firebase SDK لم يتم تحميله' };
        }
        
        if (firebaseInitialized) {
            console.log('✅ Firebase مهيأ بالفعل');
            return { success: true };
        }
        
        console.log('🚀 بدء تهيئة Firebase...');
        
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase App تم تهيئته بنجاح');
        } else {
            app = firebase.apps[0];
            console.log('✅ Firebase App موجود بالفعل');
        }
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        let storage = null;
        try {
            if (firebase.storage) {
                storage = firebase.storage();
                console.log('✅ Firebase Storage جاهز');
            }
        } catch (e) {
            console.warn('⚠️ Storage غير متاح:', e.message);
        }
        
        if (db) {
            try {
                db.settings({
                    ignoreUndefinedProperties: true
                });
            } catch (e) {
                console.warn('⚠️ خطأ في إعدادات Firestore:', e);
            }
        }
        
        window.firebaseApp = app;
        window.auth = auth;
        window.db = db;
        window.storage = storage;
        
        firebaseInitialized = true;
        
        console.log('🎉 خدمات Firebase جاهزة:', {
            auth: !!auth,
            db: !!db,
            storage: !!storage
        });
        
        return { success: true, auth, db, storage };
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة Firebase:', error);
        return { success: false, error: error.message };
    }
}

async function uploadImageToStorage(file) {
    try {
        if (!window.storage) {
            throw new Error('Storage غير متاح');
        }
        
        const user = window.auth.currentUser;
        if (!user) {
            throw new Error('يجب تسجيل الدخول');
        }
        
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `products/${user.uid}_${timestamp}_${randomString}`;
        
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(fileName);
        
        console.log('📤 رفع الصورة:', fileName);
        
        const metadata = {
            contentType: file.type || 'image/jpeg'
        };
        
        const uploadTask = await fileRef.put(file, metadata);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        console.log('✅ تم رفع الصورة:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('❌ فشل رفع الصورة:', error);
        throw error;
    }
}

function isStorageAvailable() {
    return window.storage && typeof window.storage.ref === 'function';
}

window.initializeFirebase = initializeFirebase;
window.uploadImageToStorage = uploadImageToStorage;
window.isStorageAvailable = isStorageAvailable;