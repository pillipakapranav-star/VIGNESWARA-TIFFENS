const db = require('./db');

db.prepare(`
  UPDATE settings 
  SET business_name = 'Sri Vigneswara Tiffens', 
      upi_name = 'Sri Vigneswara Tiffens', 
      tagline = 'Authentic & Piping Hot South Indian Tiffens, Crispy Dosas & Idlis' 
  WHERE id = 1
`).run();

const s = db.prepare('SELECT business_name, tagline, upi_name FROM settings WHERE id = 1').get();
console.log('Successfully updated database settings:');
console.log(s);
