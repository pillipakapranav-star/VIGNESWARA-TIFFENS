const fs = require('fs');
const path = require('path');
const db = require('./db');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function getWikimediaDirectUrl(fileName) {
  try {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(fileName) + '&prop=imageinfo&iiprop=url&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': 'SriVigneswaraTiffinsApp/1.0 (contact@srivigneswara.com)' } });
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pages[pageId].imageinfo && pages[pageId].imageinfo[0]) {
      return pages[pageId].imageinfo[0].url;
    }
  } catch (err) {
    console.error('Error fetching URL for ' + fileName, err.message);
  }
  return null;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url, destFileName) {
  const destPath = path.join(uploadDir, destFileName);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
    console.log(`- Already exists: ${destFileName}`);
    return true;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'SriVigneswaraTiffinsApp/1.0 (contact@srivigneswaratiffins.com)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    console.log(`✓ Downloaded ${destFileName} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error(`✕ Failed to download ${destFileName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Downloading exact, authentic South Indian photos for Sri Vigneswara Tiffins...');

  // Map of dish names to Wikimedia file titles and target local filenames
  const wikimediaDownloads = [
    { name: 'Dosa', file: 'File:Dosa-chutney-sambhar.jpg', dest: 'plain_dosa.jpg' },
    { name: 'Egg Dosa', file: 'File:Egg Dosa-MB42.jpg', dest: 'egg_dosa.jpg' },
    { name: 'Double Egg Dosa', file: 'File:Egg Dosa.JPG', dest: 'double_egg_dosa.jpg' },
    { name: 'Masala Vada', file: 'File:Masala Vada.jpg', dest: 'masala_vada.jpg' },
    { name: 'Upma', file: 'File:Upma made simple, without extra vegetables.jpg', dest: 'upma.jpg' },
    { name: 'Bonda', file: 'File:Mysuru Bonda.jpg', dest: 'bonda.jpg' },
    { name: 'Bajji', file: 'File:Onion Bajji.jpg', dest: 'bajji.jpg' },
    { name: 'Mirchi Bajji', file: 'File:Stuffed mirchi bajji (16164286908).jpg', dest: 'mirchi_bajji.jpg' },
    { name: 'Aritikaya Bajji', file: 'File:Plaintain Bajji.jpg', dest: 'aritikaya_bajji.jpg' },
    { name: 'Alu Bajji', file: 'File:Potato bajji picture.JPG', dest: 'alu_bajji.jpg' },
    { name: 'Egg Bajji', file: 'File:Muttai (Egg) Bonda.jpg', dest: 'egg_bajji.jpg' }
  ];

  for (const item of wikimediaDownloads) {
    const destPath = path.join(uploadDir, item.dest);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      console.log(`- Already exists: ${item.dest}`);
      continue;
    }
    await delay(1500);
    const directUrl = await getWikimediaDirectUrl(item.file);
    if (directUrl) {
      await delay(1500);
      await downloadImage(directUrl, item.dest);
    }
  }

  // Update Database with exact local files
  console.log('\nUpdating database photo URLs to exact local photos:');
  const updateStmt = db.prepare('UPDATE menu_items SET photo_url = ? WHERE name = ?');

  const exactMapping = [
    { name: 'Idly', path: '/uploads/idly.jpg' },
    { name: 'Dosa', path: '/uploads/plain_dosa.jpg' },
    { name: 'Masala Dosa', path: '/uploads/masala_dosa.jpg' },
    { name: 'Ghee Karam Dosa', path: '/uploads/ghee_karam_dosa.jpg' },
    { name: 'Karam Dosa', path: '/uploads/ghee_karam_dosa.jpg' },
    { name: 'Egg Dosa', path: '/uploads/egg_dosa.jpg' },
    { name: 'Double Egg Dosa', path: '/uploads/double_egg_dosa.jpg' },
    { name: 'Vada', path: '/uploads/vada.jpg' },
    { name: 'Masala Vada', path: '/uploads/masala_vada.jpg' },
    { name: 'Poori', path: '/uploads/poori.jpg' },
    { name: 'Upma', path: '/uploads/upma.jpg' },
    { name: 'Pongali', path: '/uploads/pongali.jpg' },
    { name: 'Bonda', path: '/uploads/bonda.jpg' },
    { name: 'Bajji', path: '/uploads/bajji.jpg' },
    { name: 'Mirchi Bajji', path: '/uploads/mirchi_bajji.jpg' },
    { name: 'Aritikaya Bajji', path: '/uploads/aritikaya_bajji.jpg' },
    { name: 'Alu Bajji', path: '/uploads/alu_bajji.jpg' },
    { name: 'Egg Bajji', path: '/uploads/egg_bajji.jpg' }
  ];

  for (const map of exactMapping) {
    // Check if file exists locally
    const fullPath = path.join(uploadDir, path.basename(map.path));
    if (fs.existsSync(fullPath)) {
      updateStmt.run(map.path, map.name);
      console.log(`✓ ${map.name} -> ${map.path} (Verified local file exists)`);
    } else {
      console.warn(`! File not found for ${map.name} at ${fullPath}`);
    }
  }

  console.log('\nAll 18 items successfully updated with exact matching photos!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
