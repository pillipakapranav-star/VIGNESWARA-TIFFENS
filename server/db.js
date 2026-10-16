const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'tiffin.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      tagline TEXT,
      currency_symbol TEXT NOT NULL DEFAULT '₹',
      currency_code TEXT NOT NULL DEFAULT 'INR',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      whatsapp_number TEXT NOT NULL DEFAULT '919876543210',
      phone_number TEXT NOT NULL DEFAULT '+91 98765 43210',
      upi_id TEXT NOT NULL DEFAULT 'annapurna.tiffin@okhdfcbank',
      upi_name TEXT NOT NULL DEFAULT 'Annapurna Tiffins',
      upi_qr_url TEXT DEFAULT '',
      upi_instructions TEXT,
      min_order_amount REAL NOT NULL DEFAULT 120,
      default_delivery_fee REAL NOT NULL DEFAULT 30,
      free_delivery_above REAL NOT NULL DEFAULT 350,
      is_accepting_orders INTEGER NOT NULL DEFAULT 1,
      business_hours_text TEXT DEFAULT 'Mon - Sun: 7:30 AM - 9:30 PM',
      delivery_areas_json TEXT NOT NULL,
      delivery_slots_json TEXT NOT NULL,
      admin_password_hash TEXT NOT NULL,
      jwt_secret TEXT NOT NULL,
      shop_address TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      icon TEXT DEFAULT '🍱'
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      photo_url TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_special INTEGER NOT NULL DEFAULT 0,
      dietary TEXT NOT NULL DEFAULT 'veg',
      spice_level TEXT NOT NULL DEFAULT 'medium',
      serving_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_area TEXT NOT NULL,
      delivery_slot TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      special_instructions TEXT,
      payment_method TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL
    );
  `);

  // Migrations for existing databases
  try {
    db.exec("ALTER TABLE settings ADD COLUMN shop_address TEXT DEFAULT ''");
  } catch (e) {
    // Column already exists
  }

  // Default seed for settings
  const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!existingSettings) {
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    const defaultJwtSecret = 'tiffin_secret_jwt_key_2026_' + Math.random().toString(36).substring(2);

    const defaultAreas = [
      { id: 'area-1', name: 'Koramangala (All Blocks)', fee: 25, active: true, estimatedTime: '30-45 mins' },
      { id: 'area-2', name: 'HSR Layout (Sectors 1-7)', fee: 30, active: true, estimatedTime: '35-50 mins' },
      { id: 'area-3', name: 'BTM Layout & Tavarekere', fee: 35, active: true, estimatedTime: '40-50 mins' },
      { id: 'area-4', name: 'Indiranagar & Domlur', fee: 40, active: true, estimatedTime: '45-60 mins' },
      { id: 'area-5', name: 'Bellandur & Green Glen Layout', fee: 35, active: true, estimatedTime: '40-55 mins' },
      { id: 'area-6', name: 'Jayanagar & JP Nagar Phase 1-3', fee: 40, active: true, estimatedTime: '45-60 mins' }
    ];

    const defaultSlots = [
      { id: 'slot-b1', mealType: 'Breakfast', label: 'Morning Breakfast', timeRange: '08:00 AM - 09:30 AM', active: true },
      { id: 'slot-l1', mealType: 'Lunch', label: 'Early Lunch', timeRange: '12:00 PM - 01:15 PM', active: true },
      { id: 'slot-l2', mealType: 'Lunch', label: 'Regular Lunch', timeRange: '01:15 PM - 02:30 PM', active: true },
      { id: 'slot-d1', mealType: 'Dinner', label: 'Early Dinner', timeRange: '07:30 PM - 08:45 PM', active: true },
      { id: 'slot-d2', mealType: 'Dinner', label: 'Late Dinner', timeRange: '08:45 PM - 10:00 PM', active: true }
    ];

    const upiInstructions = `1. Scan the QR code or send payment to our UPI ID: annapurna.tiffin@okhdfcbank
2. You can use Google Pay, PhonePe, Paytm, or BHIM.
3. Once paid, click "Continue on WhatsApp" to share the payment screenshot and order details with us.
Note: Payments are manually checked by our team upon order receipt.`;

    db.prepare(`
      INSERT INTO settings (
        id, business_name, tagline, currency_symbol, currency_code, timezone,
        whatsapp_number, phone_number, upi_id, upi_name, upi_qr_url, upi_instructions,
        min_order_amount, default_delivery_fee, free_delivery_above, is_accepting_orders,
        business_hours_text, delivery_areas_json, delivery_slots_json, admin_password_hash, jwt_secret
      ) VALUES (
        1, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `).run(
      'Sri Vigneswara Tiffens',
      'Authentic & Piping Hot South Indian Tiffens, Crispy Dosas & Idlis',
      '₹',
      'INR',
      'Asia/Kolkata',
      '919052850412',
      '+91 90528 50412',
      '9052850412@ybl',
      'Sri Vigneswara Tiffens',
      '',
      upiInstructions,
      120,
      30,
      350,
      1,
      'Mon - Sun: 7:30 AM - 9:30 PM',
      JSON.stringify(defaultAreas),
      JSON.stringify(defaultSlots),
      defaultPasswordHash,
      defaultJwtSecret
    );
  }

  // Seed categories if empty
  const countCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (countCategories === 0) {
    const categories = [
      { name: 'Dosas & Specials', icon: '🥞', order: 1 },
      { name: 'Idly & Vada', icon: '🥯', order: 2 },
      { name: 'Poori, Upma & Pongali', icon: '🍲', order: 3 },
      { name: 'Hot Bajjis & Bondas', icon: '🌶️', order: 4 }
    ];

    const insertCategory = db.prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)');
    categories.forEach(c => insertCategory.run(c.name, c.icon, c.order));

    // Get category IDs
    const cats = db.prepare('SELECT id, name FROM categories').all();
    const catMap = {};
    cats.forEach(c => { catMap[c.name] = c.id; });

    // Seed menu items: exactly the 12 requested tiffins
    const sampleItems = [
      {
        category_id: catMap['Idly & Vada'],
        name: 'Idly',
        description: '3 Pcs soft, steaming fluffy rice idlis served with authentic coconut chutney, peanut chutney, and piping hot sambhar.',
        price: 40,
        photo_url: '/uploads/idly.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'mild',
        serving_info: '3 Pcs + Chutney & Sambhar'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Dosa',
        description: 'Crispy, golden-brown thin crepe made from fermented rice and lentil batter. Served with fresh chutneys and hot sambhar.',
        price: 55,
        photo_url: '/uploads/plain_dosa.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'mild',
        serving_info: '1 Crisp Dosa'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Masala Dosa',
        description: 'Crisp golden dosa filled with our signature spiced potato onion masala, roasted with butter and served with chutneys.',
        price: 70,
        photo_url: '/uploads/masala_dosa.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '1 Dosa with Aloo Masala'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Ghee Karam Dosa',
        description: 'Crispy dosa generously brushed with aromatic pure desi ghee and fiery spicy red chilli garlic karam podi. Local favorite!',
        price: 80,
        photo_url: '/uploads/ghee_karam_dosa.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'veg',
        spice_level: 'spicy',
        serving_info: '1 Pure Desi Ghee Dosa'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Egg Dosa',
        description: 'Crisp dosa topped with a seasoned beaten egg, chopped onions, green chillies, and crushed pepper roasted to perfection.',
        price: 75,
        photo_url: '/uploads/egg_dosa.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'non-veg',
        spice_level: 'medium',
        serving_info: '1 Egg Dosa'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Double Egg Dosa',
        description: 'Hearty dosa loaded with two farm-fresh eggs, spiced onion masala, fresh coriander, and pepper. High protein & filling.',
        price: 95,
        photo_url: '/uploads/double_egg_dosa.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'non-veg',
        spice_level: 'medium',
        serving_info: 'Double Egg Loaded'
      },
      {
        category_id: catMap['Dosas & Specials'],
        name: 'Karam Dosa',
        description: 'Traditional spicy Andhra Rayalaseema style dosa smeared with pungent garlic red-chilli paste and roasted crisp.',
        price: 65,
        photo_url: '/uploads/ghee_karam_dosa.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'spicy',
        serving_info: '1 Spicy Karam Dosa'
      },
      {
        category_id: catMap['Idly & Vada'],
        name: 'Vada',
        description: '2 Pcs crispy on the outside, fluffy inside golden Medu Vada made with whole black gram (urad dal), peppercorns & ginger.',
        price: 45,
        photo_url: '/uploads/vada.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'mild',
        serving_info: '2 Pcs Crispy Medu Vada'
      },
      {
        category_id: catMap['Idly & Vada'],
        name: 'Masala Vada',
        description: '3 Pcs crunchy, deep-fried spiced chana dal patties with chopped onions, fresh mint, coriander, fennel seeds & curry leaves.',
        price: 45,
        photo_url: '/uploads/masala_vada.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '3 Pcs Crunchy Patties'
      },
      {
        category_id: catMap['Poori, Upma & Pongali'],
        name: 'Poori',
        description: '3 Pcs puffed golden whole-wheat pooris served with savory Bombay potato sagu and ginger coconut chutney.',
        price: 60,
        photo_url: '/uploads/poori.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '3 Hot Pooris + Potato Kurma'
      },
      {
        category_id: catMap['Poori, Upma & Pongali'],
        name: 'Upma',
        description: 'Classic comforting semolina (rava) upma tempered with mustard, ginger, green chillies, curry leaves & roasted cashews.',
        price: 45,
        photo_url: '/uploads/upma.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'mild',
        serving_info: '1 Plate (300g) + Chutney'
      },
      {
        category_id: catMap['Poori, Upma & Pongali'],
        name: 'Pongali',
        description: 'Hot, rich South Indian Ven Pongal prepared with rice, yellow moong dal, crushed black peppercorns, cumin, and pure desi ghee tempering.',
        price: 60,
        photo_url: '/uploads/pongali.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'veg',
        spice_level: 'mild',
        serving_info: 'Hot Ghee Pongali (350g) + Sambhar'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Bonda',
        description: '4 Pcs golden crispy outside, soft & fluffy Mysore bondas made with fermented flour, crushed cumin, ginger, and curry leaves. Served with coconut chutney.',
        price: 40,
        photo_url: '/uploads/bonda.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '4 Pcs Mysore Bonda + Chutney'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Bajji',
        description: '4 Pcs classic South Indian golden-fried vegetable bajjis dipped in seasoned spiced gram flour (besan) batter and fried crisp.',
        price: 40,
        photo_url: '/uploads/bajji.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '4 Pcs Mixed Hot Bajjis'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Mirchi Bajji',
        description: '3 Pcs authentic Andhra street-style long green chillies stuffed with tangy ajwain-tamarind, batter-fried crisp, slit and topped with chopped onions & fresh lemon juice.',
        price: 45,
        photo_url: '/uploads/mirchi_bajji.jpg',
        is_available: 1,
        is_special: 1,
        dietary: 'veg',
        spice_level: 'spicy',
        serving_info: '3 Pcs Cut Mirchi + Onion & Lemon'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Aritikaya Bajji',
        description: '4 Pcs raw plantain (green banana) slices coated in ajwain-infused gram flour batter and deep-fried golden and crisp. Served with spicy peanut chutney.',
        price: 40,
        photo_url: '/uploads/aritikaya_bajji.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '4 Pcs Plantain Bajjis'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Alu Bajji',
        description: '4 Pcs tender potato slices dipped in spiced turmeric gram flour batter, deep-fried until puffy, golden and crispy. Classic tea-time favorite.',
        price: 40,
        photo_url: '/uploads/alu_bajji.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'veg',
        spice_level: 'medium',
        serving_info: '4 Pcs Crispy Potato Fritters'
      },
      {
        category_id: catMap['Hot Bajjis & Bondas'],
        name: 'Egg Bajji',
        description: '2 Pcs whole hard-boiled farm eggs halved, dipped in spiced chickpea batter, fried crisp and sprinkled with chaat masala, onions & coriander.',
        price: 50,
        photo_url: '/uploads/egg_bajji.jpg',
        is_available: 1,
        is_special: 0,
        dietary: 'non-veg',
        spice_level: 'medium',
        serving_info: '2 Boiled Eggs (4 Crispy Halves)'
      }
    ];

    const insertItem = db.prepare(`
      INSERT INTO menu_items (
        category_id, name, description, price, photo_url, is_available, is_special, dietary, spice_level, serving_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleItems.forEach(item => {
      insertItem.run(
        item.category_id,
        item.name,
        item.description,
        item.price,
        item.photo_url,
        item.is_available,
        item.is_special,
        item.dietary,
        item.spice_level,
        item.serving_info
      );
    });
  }
}

initDb();

module.exports = db;
