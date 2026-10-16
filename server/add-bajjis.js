const db = require('./db');

// 1. Ensure category 'Hot Bajjis & Bondas' exists
let bajjiCat = db.prepare("SELECT id FROM categories WHERE name = 'Hot Bajjis & Bondas'").get();
if (!bajjiCat) {
  const result = db.prepare("INSERT INTO categories (name, display_order, icon) VALUES ('Hot Bajjis & Bondas', 4, '🌶️')").run();
  bajjiCat = { id: result.lastInsertRowid };
}

const catId = bajjiCat.id;

// 2. Prepare items
const bajjiItems = [
  {
    name: 'Bonda',
    desc: '4 Pcs golden crispy outside, soft & fluffy Mysore bondas made with fermented flour, crushed cumin, ginger, and curry leaves. Served with coconut chutney.',
    price: 40,
    photo_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    dietary: 'veg',
    serving_info: '4 Pcs Mysore Bonda + Chutney'
  },
  {
    name: 'Bajji',
    desc: '4 Pcs classic South Indian golden-fried vegetable bajjis dipped in seasoned spiced gram flour (besan) batter and fried crisp.',
    price: 40,
    photo_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    dietary: 'veg',
    serving_info: '4 Pcs Mixed Hot Bajjis'
  },
  {
    name: 'Mirchi Bajji',
    desc: '3 Pcs authentic Andhra street-style long green chillies stuffed with tangy ajwain-tamarind, batter-fried crisp, slit and topped with chopped onions & fresh lemon juice.',
    price: 45,
    photo_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    dietary: 'veg',
    serving_info: '3 Pcs Cut Mirchi + Onion & Lemon'
  },
  {
    name: 'Aritikaya Bajji',
    desc: '4 Pcs raw plantain (green banana) slices coated in ajwain-infused gram flour batter and deep-fried golden and crisp. Served with spicy peanut chutney.',
    price: 40,
    photo_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    dietary: 'veg',
    serving_info: '4 Pcs Plantain Bajjis'
  },
  {
    name: 'Alu Bajji',
    desc: '4 Pcs tender potato slices dipped in spiced turmeric gram flour batter, deep-fried until puffy, golden and crispy. Classic tea-time favorite.',
    price: 40,
    photo_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    dietary: 'veg',
    serving_info: '4 Pcs Crispy Potato Fritters'
  },
  {
    name: 'Egg Bajji',
    desc: '2 Pcs whole hard-boiled farm eggs halved, dipped in spiced chickpea batter, fried crisp and sprinkled with chaat masala, onions & coriander.',
    price: 50,
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    dietary: 'non-veg',
    serving_info: '2 Boiled Eggs (4 Crispy Halves)'
  }
];

const checkItem = db.prepare('SELECT id FROM menu_items WHERE name = ?');
const insertItem = db.prepare(`
  INSERT INTO menu_items (
    category_id, name, description, price, photo_url, is_available, is_special, dietary, spice_level, serving_info
  ) VALUES (?, ?, ?, ?, ?, 1, 0, ?, 'medium', ?)
`);
const updateItem = db.prepare(`
  UPDATE menu_items 
  SET category_id = ?, description = ?, price = ?, photo_url = ?, dietary = ?, serving_info = ?
  WHERE id = ?
`);

bajjiItems.forEach(item => {
  const existing = checkItem.get(item.name);
  if (existing) {
    updateItem.run(catId, item.desc, item.price, item.photo_url, item.dietary, item.serving_info, existing.id);
    console.log(`Updated existing item: ${item.name}`);
  } else {
    insertItem.run(catId, item.name, item.desc, item.price, item.photo_url, item.dietary, item.serving_info);
    console.log(`Added new item: ${item.name}`);
  }
});

const allItems = db.prepare('SELECT name, price FROM menu_items').all();
console.log('✓ Total items in Sri Vigneswara Tiffins now:', allItems.length);
