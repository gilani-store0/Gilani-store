// js/main.js

import { setupFirebaseAuth } from './modules/auth.js';
import { setupEventListeners } from './modules/ui.js';
import { loadStoreData } from './modules/data.js';

// نقطة دخول التطبيق
document.addEventListener('DOMContentLoaded', function() {
    console.log('تطبيق المتجر يبدأ التشغيل...');
    
    // تحديث السنة في التذييل
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // تهيئة المصادقة
    setupFirebaseAuth();
    
    // إعداد مستمعي الأحداث
    setTimeout(() => {
        setupEventListeners();
        
        // تحميل البيانات الأولية
        loadStoreData().catch(error => {
            console.error('خطأ في تحميل البيانات:', error);
        });
    }, 500); // تأخير لضمان تحميل جميع العناصر
    
    // إضافة مستمعي الأحداث العامة
    document.addEventListener('click', function(e) {
        // إغلاق القوائم عند النقر خارجها
        const userProfileSidebar = document.getElementById('userProfileSidebar');
        const adminSidebar = document.getElementById('adminSidebar');
        const mobileSidebar = document.getElementById('mobileSidebar');
        
        if (userProfileSidebar?.classList.contains('active') && 
            !e.target.closest('#userProfileSidebar') && 
            !e.target.closest('#userToggle') &&
            !e.target.closest('#mobileUserToggle')) {
            closeUserProfile();
        }
        
        if (adminSidebar?.classList.contains('active') && 
            !e.target.closest('#adminSidebar') && 
            !e.target.closest('#adminToggle') &&
            !e.target.closest('#mobileAdminToggle')) {
            closeAdminPanel();
        }
        
        if (mobileSidebar?.classList.contains('active') && 
            !e.target.closest('#mobileSidebar') && 
            !e.target.closest('#menuToggle')) {
            closeMobileSidebar();
        }
    });
    
    // تعطيل إرسال النماذج الافتراضية
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (e.target.id !== 'emailAuthForm' && e.target.id !== 'settingsForm') {
                e.preventDefault();
            }
        });
    });
    
    // إضافة تحميل سلس للصور
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    });
});