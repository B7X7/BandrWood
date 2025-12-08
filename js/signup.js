// signup.js
const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');

    const fullnameError = document.getElementById('fullname-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const confirmError = document.getElementById('confirm-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        [fullnameError, emailError, passwordError, confirmError].forEach(span => {
            span.classList.remove('show');
        });

        const fullname = fullnameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmInput.value.trim();

        let hasError = false;

        if (!fullname) {
            fullnameError.textContent = 'Full name is required';
            fullnameError.classList.add('show');
            hasError = true;
        }

        if (!email || !email.includes('@')) {
            emailError.textContent = 'Please enter a valid email';
            emailError.classList.add('show');
            hasError = true;
        }

        if (!password || password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordError.classList.add('show');
            hasError = true;
        }

        if (password !== confirmPassword) {
            confirmError.textContent = 'Passwords do not match';
            confirmError.classList.add('show');
            hasError = true;
        }

        if (hasError) return;

        try {
            const res = await fetch(`${API_BASE}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                if (res.status === 409) {
                    emailError.textContent = 'Email already registered';
                    emailError.classList.add('show');
                } else {
                    if (typeof showToast === 'function') {
                        showToast(data.message || 'Sign up failed', 'error');
                    } else {
                        alert(data.message || 'Sign up failed');
                    }
                }
                return;
            }

            if (typeof showToast === 'function') {
                showToast('Account created successfully! Redirecting to login...', 'success');
            } else {
                alert('Account created successfully! Redirecting to login...');
            }

            window.location.href = 'login.html';
        } catch (err) {
            console.error(err);
            if (typeof showToast === 'function') {
                showToast('Error connecting to server', 'error');
            } else {
                alert('Error connecting to server');
            }
        }
    });
});
