// cart.js

const CART_API_BASE = 'http://localhost:3000';

let cart = [];

// حفظ السلة في sessionStorage
function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// تحميل السلة من sessionStorage
function loadCartFromStorage() {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Error parsing cart from sessionStorage:', e);
            cart = [];
        }
    } else {
        cart = [];
    }
}

// إضافة منتج للسلة
function addItemToCart(name, quantity, price, image) {
    const existing = cart.find(item => item.name === name && item.price === parseFloat(price));
    const qty = parseInt(quantity);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            name,
            quantity: qty,
            price: parseFloat(price),
            image
        });
    }

    saveCart();
}

// إزالة منتج من السلة
function removeItem(index) {
    if (!confirm('Remove this item from cart?')) return;

    cart.splice(index, 1);
    saveCart();
    renderCart();
    if (typeof updateCartBadge === 'function') updateCartBadge();
}

// زيادة الكمية
function increaseQuantity(index) {
    if (cart[index].quantity < 10) {
        cart[index].quantity++;
        saveCart();
        renderCart();
        if (typeof updateCartBadge === 'function') updateCartBadge();
    }
}

// تقليل الكمية
function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
        saveCart();
        renderCart();
        if (typeof updateCartBadge === 'function') updateCartBadge();
    }
}

// تحديث ملخص السلة (Subtotal / Shipping / Tax / Total)
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = cart.length > 0 ? 5.00 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;

    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// عرض محتوى السلة في الصفحة
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    // هنا رجّعنا نفس الـ HTML اللي كان عندك في cart_page.html
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fa fa-shopping-cart"></i>
                <h3>Your Cart is Empty</h3>
                <p>Looks like you haven't added any items to your cart yet.</p>
                <a href="index.html" class="btn">Start Shopping</a>
            </div>
        `;
        updateSummary();
        return;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button onclick="decreaseQuantity(${index})">-</button>
                    <input type="number" value="${item.quantity}" readonly>
                    <button onclick="increaseQuantity(${index})">+</button>
                </div>
            </div>
            <i class="fa fa-trash cart-item-remove" onclick="removeItem(${index})"></i>
        </div>
    `).join('');

    updateSummary();
}

// تحميل السلة (من التخزين + من الـ URL لو جاي من صفحة المنتج)
function loadCart() {
    loadCartFromStorage();

    const urlParams = new URLSearchParams(window.location.search);
    const productName = urlParams.get('product');
    const quantity = urlParams.get('quantity');
    const price = urlParams.get('price');
    const image = urlParams.get('image');

    if (productName && quantity && price) {
        addItemToCart(
            decodeURIComponent(productName),
            decodeURIComponent(quantity),
            decodeURIComponent(price),
            image ? decodeURIComponent(image) : ''
        );

        // إزالة البرامترات من الرابط عشان ما تتكرر الإضافة عند الـ refresh
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }

    renderCart();
    if (typeof updateCartBadge === 'function') updateCartBadge();
}

// Checkout حقيقي: ينشئ Order في الداتا بيس
async function checkout() {
    if (cart.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Your cart is empty!', 'error');
        } else {
            alert('Your cart is empty!');
        }
        return;
    }

    // تأكد من تسجيل الدخول
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        if (typeof showToast === 'function') {
            showToast('Please login to complete your order', 'info');
        } else {
            alert('Please login to complete your order');
        }

        if (typeof requireLogin === 'function') {
            requireLogin(window.location.href);
        } else {
            window.location.href = 'login.html';
        }
        return;
    }

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user || !user.id) {
        if (typeof showToast === 'function') {
            showToast('User info not available', 'error');
        } else {
            alert('User info not available');
        }
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = cart.length > 0 ? 5.00 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;

    const orderPayload = {
        userId: user.id,
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        })),
        totals: {
            subtotal,
            shipping,
            tax,
            total
        }
    };

    try {
        const res = await fetch(`${CART_API_BASE}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            if (typeof showToast === 'function') {
                showToast(data.message || 'Error creating order', 'error');
            } else {
                alert(data.message || 'Error creating order');
            }
            return;
        }

        if (typeof showToast === 'function') {
            showToast(`Thank you ${user.fullname}! Your order #${data.orderId} has been placed.`, 'success');
        } else {
            alert(`Thank you ${user.fullname}! Your order #${data.orderId} has been placed.`);
        }

        cart = [];
        saveCart();
        renderCart();
        if (typeof updateCartBadge === 'function') updateCartBadge();

    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') {
            showToast('Error connecting to server', 'error');
        } else {
            alert('Error connecting to server');
        }
    }
}

// تشغيل كود السلة فقط في صفحة cart_page.html
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('cart_page.html')) {
        loadCart();
    }
});
