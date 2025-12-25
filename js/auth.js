// js/auth.js - معالجة المصادقة (تحديثات طفيفة)

// ... (الكود الأصلي يبقى كما هو مع إضافة هذه الدوال في النهاية)

// تحميل بيانات المستخدم عند تسجيل الدخول
export async function loadUserProfile(user) {
    try {
        const userData = await getUserData(user);
        if (userData) {
            // تحديث العرض في واجهة المستخدم
            const profileSection = document.getElementById('profileSection');
            if (profileSection && !profileSection.classList.contains('hidden')) {
                document.getElementById('editPhone').value = userData.phone || '';
                document.getElementById('editAddress').value = userData.address || '';
                
                // تحديث تاريخ الانضمام
                const joinDateEl = document.getElementById('profileJoinDate');
                if (joinDateEl && userData.createdAt) {
                    const date = userData.createdAt.toDate();
                    joinDateEl.textContent = 'تاريخ الانضمام: ' + date.toLocaleDateString('ar-SA');
                }
            }
        }
        return userData;
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        return null;
    }
}

// تحديث حالة المستخدم في الذاكرة المحلية
export function updateLocalUserState(user, isAdmin) {
    try {
        const userState = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: isAdmin,
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem('jamalek_user', JSON.stringify(userState));
    } catch (error) {
        console.error('خطأ في حفظ حالة المستخدم:', error);
    }
}

// جلب حالة المستخدم من الذاكرة المحلية
export function getLocalUserState() {
    try {
        const savedState = localStorage.getItem('jamalek_user');
        return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
        console.error('خطأ في جلب حالة المستخدم:', error);
        return null;
    }
}

// مسح حالة المستخدم من الذاكرة المحلية
export function clearLocalUserState() {
    localStorage.removeItem('jamalek_user');
    localStorage.removeItem('jamalek_cart'); // مسح السلة أيضاً
}