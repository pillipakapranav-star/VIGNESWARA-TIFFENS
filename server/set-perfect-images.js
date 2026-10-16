const fs = require('fs');
const path = require('path');
const db = require('./db');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

fs.copyFileSync(path.join(uploadDir, 'egg_dosa.jpg'), path.join(uploadDir, 'egg_dosa_perfect.jpg'));
fs.copyFileSync(path.join(uploadDir, 'double_egg_dosa.jpg'), path.join(uploadDir, 'double_egg_dosa_perfect.jpg'));
fs.copyFileSync(path.join(uploadDir, 'onion_pakoda.jpg'), path.join(uploadDir, 'onion_pakoda_perfect.jpg'));

db.prepare("UPDATE menu_items SET photo_url = '/uploads/egg_dosa_perfect.jpg' WHERE name = 'Egg Dosa'").run();
db.prepare("UPDATE menu_items SET photo_url = '/uploads/double_egg_dosa_perfect.jpg' WHERE name = 'Double Egg Dosa'").run();
db.prepare("UPDATE menu_items SET photo_url = '/uploads/onion_pakoda_perfect.jpg', name = 'Onion Pakoda' WHERE name = 'Onion Pakoda' OR name = 'Bajji'").run();

const rows = db.prepare("SELECT name, photo_url FROM menu_items WHERE name IN ('Egg Dosa', 'Double Egg Dosa', 'Onion Pakoda')").all();
console.log('Successfully updated items:');
rows.forEach(r => console.log(` • ${r.name} -> ${r.photo_url}`));
