// js/modules/utils.js

/**
 * عرض رسالة إشعار للمستخدم (Toastify)
 * @param {string} message - الرسالة المراد عرضها
 * @param {'success'|'error'|'warning'|'info'} type - نوع الرسالة
 */
export function showCustomToast(message, type = 'info') {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = 'linear-gradient(to right, #00b09b, #96c93d)';
            break;
        case 'error':
            backgroundColor = 'linear-gradient(to right, #ff5f6d, #ffc371)';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(to right, #fbd786, #f7797d)';
            break;
        case 'info':
        default:
            backgroundColor = 'linear-gradient(to right, #00bbff, #007bff)';
            break;
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: backgroundColor,
            fontFamily: 'Cairo, sans-serif',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
        offset: {
            x: 10,
            y: 50
        }
    }).showToast();
}

/**
 * إظهار رسالة خطأ عامة في شاشة المصادقة
 * @param {string} message - رسالة الخطأ
 * @param {string} inputId - معرف حقل الإدخال لتسليط الضوء عليه (اختياري)
 */
export function showError(message, inputId = null) {
    const errorDiv = document.getElementById('generalError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('active');
        
        // إزالة الخطأ بعد 5 ثوانٍ
        setTimeout(() => {
            errorDiv.classList.remove('active');
        }, 5000);
    }
    
    if (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add('error-border');
            setTimeout(() => {
                input.classList.remove('error-border');
            }, 3000);
        }
    }
}

/**
 * إظهار حالة التحميل على زر معين
 * @param {HTMLElement} button - الزر المراد إظهار حالة التحميل عليه
 */
export function showLoading(button) {
    if (!button) return;
    button.disabled = true;
    button.originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
}

/**
 * إخفاء حالة التحميل من زر معين
 * @param {HTMLElement} button - الزر المراد إخفاء حالة التحميل منه
 */
export function hideLoading(button) {
    if (!button || !button.originalText) return;
    button.disabled = false;
    button.innerHTML = button.originalText;
    delete button.originalText;
}

/**
 * التحقق من صحة نموذج المصادقة
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {string[]} - قائمة بالأخطاء
 */
export function validateAuthForm(email, password) {
    const errors = [];
    if (!email || !password) {
        errors.push("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
    }
    if (password && password.length < 6) {
        errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }
    // تحقق بسيط من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push("البريد الإلكتروني غير صالح");
    }
    return errors;
}

// تم إزالة دالة getClientIP() لتجنب التبعية الخارجية ومشاكل الخصوصية.
// سيتم الاعتماد على UID و UserAgent في سجلات الأدمن.
