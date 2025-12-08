 const API_BASE = 'http://localhost:3000';
    let uploadedImagePath = '';

    // معاينة الصورة عند اختيارها
    document.getElementById('productImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.src = e.target.result;
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    });

    // إضافة منتج جديد
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';

        try {
            // 1. رفع الصورة أولاً
            const imageFile = document.getElementById('productImage').files[0];
            
            if (!imageFile) {
                alert('❌ Please select an image');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa fa-plus"></i> Add Product';
                return;
            }

            const formData = new FormData();
            formData.append('productImage', imageFile);

            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading image...';

            const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadResponse.json();

            if (!uploadData.success) {
                alert('❌ Error uploading image: ' + uploadData.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa fa-plus"></i> Add Product';
                return;
            }

            uploadedImagePath = uploadData.imagePath;

            // 2. إضافة المنتج مع مسار الصورة
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding product...';

            const productData = {
                name: document.getElementById('productName').value.trim(),
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                image: uploadedImagePath,
                description: document.getElementById('productDescription').value.trim(),
                sku: document.getElementById('productSKU').value.trim(),
                tags: document.getElementById('productTags').value.trim()
            };

            const productResponse = await fetch(`${API_BASE}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            const productResponseData = await productResponse.json();

            if (productResponseData.success) {
                alert('✅ Product added successfully!');
                document.getElementById('addProductForm').reset();
                document.getElementById('imagePreview').classList.remove('show');
                loadProducts();
            } else {
                alert('❌ Error: ' + productResponseData.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error adding product. Check console for details.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-plus"></i> Add Product';
        }
    });

    // جلب وعرض المنتجات
    async function loadProducts() {
        try {
            const response = await fetch(`${API_BASE}/api/products`);
            const data = await response.json();

            if (data.success && data.products.length > 0) {
                const productsHTML = data.products.map(product => `
                    <div class="product-item">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='products/placeholder.png'">
                        <div class="product-item-info">
                            <h3>${product.name}</h3>
                            <p><strong>Price:</strong> $${parseFloat(product.price).toFixed(2)} | <strong>SKU:</strong> ${product.sku}</p>
                            <p><strong>Category:</strong> ${product.category} | <strong>Status:</strong> ${product.availability}</p>
                        </div>
                        <div class="product-item-actions">
                            <button class="delete-btn" onclick="deleteProduct(${product.id}, '${product.name}')">
                                <i class="fa fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('');

                document.getElementById('productsList').innerHTML = productsHTML;
            } else {
                document.getElementById('productsList').innerHTML = '<p style="text-align: center; color: var(--light-color);">No products found</p>';
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // حذف منتج
    async function deleteProduct(productId, productName) {
        if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/products/${productId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Product deleted successfully!');
                loadProducts();
            } else {
                alert('❌ Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error deleting product');
        }
    }

    // تحميل المنتجات عند فتح الصفحة
    document.addEventListener('DOMContentLoaded', loadProducts);


      document.addEventListener('DOMContentLoaded', () => {
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      alert('Admin login required');
      window.location.href = 'admin.html';
    }
  });
