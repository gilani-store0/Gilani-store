// js/main.js

import { setupFirebaseAuth } from './modules/auth.js';
import { setupEventListeners } from './modules/ui.js';

// نقطة دخول التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة المصادقة (تبدأ عملية التحقق من حالة المستخدم وتحميل البيانات)
    setupFirebaseAuth();
    
    // إعداد مستمعي الأحداث لواجهة المستخدم
    setupEventListeners();
});
