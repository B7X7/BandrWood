// products.js
const API_BASE = 'http://localhost:3000';

let allProductsCache = [];

// جلب جميع المنتجات
async function fetchProducts() {
    try {
        console.log('Fetching products from:', `${API_BASE}/api/products`);
        const response = await fetch(`${API_BASE}/api/products`);

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Products data:', data);

        if (data.success) {
            return data.products;
        } else {
            console.error('API returned success: false');
            return [];
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// دالة عامة لعرض المنتجات في الصفحة
function renderProductsList(products) {
    const container = document.querySelector('.products .box-container');

    if (!container) {
        console.error('Container not found!');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fa fa-exclamation-circle" style="font-size: 5rem; color: #666; margin-bottom: 1rem;"></i>
                <p style="font-size: 2rem; color: #666; margin-bottom: 1rem;">No products found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="box">
            <a href="product_details.html?id=${product.id}" class="card-link">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='products/placeholder.png'">
                <h1>${product.name}</h1>
                <div class="price">$ ${parseFloat(product.price).toFixed(2)}</div>
                <a href="product_details.html?id=${product.id}" class="btn">add to cart</a>
            </a>
        </div>
    `).join('');
}

// عرض المنتجات في الصفحة الرئيسية
async function displayProducts() {
    const container = document.querySelector('.products .box-container');

    if (!container) {
        console.error('Container not found!');
        return;
    }

    container.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; font-size: 2rem; color: #666;">
            Loading products...
        </p>
    `;

    const products = await fetchProducts();
    allProductsCache = products;

    renderProductsList(products);
}

// جلب منتج واحد بالـ ID
async function fetchProductById(productId) {
    try {
        console.log('Fetching product:', productId);
        const response = await fetch(`${API_BASE}/api/products/${productId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Product data:', data);

        if (data.success) {
            return data.product;
        } else {
            console.error('Product not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// عرض تفاصيل المنتج
async function displayProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Product ID not found in URL');
        window.location.href = 'index.html';
        return;
    }

    const product = await fetchProductById(productId);

    if (!product) {
        alert('Product not found');
        window.location.href = 'index.html';
        return;
    }

    document.title = `${product.name} - BandrWood`;

    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = product.image;
        mainImage.alt = product.name;
        mainImage.onerror = function () {
            this.src = 'products/placeholder.png';
        };
    }

    const productInfo = document.querySelector('.product-info');
    if (productInfo) {
        productInfo.querySelector('h1').textContent = product.name;
        productInfo.querySelector('.current-price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
        productInfo.querySelector('.product-description p').textContent = product.description || 'No description available';

        const metaItems = productInfo.querySelectorAll('.meta-item span');
        if (metaItems.length >= 4) {
            metaItems[0].textContent = product.category;
            metaItems[1].textContent = product.availability === 'in_stock' ? 'In Stock' : 'Out of Stock';
            metaItems[1].style.color = product.availability === 'in_stock' ? 'var(--green)' : 'red';
            metaItems[2].textContent = product.sku;
            metaItems[3].textContent = product.tags || 'N/A';
        }
    }

    window.currentProduct = product;
}

// إضافة للسلة (توجيه للـ cart عبر URL)
function addToCart() {
    const quantity = document.getElementById('quantity').value;
    const product = window.currentProduct;

    if (!product) {
        alert('Product information not available');
        return;
    }

    const url = 'cart_page.html'
        + '?product=' + encodeURIComponent(product.name)
        + '&quantity=' + encodeURIComponent(quantity)
        + '&price=' + encodeURIComponent(product.price)
        + '&image=' + encodeURIComponent(product.image);

    window.location.href = url;
}

// البحث عن المنتجات
async function searchProducts(query) {
    try {
        const response = await fetch(`${API_BASE}/api/products/search/${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success) {
            return data.products;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

// جلب المنتجات حسب الفئة
async function fetchProductsByCategory(category) {
    try {
        const response = await fetch(`${API_BASE}/api/products/category/${encodeURIComponent(category)}`);
        const data = await response.json();

        if (data.success) {
            return data.products;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
}

// التعامل مع البحث
async function handleSearch() {
    const input = document.getElementById('productSearchInput');
    if (!input) return;

    const query = input.value.trim();

    if (!query) {
        renderProductsList(allProductsCache);
        return;
    }

    const products = await searchProducts(query);
    renderProductsList(products);
}

// التعامل مع الفلتر حسب الفئة
async function handleCategoryFilter(category, buttonElement) {
    if (category === 'all') {
        renderProductsList(allProductsCache);
    } else {
        const products = await fetchProductsByCategory(category);
        renderProductsList(products);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
}

// تشغيل الكود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, pathname:', window.location.pathname);

    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/' || path === '') {
        console.log('Loading products for home page...');
        displayProducts().then(() => {
            const searchBtn = document.getElementById('productSearchBtn');
            const searchInput = document.getElementById('productSearchInput');
            const filterButtons = document.querySelectorAll('.filter-btn');

            if (searchBtn && searchInput) {
                searchBtn.addEventListener('click', handleSearch);
                searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') handleSearch();
                });
            }

            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const category = btn.getAttribute('data-category');
                    handleCategoryFilter(category, btn);
                });
            });
        });
    }

    if (path.includes('product_details.html')) {
        console.log('Loading product details...');
        displayProductDetails();
    }
});
