const express = require('express');
const router = express.Router();
const db = require('../db');

function formatWhatsAppText(order, items, settings) {
  const currency = settings.currency_symbol || '₹';
  let text = `*NEW ORDER - #${order.order_number}*\n`;
  text += `--------------------------------\n`;
  text += `👤 *Customer:* ${order.customer_name}\n`;
  text += `📞 *Phone:* ${order.customer_phone}\n`;
  text += `📍 *Delivery Area:* ${order.delivery_area}\n`;
  text += `🏠 *Address:* ${order.delivery_address}\n`;
  text += `📅 *Date & Slot:* ${order.delivery_date} (${order.delivery_slot})\n`;
  text += `💳 *Payment Method:* ${order.payment_method}\n`;
  text += `--------------------------------\n`;
  text += `*ITEMS ORDERED:*\n`;

  items.forEach(item => {
    text += `• ${item.quantity}x ${item.item_name} @ ${currency}${item.unit_price} = ${currency}${item.total_price}\n`;
  });

  text += `--------------------------------\n`;
  text += `Subtotal: ${currency}${order.subtotal.toFixed(2)}\n`;
  text += `Delivery Fee: ${order.delivery_fee === 0 ? 'FREE' : `${currency}${order.delivery_fee.toFixed(2)}`}\n`;
  text += `*FINAL TOTAL: ${currency}${order.total_amount.toFixed(2)}*\n`;

  if (order.special_instructions && order.special_instructions.trim()) {
    text += `\n📝 *Instructions:* ${order.special_instructions.trim()}\n`;
  }

  if (order.payment_method === 'UPI') {
    text += `\n*UPI Payment:* Placed via UPI (${settings.upi_id}). Screenshot attached below.\n`;
  }

  text += `\nHello! I have placed an order on your tiffin website. Please confirm my order!`;

  return text;
}

function buildWhatsAppUrl(phoneNumber, text) {
  // Clean phone number: remove +, -, spaces
  let cleanNumber = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber; // default to India code if 10 digits
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

// POST /api/orders - Submit a new order
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      delivery_address,
      delivery_area,
      delivery_slot,
      delivery_date,
      special_instructions,
      payment_method,
      items
    } = req.body;

    // Fetch settings
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!settings) {
      return res.status(500).json({ error: 'System settings not found' });
    }

    if (!settings.is_accepting_orders) {
      return res.status(400).json({
        error: 'We are currently not accepting new orders at this moment. Please check our business hours or try again shortly.'
      });
    }

    // Input validations
    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid full name.' });
    }

    const cleanPhone = (customer_phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number.' });
    }

    if (!delivery_address || delivery_address.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a complete delivery address with flat/house number and landmark.' });
    }

    if (!delivery_area) {
      return res.status(400).json({ error: 'Please select a delivery area from the available list.' });
    }

    if (!delivery_slot) {
      return res.status(400).json({ error: 'Please choose a delivery time slot.' });
    }

    if (!delivery_date) {
      return res.status(400).json({ error: 'Please select a delivery date.' });
    }

    if (!['COD', 'UPI'].includes(payment_method)) {
      return res.status(400).json({ error: 'Please select a valid payment method (Cash on Delivery or UPI).' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add items to proceed.' });
    }

    // Parse areas from settings
    const deliveryAreas = JSON.parse(settings.delivery_areas_json || '[]');
    const selectedArea = deliveryAreas.find(a => a.name === delivery_area && a.active !== false);
    if (!selectedArea) {
      return res.status(400).json({ error: `Selected area '${delivery_area}' is currently not in our delivery zone.` });
    }

    // Recalculate subtotal and validate items from DB
    let computedSubtotal = 0;
    const validatedOrderItems = [];

    const getItemStmt = db.prepare('SELECT id, name, price, is_available FROM menu_items WHERE id = ?');

    for (const cartItem of items) {
      const quantity = parseInt(cartItem.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for item ID ${cartItem.id}` });
      }

      const dbItem = getItemStmt.get(cartItem.id);
      if (!dbItem) {
        return res.status(400).json({ error: `Item with ID ${cartItem.id} no longer exists.` });
      }

      if (!dbItem.is_available) {
        return res.status(400).json({ error: `Sorry, "${dbItem.name}" is currently sold out or unavailable.` });
      }

      const itemTotal = Number((dbItem.price * quantity).toFixed(2));
      computedSubtotal += itemTotal;

      validatedOrderItems.push({
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        unit_price: dbItem.price,
        quantity,
        total_price: itemTotal
      });
    }

    computedSubtotal = Number(computedSubtotal.toFixed(2));

    // Check minimum order amount
    if (computedSubtotal < settings.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount is ${settings.currency_symbol}${settings.min_order_amount}. Your current food total is ${settings.currency_symbol}${computedSubtotal}. Please add more items to order.`
      });
    }

    // Compute delivery fee
    let deliveryFee = 0;
    if (computedSubtotal >= settings.free_delivery_above) {
      deliveryFee = 0;
    } else {
      deliveryFee = typeof selectedArea.fee === 'number' ? selectedArea.fee : settings.default_delivery_fee;
    }
    deliveryFee = Number(deliveryFee.toFixed(2));

    const finalTotal = Number((computedSubtotal + deliveryFee).toFixed(2));

    // Generate readable order number: TIF-YYMMDD-XXXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TIF-${yy}${mm}${dd}-${rand}`;

    // Execute transaction
    const insertOrderTx = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, delivery_address, delivery_area,
          delivery_slot, delivery_date, special_instructions, payment_method,
          subtotal, delivery_fee, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
      `);

      const result = orderInsert.run(
        orderNumber,
        customer_name.trim(),
        cleanPhone,
        delivery_address.trim(),
        delivery_area,
        delivery_slot,
        delivery_date,
        (special_instructions || '').trim(),
        payment_method,
        computedSubtotal,
        deliveryFee,
        finalTotal
      );

      const orderId = result.lastInsertRowid;

      const itemInsert = db.prepare(`
        INSERT INTO order_items (
          order_id, menu_item_id, item_name, unit_price, quantity, total_price
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedOrderItems) {
        itemInsert.run(
          orderId,
          item.menu_item_id,
          item.item_name,
          item.unit_price,
          item.quantity,
          item.total_price
        );
      }

      return orderId;
    });

    const orderId = insertOrderTx();

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const createdItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    const whatsappMessage = formatWhatsAppText(createdOrder, createdItems, settings);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number, whatsappMessage);

    res.status(201).json({
      success: true,
      order: {
        ...createdOrder,
        items: createdItems
      },
      whatsappUrl,
      whatsappNumber: settings.whatsapp_number,
      message: 'Order created successfully!'
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/:orderNumber - Fetch order status and details
router.get('/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    const whatsappMessage = formatWhatsAppText(order, items, settings);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number, whatsappMessage);

    res.json({
      success: true,
      order: {
        ...order,
        items
      },
      whatsappUrl,
      whatsappNumber: settings.whatsapp_number,
      currency_symbol: settings.currency_symbol || '₹'
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

module.exports = router;
