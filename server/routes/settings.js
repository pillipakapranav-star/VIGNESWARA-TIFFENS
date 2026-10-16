const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/settings - Public business settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT 
        business_name, tagline, currency_symbol, currency_code, timezone,
        whatsapp_number, phone_number, shop_address, upi_id, upi_name, upi_qr_url, upi_instructions,
        min_order_amount, default_delivery_fee, free_delivery_above, is_accepting_orders,
        business_hours_text, delivery_areas_json, delivery_slots_json
      FROM settings WHERE id = 1
    `).get();

    if (!settings) {
      return res.status(404).json({ error: 'Settings not configured' });
    }

    res.json({
      success: true,
      settings: {
        ...settings,
        delivery_areas: JSON.parse(settings.delivery_areas_json || '[]'),
        delivery_slots: JSON.parse(settings.delivery_slots_json || '[]')
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

module.exports = router;
