const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const emailError = document.getElementById('admin-email-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        emailError.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !email.includes('@')) {
            emailError.textContent = 'Please enter a valid admin email';
            return;
        }

        if (!password) {
            alert('Please enter your password');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || 'Admin login failed');
                return;
            }

            // نخزن بيانات الأدمن في localStorage
            localStorage.setItem('adminUser', JSON.stringify(data.admin));

            alert(`Welcome, ${data.admin.fullname}! Redirecting to admin panel...`);

            // مباشرة نديه لصفحة إضافة المنتجات
            window.location.href = 'admin_products.html';

        } catch (err) {
            console.error(err);
            alert('Error connecting to server');
        }
    });
});
