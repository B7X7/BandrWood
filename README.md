# BandrWood Grocery Web App 🛒

A full-stack grocery web application built by **Bandr Yasser Alghamdi** as a university project.  
The app simulates a real online store:

- Customers can sign up, log in, browse products, search & filter.
- They can add items to cart and place orders.
- Admin can manage products (add / edit / delete) and view data.

---

## 🔧 Tech Stack

**Frontend:**
- HTML5, CSS3
- Vanilla JavaScript
- Responsive layout

**Backend:**
- Node.js
- Express.js

**Database:**
- MySQL

---

## 🧩 Main Features

### 👤 Authentication
- User sign up & login.
- Session stored on the client using `localStorage`.
- Dynamic header:
  - Shows `Welcome, {username}` when logged in.
  - `Log out` button clears session.
- Certain actions (like checkout) require login.

### 🛍 Products
- Products stored in MySQL database.
- Home page fetches products from `/api/products`.
- Search bar:
  - Search by product name using `/api/products/search/:query`.
- Category filters:
  - Filter products by category using `/api/products/category/:category`.

### 🛒 Cart & Orders
- Cart stored in `sessionStorage` on the browser.
- User can:
  - Add products from the product details page.
  - Increase / decrease quantity.
  - Remove items from cart.
- Summary section:
  - Subtotal
  - Shipping (flat 5.00)
  - Tax (15%)
  - Total
- Checkout:
  - Creates a real order in the database (`orders` + `order_items` tables).
  - Linked to the logged-in user.

### 📩 Contact Us
- Contact form page where users can send a message.
- Data is sent to the backend via `/api/contact`.
- Messages are stored in a `contact_messages` table in MySQL.

### 🛠 Admin
- Separate admin login page (`admin.html`).
- Admin login via `/api/admin/login` and `is_admin` flag in `users` table.
- Admin products page:
  - Add new products (with image upload).
  - View existing products.
  - Delete products.

---

## 📁 Project Structure

```text
project/
├── js/
│   ├── auth.js             # login state, header UI, cart badge
│   ├── login.js            # user login logic
│   ├── signup.js           # user sign up logic
│   ├── products.js         # fetch + display + search + filter products
│   ├── cart.js             # cart management + checkout
│   ├── contact.js          # contact us form -> backend
│   ├── admin_login.js      # admin login logic
│   ├── admin_products.js   # admin products management
│   └── ui.js               # toast notifications
├── index.html              # home page (products)
├── cart_page.html          # cart page
├── product_details.html    # product details page
├── login.html              # user login
├── signup.html             # user sign up
├── admin.html              # admin login
├── admin_products.html     # admin products dashboard
├── Contact-us.html         # contact form
├── About-us.html           # about page
├── server.js               # Express backend + API endpoints
├── style.css               # global styling
└── products/               # product images
