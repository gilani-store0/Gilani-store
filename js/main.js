// js/main.js

import { setupFirebaseAuth } from './modules/auth.js';
import { setupEventListeners } from './modules/ui.js';

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
    }, 100); // تأخير بسيط لضمان تحميل DOM
    
    // إضافة مستمعي الأحداث العامة
    document.addEventListener('click', function(e) {
        // إغلاق القوائم عند النقر خارجها
        const userProfileSidebar = document.getElementById('userProfileSidebar');
        const adminSidebar = document.getElementById('adminSidebar');
        const mobileSidebar = document.getElementById('mobileSidebar');
        
        if (userProfileSidebar?.classList.contains('active') && 
            !e.target.closest('#userProfileSidebar') && 
            !e.target.closest('#userToggle')) {
            userProfileSidebar.classList.remove('active');
            document.getElementById('userProfileOverlay')?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        if (adminSidebar?.classList.contains('active') && 
            !e.target.closest('#adminSidebar') && 
            !e.target.closest('#adminToggle')) {
            adminSidebar.classList.remove('active');
            document.getElementById('adminOverlay')?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        if (mobileSidebar?.classList.contains('active') && 
            !e.target.closest('#mobileSidebar') && 
            !e.target.closest('#menuToggle')) {
            mobileSidebar.classList.remove('active');
            document.getElementById('sidebarOverlay')?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // تعطيل إرسال النماذج الافتراضية
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
});