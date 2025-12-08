// auth.js
// إدارة حالة تسجيل الدخول + UI الهيدر + عداد السلة

// التحقق من تسجيل الدخول
function isLoggedIn() {
    const user = localStorage.getItem('user');
    return user !== null;
}

// الحصول على بيانات المستخدم
function getCurrentUser() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            return JSON.parse(user);
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            return null;
        }
    }
    return null;
}

// حفظ بيانات المستخدم (لو احتجتها)
function saveUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('user');
    if (typeof showToast === 'function') {
        showToast('You have been logged out', 'info');
    }
    window.location.href = 'index.html';
}

// التحقق من تسجيل الدخول وإعادة التوجيه إذا لزم الأمر
function requireLogin(redirectUrl = null) {
    if (!isLoggedIn()) {
        if (redirectUrl) {
            localStorage.setItem('redirectAfterLogin', redirectUrl);
        } else {
            localStorage.setItem('redirectAfterLogin', window.location.href);
        }

        if (typeof showToast === 'function') {
            showToast('Please login first to continue', 'info');
        } else {
            alert('Please login first to continue');
        }

        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// حساب عدد عناصر السلة
function getCartItemCount() {
    const savedCart = sessionStorage.getItem('cart');
    if (!savedCart) return 0;

    try {
        const cart = JSON.parse(savedCart);
        return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } catch (e) {
        console.error('Error parsing cart:', e);
        return 0;
    }
}

// تحديث البادج على أيقونة السلة
function updateCartBadge() {
    const cartLink = document.querySelector('.header .icons a[href="cart_page.html"]');
    if (!cartLink) return;

    let badge = cartLink.querySelector('.cart-count-badge');
    const count = getCartItemCount();

    if (count <= 0) {
        if (badge) badge.remove();
        return;
    }

    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-count-badge';
        cartLink.appendChild(badge);
    }

    badge.textContent = count > 9 ? '9+' : count;
}

// تحديث واجهة المستخدم في الهيدر
function updateHeaderUI() {
    const header = document.querySelector('.header');
    if (!header) return;

    const loginLink = document.querySelector('.header .icons a[href="login.html"]');
    let userStatus = header.querySelector('.user-status');
    const user = getCurrentUser();

    if (user && user.fullname) {
        // أخفي زر تسجيل الدخول القديم (الأيقونة)
        if (loginLink) {
            loginLink.style.display = 'none';
        }

        // لو ما فيه عنصر user-status ننشئه
        if (!userStatus) {
            userStatus = document.createElement('div');
            userStatus.className = 'user-status';

            const iconsContainer = header.querySelector('.icons');
            if (iconsContainer) {
                header.insertBefore(userStatus, iconsContainer);
            } else {
                header.appendChild(userStatus);
            }
        }

        userStatus.innerHTML = `
            <span class="welcome-text">Welcome, <strong>${user.fullname}</strong></span>
            <button class="logout-btn">Log out</button>
        `;

        const logoutBtn = userStatus.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    } else {
        if (userStatus) {
            userStatus.remove();
        }
        if (loginLink) {
            loginLink.style.display = '';
        }
    }
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUI();
    updateCartBadge();
});
