const db = require('./db');

// 1. Update Settings Name
db.prepare(`
  UPDATE settings 
  SET business_name = 'Sri Vigneswara Tiffins', 
      upi_name = 'Sri Vigneswara Tiffins',
      tagline = 'Authentic & Piping Hot South Indian Tiffins, Crispy Dosas & Idlis'
  WHERE id = 1
`).run();

// 2. Update Menu Items Photo URLs
const updatePhoto = db.prepare('UPDATE menu_items SET photo_url = ? WHERE name = ?');

updatePhoto.run('/uploads/idly.jpg', 'Idly');
updatePhoto.run('https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80', 'Dosa');
updatePhoto.run('/uploads/masala_dosa.jpg', 'Masala Dosa');
updatePhoto.run('/uploads/ghee_karam_dosa.jpg', 'Ghee Karam Dosa');
updatePhoto.run('/uploads/ghee_karam_dosa.jpg', 'Karam Dosa');
updatePhoto.run('https://images.unsplash.com/photo-1567184109191-378be234f810?auto=format&fit=crop&w=600&q=80', 'Egg Dosa');
updatePhoto.run('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'Double Egg Dosa');
updatePhoto.run('/uploads/vada.jpg', 'Vada');
updatePhoto.run('https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 'Masala Vada');
updatePhoto.run('/uploads/poori.jpg', 'Poori');
updatePhoto.run('https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', 'Upma');
updatePhoto.run('/uploads/pongali.jpg', 'Pongali');

const settings = db.prepare('SELECT business_name, whatsapp_number FROM settings WHERE id = 1').get();
console.log('✓ Business updated:', settings);

const items = db.prepare('SELECT name, photo_url FROM menu_items').all();
console.log('✓ Updated items photos:');
items.forEach(i => console.log(' - ' + i.name + ': ' + i.photo_url));
