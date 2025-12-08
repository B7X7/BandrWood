const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'products');
        
        // إنشاء المجلد إذا لم يكن موجوداً
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // إنشاء اسم فريد للملف
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // حد أقصى 5MB
    },
    fileFilter: function (req, file, cb) {
        // السماح فقط بالصور
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',       
    password: 'root',     
    database: 'bandrwood_db', 
    port: 3306
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error(' Error connecting to MySQL:', err);
    } else {
        console.log(' Connected to MySQL database');
        connection.release();
    }
});

// ================== HEALTH CHECK ==================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ================== AUTH ROUTES ==================

// Sign Up
app.post('/api/signup', (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';
    pool.query(sql, [fullname, email, password], (err, result) => {
        if (err) {
            console.error('Error in signup:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res
                    .status(409)
                    .json({ success: false, message: 'Email already registered' });
            }

            return res
                .status(500)
                .json({ success: false, message: 'Server error: ' + err.code });
        }

        return res.json({ success: true, message: 'User created successfully' });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: 'Missing email or password' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error in login:', err);
            return res
                .status(500)
                .json({ success: false, message: 'Server error: ' + err.code });
        }

        if (results.length === 0) {
            return res
                .status(401)
                .json({ success: false, message: 'Email not found' });
        }

        const user = results[0];

        if (user.password !== password) {
            return res
                .status(401)
                .json({ success: false, message: 'Incorrect password' });
        }

        return res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email
            }
        });
    });
});

// ================== FILE UPLOAD ==================

// رفع صورة منتج
app.post('/api/upload', upload.single('productImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const imagePath = 'products/' + req.file.filename;

        return res.json({
            success: true,
            message: 'File uploaded successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading file: ' + error.message
        });
    }
});

// ================== PRODUCTS ROUTES ==================

// Get all products
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products WHERE availability = "in_stock" ORDER BY created_at DESC';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching products' 
            });
        }

        return res.json({
            success: true,
            products: results
        });
    });
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE id = ?';
    
    pool.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching product' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.json({
            success: true,
            product: results[0]
        });
    });
});

// Get product by SKU
app.get('/api/products/sku/:sku', (req, res) => {
    const sku = req.params.sku;
    const sql = 'SELECT * FROM products WHERE sku = ?';
    
    pool.query(sql, [sku], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching product' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.json({
            success: true,
            product: results[0]
        });
    });
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
    const category = req.params.category;
    const sql = 'SELECT * FROM products WHERE category = ? AND availability = "in_stock"';
    
    pool.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching products' 
            });
        }

        return res.json({
            success: true,
            products: results
        });
    });
});

// Search products
app.get('/api/products/search/:query', (req, res) => {
    const query = req.params.query;
    const sql = `
        SELECT * FROM products 
        WHERE (name LIKE ? OR description LIKE ? OR tags LIKE ?) 
        AND availability = "in_stock"
    `;
    const searchTerm = `%${query}%`;
    
    pool.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('Error searching products:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error searching products' 
            });
        }

        return res.json({
            success: true,
            products: results
        });
    });
});

// Add new product
app.post('/api/products', (req, res) => {
    const { name, price, category, image, description, sku, tags } = req.body;

    if (!name || !price || !category || !image || !sku) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }

    const sql = `
        INSERT INTO products (name, price, category, image, description, sku, tags) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    pool.query(sql, [name, price, category, image, description, sku, tags], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Product SKU already exists' 
                });
            }

            return res.status(500).json({ 
                success: false, 
                message: 'Error adding product' 
            });
        }

        return res.json({
            success: true,
            message: 'Product added successfully',
            productId: result.insertId
        });
    });
});

// Update product
app.put('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const { name, price, category, image, description, tags, availability } = req.body;

    const sql = `
        UPDATE products 
        SET name = ?, price = ?, category = ?, image = ?, 
            description = ?, tags = ?, availability = ?
        WHERE id = ?
    `;
    
    pool.query(
        sql, 
        [name, price, category, image, description, tags, availability, productId], 
        (err, result) => {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating product' 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            return res.json({
                success: true,
                message: 'Product updated successfully'
            });
        }
    );
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    
    // أولاً: احصل على مسار الصورة لحذفها
    const selectSql = 'SELECT image FROM products WHERE id = ?';
    
    pool.query(selectSql, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting product' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const imagePath = results[0].image;
        
        // احذف المنتج من قاعدة البيانات
        const deleteSql = 'DELETE FROM products WHERE id = ?';
        
        pool.query(deleteSql, [productId], (err, result) => {
            if (err) {
                console.error('Error deleting product:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error deleting product' 
                });
            }

            // احذف الصورة من المجلد
            const fullImagePath = path.join(__dirname, imagePath);
            if (fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
                console.log('Image deleted:', fullImagePath);
            }

            return res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// ================== CONTACT ROUTES ==================

app.post('/api/contact', (req, res) => {
    const { firstName, lastName, gender, mobile, dob, email, language, message } = req.body;

    // تحقق من الحقول المطلوبة
    if (!firstName || !lastName || !gender || !mobile || !dob || !email || !language || !message) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const sql = `
        INSERT INTO contact_messages 
            (first_name, last_name, gender, mobile, dob, email, language, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    pool.query(
        sql,
        [firstName, lastName, gender, mobile, dob, email, language, message],
        (err, result) => {
            if (err) {
                console.error('Error saving contact message:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while saving contact message'
                });
            }

            return res.json({
                success: true,
                message: 'Message saved successfully'
            });
        }
    );
});


// ================== ADMIN LOGIN ==================



app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND is_admin = 1 LIMIT 1';

    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching admin:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        const admin = results[0];

        if (admin.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        return res.json({
            success: true,
            admin: {
                id: admin.id,
                fullname: admin.fullname,
                email: admin.email
            }
        });
    });
});

// Create order
app.post('/api/orders', (req, res) => {
	const { userId, items, totals } = req.body;

	if (!userId || !Array.isArray(items) || items.length === 0 || !totals) {
		return res.status(400).json({
			success: false,
			message: 'Missing order data'
		});
	}

	const { subtotal, shipping, tax, total } = totals;

	const orderSql = `
		INSERT INTO orders (user_id, subtotal, shipping, tax, total)
		VALUES (?, ?, ?, ?, ?)
	`;

	pool.query(orderSql, [userId, subtotal, shipping, tax, total], (err, result) => {
		if (err) {
			console.error('Error creating order:', err);
			return res.status(500).json({
				success: false,
				message: 'Error creating order'
			});
		}

		const orderId = result.insertId;

		const itemsSql = `
			INSERT INTO order_items (order_id, product_name, price, quantity, image)
			VALUES ?
		`;

		const values = items.map(item => [
			orderId,
			item.name,
			item.price,
			item.quantity,
			item.image || null
		]);

		pool.query(itemsSql, [values], (err2) => {
			if (err2) {
				console.error('Error inserting order items:', err2);
				return res.status(500).json({
					success: false,
					message: 'Error saving order items'
				});
			}

			return res.json({
				success: true,
				message: 'Order created successfully',
				orderId
			});
		});
	});
});

