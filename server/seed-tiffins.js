const db = require('./db');

// Clear existing items and categories
db.prepare('DELETE FROM order_items').run();
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM menu_items').run();
db.prepare('DELETE FROM categories').run();

// Insert categories
const insertCat = db.prepare('INSERT INTO categories (id, name, display_order, icon) VALUES (?, ?, ?, ?)');
insertCat.run(1, 'Dosas & Specials', 1, '🥞');
insertCat.run(2, 'Idly & Vada', 2, '🥯');
insertCat.run(3, 'Poori, Upma & Pongali', 3, '🍲');

// Insert 12 items exactly as requested by user
const insertItem = db.prepare(`
  INSERT INTO menu_items (
    category_id, name, description, price, photo_url, is_available, is_special, dietary, spice_level, serving_info
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const items = [
  {
    cat: 2,
    name: 'Idly',
    desc: '3 Pcs soft, steaming fluffy rice idlis served with authentic coconut chutney, peanut chutney, and piping hot sambhar.',
    price: 40,
    photo: '/uploads/idly.jpg',
    special: 0,
    dietary: 'veg',
    serving: '3 Pcs + Chutney & Sambhar'
  },
  {
    cat: 1,
    name: 'Dosa',
    desc: 'Crispy, golden-brown thin crepe made from fermented rice and lentil batter. Served with fresh chutneys and hot sambhar.',
    price: 50,
    photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    special: 0,
    dietary: 'veg',
    serving: '1 Crisp Dosa'
  },
  {
    cat: 1,
    name: 'Masala Dosa',
    desc: 'Crisp golden dosa filled with our signature spiced potato onion masala, roasted with butter and served with chutneys.',
    price: 70,
    photo: '/uploads/masala_dosa.jpg',
    special: 1,
    dietary: 'veg',
    serving: '1 Dosa with Aloo Masala'
  },
  {
    cat: 1,
    name: 'Ghee Karam Dosa',
    desc: 'Crispy dosa generously brushed with aromatic pure desi ghee and fiery spicy red chilli garlic karam podi. Local favorite!',
    price: 80,
    photo: '/uploads/ghee_karam_dosa.jpg',
    special: 1,
    dietary: 'veg',
    serving: '1 Pure Desi Ghee Dosa'
  },
  {
    cat: 1,
    name: 'Egg Dosa',
    desc: 'Crisp dosa topped with a seasoned beaten egg, chopped onions, green chillies, and crushed pepper roasted to perfection.',
    price: 75,
    photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    special: 0,
    dietary: 'non-veg',
    serving: '1 Egg Dosa'
  },
  {
    cat: 1,
    name: 'Double Egg Dosa',
    desc: 'Hearty dosa loaded with two farm-fresh eggs, spiced onion masala, fresh coriander, and pepper. High protein & filling.',
    price: 95,
    photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    special: 1,
    dietary: 'non-veg',
    serving: 'Double Egg Loaded'
  },
  {
    cat: 1,
    name: 'Karam Dosa',
    desc: 'Traditional spicy Andhra Rayalaseema style dosa smeared with pungent garlic red-chilli paste and roasted crisp.',
    price: 65,
    photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    special: 0,
    dietary: 'veg',
    serving: '1 Spicy Karam Dosa'
  },
  {
    cat: 2,
    name: 'Vada',
    desc: '2 Pcs crispy on the outside, fluffy inside golden Medu Vada made with whole black gram (urad dal), peppercorns & ginger.',
    price: 45,
    photo: '/uploads/vada.jpg',
    special: 0,
    dietary: 'veg',
    serving: '2 Pcs Crispy Medu Vada'
  },
  {
    cat: 2,
    name: 'Masala Vada',
    desc: '3 Pcs crunchy, deep-fried spiced chana dal patties with chopped onions, fresh mint, coriander, fennel seeds & curry leaves.',
    price: 45,
    photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    special: 0,
    dietary: 'veg',
    serving: '3 Pcs Crunchy Patties'
  },
  {
    cat: 3,
    name: 'Poori',
    desc: '3 Pcs puffed golden whole-wheat pooris served with savory Bombay potato sagu and ginger coconut chutney.',
    price: 60,
    photo: '/uploads/poori.jpg',
    special: 1,
    dietary: 'veg',
    serving: '3 Hot Pooris + Potato Kurma'
  },
  {
    cat: 3,
    name: 'Upma',
    desc: 'Classic comforting semolina (rava) upma tempered with mustard, ginger, green chillies, curry leaves & roasted cashews.',
    price: 45,
    photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    special: 0,
    dietary: 'veg',
    serving: '1 Plate (300g) + Chutney'
  },
  {
    cat: 3,
    name: 'Pongali',
    desc: 'Hot, rich South Indian Ven Pongal prepared with rice, yellow moong dal, crushed black peppercorns, cumin, and pure desi ghee tempering.',
    price: 60,
    photo: '/uploads/pongali.jpg',
    special: 1,
    dietary: 'veg',
    serving: 'Hot Ghee Pongali (350g) + Sambhar'
  }
];

items.forEach(it => {
  insertItem.run(it.cat, it.name, it.desc, it.price, it.photo, 1, it.special, it.dietary, 'medium', it.serving);
});

console.log('Successfully seeded exact 12 tiffin items!');
