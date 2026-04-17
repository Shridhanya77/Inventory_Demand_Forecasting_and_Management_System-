const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'inventory_dev_secret';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/branches', async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, location FROM branches ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(503).json({
        error: 'Database is not set up. Run backend/schema.sql on your database, then npm run seed.',
      });
    }
    next(error);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, branch_id } = req.body;
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const allowedRoles = ['staff', 'center_manager', 'admin', 'master_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Role must be staff, center_manager, admin, or master_admin' });
    }
    const branchId = Number(branch_id);
    if (!Number.isInteger(branchId) || branchId < 1) {
      return res.status(400).json({ error: 'Valid branch is required' });
    }

    const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1', [branchId]);
    if (!branchCheck.rows[0]) {
      return res.status(400).json({ error: 'Branch not found' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const insert = await db.query(
      'INSERT INTO users (name, email, password, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, branch_id',
      [trimmedName, trimmedEmail, passwordHash, role, branchId]
    );

    const user = insert.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, branch_id: user.branch_id },
      jwtSecret,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    console.error('REGISTER ERROR:', error);
    if (error.code === '42P01') {
      return res.status(503).json({
        error: 'Database is not set up. Run backend/schema.sql on the database named in backend/.env (PGDATABASE), then npm run seed.',
      });
    }
    if (error.code === '28P01' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ error: 'Cannot connect to PostgreSQL. Check backend/.env (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await db.query(
      'SELECT id, name, email, password, role, branch_id FROM users WHERE email = $1',
      [trimmedEmail]
    );

    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.password || typeof user.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let matched = false;
    try {
      matched = await bcrypt.compare(String(password), user.password);
    } catch {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!matched) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, branch_id: user.branch_id },
      jwtSecret,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    if (error.code === '42P01') {
      return res.status(503).json({
        error: 'Database is not set up. Run backend/schema.sql on the database named in backend/.env (PGDATABASE), then npm run seed.',
      });
    }
    if (error.code === '28P01' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ error: 'Cannot connect to PostgreSQL. Check backend/.env (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
