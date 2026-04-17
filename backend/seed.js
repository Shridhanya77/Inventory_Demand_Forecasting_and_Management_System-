const bcrypt = require('bcrypt');
const db = require('./src/config/db');
const dotenv = require('dotenv');

dotenv.config();

/** Nine internship centers (Karnataka / Bengaluru region). */
const INTERNSHIP_CENTERS = [
  ['Belagavi', 'Internship center'],
  ['Hubli', 'Internship center'],
  ['JP P Nagar', 'Internship center — Bengaluru'],
  ['Kalburagi', 'Internship center'],
  ['Mangalore', 'Internship center'],
  ['Mysore', 'Internship center'],
  ['Tumkur', 'Internship center'],
  ['Yelahanka', 'Internship center — Bengaluru'],
  ['Gopalan Mall', 'Internship center — Bengaluru'],
];

const createDefaultAdmin = async () => {
  try {
    for (const [name, location] of INTERNSHIP_CENTERS) {
      await db.query(
        'INSERT INTO branches (name, location) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = $1)',
        [name, location]
      );
    }

    const firstBranch = await db.query("SELECT id FROM branches WHERE name = 'Belagavi' LIMIT 1");
    const branchId = firstBranch.rows[0]?.id;
    if (!branchId) {
      throw new Error('No branch found after seeding internship centers');
    }

    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await db.query(
      'INSERT INTO users (name, email, password, role, branch_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      ['Administrator', 'admin@inventory.local', passwordHash, 'admin', branchId]
    );
    console.log('Internship centers ensured:', INTERNSHIP_CENTERS.map((r) => r[0]).join(', '));
    console.log('Default admin (if new): admin@inventory.local / Admin@123 (branch: Belagavi)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createDefaultAdmin();
