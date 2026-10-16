const fs = require('fs');
const path = require('path');
const db = require('./db');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadFile(url, destName) {
  const destPath = path.join(uploadDir, destName);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SriVigneswaraTiffinsApp/1.0 (contact@srivigneswaratiffins.com)' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`✓ Downloaded ${destName} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error(`✕ Failed to download ${destName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Downloading new images for Egg Dosa, Double Egg Dosa, and Onion Pakoda...');

  const downloads = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Egg_dosa.jpg',
      dest: 'egg_dosa.jpg'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Egg_Dosa.JPG',
      dest: 'double_egg_dosa.jpg'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Onion_Pakoda.jpg',
      dest: 'onion_pakoda.jpg'
    }
  ];

  for (const item of downloads) {
    await downloadFile(item.url, item.dest);
    await delay(1500);
  }

  // 1. Rename 'Bajji' to 'Onion Pakoda' and update details
  const updateBajji = db.prepare(`
    UPDATE menu_items 
    SET name = 'Onion Pakoda',
        description = 'Crispy, crunchy South Indian street-style onion pakodas made with thinly sliced onions, seasoned gram flour, rice flour, curry leaves, and green chillies.',
        serving_info = '1 Plate (200g) Crispy Onion Pakoda',
        photo_url = '/uploads/onion_pakoda.jpg'
    WHERE name = 'Bajji' OR name = 'Onion Pakoda'
  `);
  updateBajji.run();
  console.log('✓ Renamed Bajji -> Onion Pakoda in database');

  // 2. Update Egg Dosa photo
  db.prepare(`
    UPDATE menu_items 
    SET photo_url = '/uploads/egg_dosa.jpg',
        description = 'Crispy golden dosa topped with seasoned beaten egg, chopped onions, and crushed black pepper cooked fresh on tawa.'
    WHERE name = 'Egg Dosa'
  `).run();
  console.log('✓ Updated Egg Dosa image & description');

  // 3. Update Double Egg Dosa photo
  db.prepare(`
    UPDATE menu_items 
    SET photo_url = '/uploads/double_egg_dosa.jpg',
        description = 'Thick, high-protein street-style dosa loaded with two farm-fresh eggs, onions, green chillies, and pepper.'
    WHERE name = 'Double Egg Dosa'
  `).run();
  console.log('✓ Updated Double Egg Dosa image & description');

  // Verify
  const items = db.prepare("SELECT name, photo_url, price FROM menu_items WHERE name IN ('Egg Dosa', 'Double Egg Dosa', 'Onion Pakoda')").all();
  console.log('\nVerified updated items in database:');
  items.forEach(i => console.log(` • ${i.name} (₹${i.price}): ${i.photo_url}`));
}

main().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
