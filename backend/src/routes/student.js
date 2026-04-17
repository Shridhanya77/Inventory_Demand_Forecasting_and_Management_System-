const express = require('express');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateDataUrl } = require('../utils/qrcode');
const dotenv = require('dotenv');
const mockStore = require('../mock/store');

dotenv.config();

const router = express.Router();
const useMock = process.env.DEV_BYPASS_LOGIN === 'true';
const jwtSecret = process.env.JWT_SECRET || 'inventory_dev_secret';

router.post('/login', async (req, res, next) => {
  if (useMock) {
    const { student_id } = req.body;
    const sid = Number(student_id || 101);
    const student = mockStore.state.students.find((s) => s.id === sid) || { id: sid, name: `Student ${sid}`, branch_id: 1 };
    const token = jwt.sign({ student_id: student.id, name: student.name, branch_id: student.branch_id, role: 'student' }, jwtSecret, { expiresIn: '8h' });
    return res.json({ token, student });
  }
  try {
    const { student_id } = req.body;
    const result = await db.query('SELECT id, name, branch_id FROM students WHERE id = $1', [student_id]);
    const student = result.rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const token = jwt.sign({ student_id: student.id, name: student.name, branch_id: student.branch_id, role: 'student' }, jwtSecret, { expiresIn: '8h' });
    res.json({ token, student });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(503).json({
        error: 'Database is not set up. Run backend/schema.sql, then npm run seed.',
      });
    }
    next(error);
  }
});

router.get('/qr', async (req, res, next) => {
  if (useMock) {
    const { student_id } = req.query;
    const sid = Number(student_id || 101);
    const student = mockStore.state.students.find((s) => s.id === sid) || { id: sid, name: `Student ${sid}` };
    const payload = JSON.stringify({ type: 'student', student_id: sid });
    const qr = await generateDataUrl(payload);
    return res.json({ student_id: sid, name: student.name, qr_code: qr });
  }
  try {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });
    const result = await db.query('SELECT id, name FROM students WHERE id = $1', [student_id]);
    const student = result.rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const payload = JSON.stringify({ type: 'student', student_id: student.id });
    const qr = await generateDataUrl(payload);
    res.json({ student_id: student.id, name: student.name, qr_code: qr });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  if (useMock) {
    const { student_id } = req.query;
    const sid = Number(student_id || 101);
    const history = mockStore.state.studentHistory.filter((row) => row.student_id === sid);
    return res.json(history);
  }
  try {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });
    const transactions = await db.query(
      `SELECT t.id, t.type, t.date, ti.component_id, c.name AS component_name, ti.quantity
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.id
       JOIN components c ON c.id = ti.component_id
       WHERE t.student_id = $1
       ORDER BY t.date DESC`,
      [student_id]
    );
    res.json(transactions.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
