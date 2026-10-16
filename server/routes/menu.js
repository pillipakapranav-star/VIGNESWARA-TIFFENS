const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/menu
// Returns categories and menu items
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC, id ASC').all();
    const items = db.prepare(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      JOIN categories c ON m.category_id = c.id 
      ORDER BY m.is_special DESC, m.id ASC
    `).all();

    res.json({
      success: true,
      categories,
      items
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

module.exports = router;
