# 🍱 Sri Vigneswara Tiffens - Online Ordering App

A modern, mobile-friendly online ordering web application for **Sri Vigneswara Tiffens**, featuring authentic South Indian breakfast and daily tiffens (Idly, Crispy Dosas, Ghee Karam Dosa, Medu Vada, Poori, Pongali, and more). Built with Node.js, Express, SQLite, and a mobile-optimized React client.

---

## 🌟 Key Features

### 🛒 Customer Experience
- **Authentic South Indian Tiffin Menu:** Browse mouth-watering tiffins with high-resolution food photos, descriptions, portion details, prices in **INR (₹)**, dietary indicators (Pure Veg / Egg), and "Today's Special" tags.
- **Category Filter & Instant Search:** Quickly filter between Dosas & Specials, Idly & Vada, and Poori, Upma & Pongali.
- **Interactive Cart & Live Fee Calculation:**
  - Dynamic item quantity increment/decrement.
  - Automatically calculates delivery fee based on selected area.
  - **Free Delivery progress banner** (e.g., *Free delivery on orders above ₹350*).
  - Minimum order amount validation (e.g., minimum ₹120).
- **Delivery Details & Slot Scheduling:**
  - Collects customer's full name, 10-digit Indian phone number, full address with flat number & landmark.
  - Select delivery area from owner-defined delivery zones.
  - Select delivery date and specific meal time slot (e.g. Morning Breakfast, Early Lunch, Regular Lunch, Early Dinner, Late Dinner).
  - Optional special instructions for cooking or delivery (e.g. *Less spicy*, *Leave at security*).
- **Payment Method:**
  - **Cash on Delivery (COD)**.
  - **UPI (Google Pay, PhonePe, Paytm, BHIM):** Shows store UPI ID, Payee Name, one-tap copy button, and QR code view.
  - Transparent notice: *Payments are not auto-verified; customers verify by sharing the payment screenshot on WhatsApp.*
- **Order Confirmation & WhatsApp Integration:**
  - Generates unique Order ID (e.g. `#TIF-261016-3477`).
  - Celebration confetti explosion!
  - **"Continue on WhatsApp" Button:** Pre-fills the entire order breakdown (customer details, address, slot, ordered items snapshot, subtotal, delivery fee, and total) into a `wa.me` chat link.
  - Clear explainer: *WhatsApp messages are not sent automatically. The customer must tap 'Send' inside WhatsApp to confirm.*
- **Order Tracker:** Customers can look up any order number to see real-time status progression (*Order Received → Accepted → Preparing → Out for Delivery → Delivered*).

---

### 🛡️ Owner / Admin Dashboard
- **Password-Protected Portal:** Secure login with hashed passwords and JWT token authentication.
  - **Default Password:** `admin123` *(Can be changed anytime inside the dashboard)*.
- **Live Order Management:**
  - View real-time orders with audio/visual status badges.
  - Filter orders by status (*All, New, Accepted, Preparing, Out for Delivery, Delivered, Cancelled*).
  - Update status with one click.
  - **"WhatsApp Customer" button:** Instantly opens a WhatsApp chat with the customer containing their name and current order status.
  - Preserves ordered item names and prices at the time of order placement.
- **Menu Management:**
  - Add new dishes, edit existing items, change prices, descriptions, and serving sizes.
  - Upload custom food photos (stored in `public/uploads`) or paste image URLs.
  - One-tap toggle to mark dishes as **In Stock** or **Sold Out Today**.
  - Toggle "Today's Special" highlight badge.
  - Delete items.
- **Sales & Order Reporting:**
  - Today's orders count and total sales revenue (calculated in `Asia/Kolkata` time).
  - All-time orders and revenue.
  - Payment method breakdown (UPI vs COD split).
  - Top 6 best-selling tiffins & dishes.
- **Business Settings Management:**
  - **WhatsApp Number:** Change the business WhatsApp phone number (with country code e.g. `919876543210`).
  - **Shop Address:** Configure your shop/kitchen physical location (displayed with a location pin on the hero banner and footer).
  - **Calling Phone Number** and **Business Hours text**.
  - **Store Open/Closed Toggle:** Temporarily stop taking new orders if the kitchen is full.
  - **Delivery Areas & Fees:** Customize delivery zones, estimated delivery times, and specific area fees.
  - **Delivery Slots:** Configure available meal slots (Breakfast, Lunch, Dinner).
  - **Pricing Rules:** Set minimum order amount, default delivery fee, and free delivery threshold.
  - **UPI Settings:** Update UPI ID (VPA), payee name, custom QR code image, and customer payment instructions.
  - **Timezone & Currency:** Configurable (`Asia/Kolkata` and `₹ / INR` by default).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Installation
All dependencies are already installed. If running on a new machine:
```bash
# In the project root directory
npm install

# In the client directory
cd client
npm install
cd ..
```

### 2. Running the Application
To run the unified server (serving both the backend API and the built frontend on port 5000):
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:5000
```

### 3. Development Mode
To run with live reload during development:
- **Backend Server:** `node server/index.js` (runs on port 5000)
- **Frontend Dev Server:** `npm run dev:client` (runs on port 3000 with automatic proxy to port 5000)

### 4. Building the Frontend
Whenever you modify frontend React components in `client/src`:
```bash
npm run build
```
This bundles the optimized production assets directly into `client/dist/`.

---

## 📱 How to Change the WhatsApp Number

You can change the business WhatsApp number in two convenient ways:

### Method A: From the Owner Dashboard (Recommended, No restart needed)
1. Open the app at `http://localhost:5000`.
2. Click **Admin** in the top navigation bar.
3. Enter password: `admin123` (or your updated password).
4. Go to the **Store Settings** tab.
5. In the **WhatsApp Number** field, enter your WhatsApp phone number with country code (e.g. `919052850412` for India).
6. Click **Save All Settings**. The customer "Continue on WhatsApp" button will instantly use your new number!

### Method B: In Code / Database
The database is located at `data/tiffin.db`. The default seed is defined in `server/db.js` under the `initDb()` function where `whatsapp_number` defaults to `'919052850412'`.

---

## 🔒 Admin Credentials & Security
- **Default Master Password:** `admin123`
- **How to Change Password:**
  1. Log into the Admin Dashboard.
  2. Navigate to the **Security** tab.
  3. Enter your current password and set your new password (minimum 6 characters).
  4. The password is hashed using `bcrypt` and securely stored in SQLite. Admin API endpoints are secured with JSON Web Tokens (JWT). Secrets are never exposed to the frontend.

---

## 📁 Project Structure

```
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Favicons and static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx          # Protected owner control center
│   │   │   ├── CartDrawer.jsx              # Bottom slide-out checkout & UPI
│   │   │   ├── CategoryNav.jsx             # Category scrollable pill bar
│   │   │   ├── Header.jsx                  # Sticky header with branding & status
│   │   │   ├── Hero.jsx                    # Welcoming food banner & incentives
│   │   │   ├── MenuItemCard.jsx            # Food cards with photo & counter
│   │   │   ├── OrderConfirmationModal.jsx  # Confetti + WhatsApp CTA
│   │   │   └── OrderTrackerModal.jsx       # Order tracking step progress
│   │   ├── api.js              # REST client for backend endpoints
│   │   ├── App.jsx             # Main application orchestrator
│   │   ├── index.css           # Vanilla CSS culinary design system
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML template with Google Fonts
│   ├── package.json
│   └── vite.config.js          # Vite config with API proxy
├── data/
│   └── tiffin.db               # Persistent SQLite database (WAL mode)
├── public/
│   └── uploads/                # Uploaded dish photos & QR images
├── server/
│   ├── routes/
│   │   ├── admin.js            # Auth, orders status, reports, menu CRUD, settings
│   │   ├── menu.js             # Public menu retrieval
│   │   ├── orders.js           # Server-side validated order placement & tracking
│   │   └── settings.js         # Public business settings
│   ├── auth.js                 # JWT verification and auth middleware
│   ├── db.js                   # SQLite schema, migrations, and seed data
│   └── index.js                # Express entry point & static SPA host
├── package.json
└── README.md
```

---

## 🍛 Default Sample Menu Included
The database automatically seeds 15 authentic dishes across 6 categories:
1. **Daily Thalis & Combos:** Special Ghar Ki Thali (Paneer Butter Masala, 4 Phulkas, Dal Tadka, Rice, Gulab Jamun), Executive Tiffin, Diet High-Protein Meal Box.
2. **Breakfast Specials:** Desi Poha with Roasted Peanuts, Aloo Pyaz Paratha Combo with Makkhan, Soft Idli & Crispy Vada Tiffin.
3. **Homestyle Curries & Dal:** Punjabi Rajma Masala, Desi Ghee Dal Tadka, Paneer Bhurji Homestyle.
4. **Fresh Rotis & Parathas:** Phulka / Chapati Pack (4 Pcs), Methi Thepla Pack.
5. **Rice & Khichdi:** Comfort Moong Dal Khichdi Bowl, Jeera Basmati Rice Bowl.
6. **Beverages & Sweets:** Ghar Ki Masala Buttermilk (Chaas), Hot Desi Ghee Gulab Jamun.

The owner can add, edit, or delete any of these dishes through the admin dashboard!
