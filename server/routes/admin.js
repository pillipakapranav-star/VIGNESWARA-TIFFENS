const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { generateToken, authMiddleware } = require('../auth');

// Multer setup for image uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
  }
});

// POST /api/admin/login
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const row = db.prepare('SELECT admin_password_hash, business_name FROM settings WHERE id = 1').get();
    if (!row) {
      return res.status(500).json({ error: 'System not initialized' });
    }

    const isMatch = bcrypt.compareSync(password, row.admin_password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect admin password' });
    }

    const token = generateToken({ role: 'admin', business: row.business_name });
    res.json({
      success: true,
      token,
      message: 'Admin authenticated successfully'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/admin/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const row = db.prepare('SELECT admin_password_hash FROM settings WHERE id = 1').get();
    const isMatch = bcrypt.compareSync(currentPassword, row.admin_password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE settings SET admin_password_hash = ? WHERE id = 1').run(newHash);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/admin/orders
router.get('/orders', authMiddleware, (req, res) => {
  try {
    const { status, date, slot, search, limit = 100 } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND delivery_date = ?';
      params.push(date);
    }

    if (slot && slot !== 'all') {
      query += ' AND delivery_slot = ?';
      params.push(slot);
    }

    if (search) {
      query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const orders = db.prepare(query).all(...params);

    // Attach items to each order
    const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: getItemsStmt.all(ord.id)
    }));

    res.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

    res.json({
      success: true,
      order: {
        ...updated,
        items
      },
      message: `Order status updated to "${status}"`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/admin/reports - Analytics & Sales summary
router.get('/reports', authMiddleware, (req, res) => {
  try {
    // Current date in YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);

    // Today's summary (excluding Cancelled)
    const todaySummary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(subtotal), 0) as total_subtotal
      FROM orders 
      WHERE DATE(created_at) = DATE('now', 'localtime') AND status != 'Cancelled'
    `).get();

    // All time summary
    const allTimeSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales
      FROM orders
      WHERE status != 'Cancelled'
    `).get();

    // Status breakdown
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `).all();

    // Payment breakdown
    const paymentBreakdown = db.prepare(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE status != 'Cancelled'
      GROUP BY payment_method
    `).all();

    // Top selling items
    const topItems = db.prepare(`
      SELECT 
        oi.item_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      GROUP BY oi.item_name
      ORDER BY total_sold DESC
      LIMIT 6
    `).all();

    // Orders by slot
    const slotStats = db.prepare(`
      SELECT delivery_slot, COUNT(*) as count 
      FROM orders 
      WHERE status != 'Cancelled'
      GROUP BY delivery_slot
    `).all();

    // Recent 7 days trend
    const recentTrend = db.prepare(`
      SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE status != 'Cancelled'
      GROUP BY DATE(created_at)
      ORDER BY order_date DESC
      LIMIT 7
    `).all();

    res.json({
      success: true,
      today: todaySummary,
      allTime: allTimeSummary,
      statusCounts,
      paymentBreakdown,
      topItems,
      slotStats,
      recentTrend
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// Menu Management
// POST /api/admin/menu - Create menu item
router.post('/menu', authMiddleware, (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      photo_url,
      is_available = 1,
      is_special = 0,
      dietary = 'veg',
      spice_level = 'medium',
      serving_info
    } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const result = db.prepare(`
      INSERT INTO menu_items (
        category_id, name, description, price, photo_url, is_available, is_special, dietary, spice_level, serving_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      parseInt(category_id, 10),
      name.trim(),
      (description || '').trim(),
      numPrice,
      (photo_url || '').trim(),
      is_available ? 1 : 0,
      is_special ? 1 : 0,
      dietary,
      spice_level,
      (serving_info || '').trim()
    );

    const newItem = db.prepare(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      JOIN categories c ON m.category_id = c.id 
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/admin/menu/:id - Update menu item
router.put('/menu/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      price,
      photo_url,
      is_available,
      is_special,
      dietary,
      spice_level,
      serving_info
    } = req.body;

    const existing = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    db.prepare(`
      UPDATE menu_items SET
        category_id = ?,
        name = ?,
        description = ?,
        price = ?,
        photo_url = ?,
        is_available = ?,
        is_special = ?,
        dietary = ?,
        spice_level = ?,
        serving_info = ?
      WHERE id = ?
    `).run(
      parseInt(category_id, 10),
      name.trim(),
      (description || '').trim(),
      numPrice,
      (photo_url || '').trim(),
      is_available ? 1 : 0,
      is_special ? 1 : 0,
      dietary || 'veg',
      spice_level || 'medium',
      (serving_info || '').trim(),
      id
    );

    const updatedItem = db.prepare(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      JOIN categories c ON m.category_id = c.id 
      WHERE m.id = ?
    `).get(id);

    res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// PATCH /api/admin/menu/:id/price - Quick price update
router.patch('/menu/:id/price', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Valid positive price is required' });
    }

    const item = db.prepare('SELECT id, name FROM menu_items WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('UPDATE menu_items SET price = ? WHERE id = ?').run(numPrice, id);

    res.json({
      success: true,
      id,
      price: numPrice,
      message: `Price for "${item.name}" updated to ₹${numPrice}`
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

// PATCH /api/admin/toggle-store - 1-click toggle Open / Closed
router.patch('/toggle-store', authMiddleware, (req, res) => {
  try {
    const current = db.prepare('SELECT is_accepting_orders FROM settings WHERE id = 1').get();
    const newStatus = current.is_accepting_orders === 1 ? 0 : 1;
    db.prepare('UPDATE settings SET is_accepting_orders = ? WHERE id = 1').run(newStatus);

    res.json({
      success: true,
      is_accepting_orders: newStatus,
      message: newStatus === 1 ? 'Store is now OPEN and accepting orders' : 'Store is now CLOSED'
    });
  } catch (error) {
    console.error('Error toggling store status:', error);
    res.status(500).json({ error: 'Failed to toggle store status' });
  }
});

// PATCH /api/admin/menu/:id/toggle - Quick toggle availability
router.patch('/menu/:id/toggle', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT id, is_available, name FROM menu_items WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newStatus = item.is_available ? 0 : 1;
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newStatus, id);

    res.json({
      success: true,
      id,
      is_available: newStatus,
      message: `${item.name} is now ${newStatus ? 'Available' : 'Unavailable (Sold Out)'}`
    });
  } catch (error) {
    console.error('Error toggling item availability:', error);
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
});

// DELETE /api/admin/menu/:id - Delete menu item
router.delete('/menu/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, name FROM menu_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    res.json({ success: true, message: `"${existing.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Categories Management
// GET /api/admin/categories
router.get('/categories', authMiddleware, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC, id ASC').all();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/admin/categories
router.post('/categories', authMiddleware, (req, res) => {
  try {
    const { name, icon = '🍱' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM categories').get().m || 0;
    const result = db.prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)').run(
      name.trim(),
      icon.trim() || '🍱',
      maxOrder + 1
    );

    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, category: newCat });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const count = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?').get(id).count;
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete category: it has ${count} items. Please reassign or delete the items first.`
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Settings Management
// GET /api/admin/settings
router.get('/settings', authMiddleware, (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT 
        business_name, tagline, currency_symbol, currency_code, timezone,
        whatsapp_number, phone_number, shop_address, upi_id, upi_name, upi_qr_url, upi_instructions,
        min_order_amount, default_delivery_fee, free_delivery_above, is_accepting_orders,
        business_hours_text, delivery_areas_json, delivery_slots_json
      FROM settings WHERE id = 1
    `).get();

    res.json({
      success: true,
      settings: {
        ...settings,
        delivery_areas: JSON.parse(settings.delivery_areas_json || '[]'),
        delivery_slots: JSON.parse(settings.delivery_slots_json || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PUT /api/admin/settings
router.put('/settings', authMiddleware, (req, res) => {
  try {
    const {
      business_name,
      tagline,
      currency_symbol,
      currency_code,
      timezone,
      whatsapp_number,
      phone_number,
      shop_address,
      upi_id,
      upi_name,
      upi_qr_url,
      upi_instructions,
      min_order_amount,
      default_delivery_fee,
      free_delivery_above,
      is_accepting_orders,
      business_hours_text,
      delivery_areas,
      delivery_slots
    } = req.body;

    if (!business_name || !whatsapp_number) {
      return res.status(400).json({ error: 'Business name and WhatsApp number are required' });
    }

    db.prepare(`
      UPDATE settings SET
        business_name = ?,
        tagline = ?,
        currency_symbol = ?,
        currency_code = ?,
        timezone = ?,
        whatsapp_number = ?,
        phone_number = ?,
        shop_address = ?,
        upi_id = ?,
        upi_name = ?,
        upi_qr_url = ?,
        upi_instructions = ?,
        min_order_amount = ?,
        default_delivery_fee = ?,
        free_delivery_above = ?,
        is_accepting_orders = ?,
        business_hours_text = ?,
        delivery_areas_json = ?,
        delivery_slots_json = ?
      WHERE id = 1
    `).run(
      business_name.trim(),
      (tagline || '').trim(),
      currency_symbol || '₹',
      currency_code || 'INR',
      timezone || 'Asia/Kolkata',
      (whatsapp_number || '').trim(),
      (phone_number || '').trim(),
      (shop_address || '').trim(),
      (upi_id || '').trim(),
      (upi_name || '').trim(),
      (upi_qr_url || '').trim(),
      (upi_instructions || '').trim(),
      parseFloat(min_order_amount) || 0,
      parseFloat(default_delivery_fee) || 0,
      parseFloat(free_delivery_above) || 0,
      is_accepting_orders ? 1 : 0,
      (business_hours_text || '').trim(),
      JSON.stringify(delivery_areas || []),
      JSON.stringify(delivery_slots || [])
    );

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/admin/upload - Image upload
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

module.exports = router;
