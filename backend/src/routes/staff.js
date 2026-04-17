const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { permit } = require('../middleware/roles');
const mockStore = require('../mock/store');

const router = express.Router();
router.use(authenticate, permit('staff', 'center_manager'));
const useMock = process.env.DEV_BYPASS_LOGIN === 'true';

router.get('/dashboard', async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const stock = await db.query(
      `SELECT c.id AS component_id, c.name, bs.quantity
       FROM branch_stock bs
       JOIN components c ON c.id = bs.component_id
       WHERE bs.branch_id = $1`,
      [branchId]
    );
    const lowStock = stock.rows.filter((item) => item.quantity <= 5);
    res.json({ stock: stock.rows, lowStock });
  } catch (error) {
    next(error);
  }
});

router.post('/stock/add', async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const { component_id, quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    const result = await db.query(
      `INSERT INTO branch_stock (branch_id, component_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (branch_id, component_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity
       RETURNING *`,
      [branchId, component_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/students', async (req, res, next) => {
  if (useMock) {
    const branchId = req.user.branch_id || 1;
    const { name } = req.body;
    const created = { id: mockStore.state.ids.students++, name, branch_id: branchId };
    mockStore.state.students.push(created);
    mockStore.logAudit('register_student', `student:${created.id}`, req.user.id);
    return res.status(201).json(created);
  }
  try {
    const branchId = req.user.branch_id;
    const { name } = req.body;
    const result = await db.query('INSERT INTO students (name, branch_id) VALUES ($1, $2) RETURNING *', [name, branchId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/issue', async (req, res, next) => {
  if (useMock) {
    const { student_id, items } = req.body;
    const item = items?.[0];
    if (!student_id || !item) return res.status(400).json({ error: 'Invalid issue payload' });
    const stock = mockStore.state.branchStock.find(
      (s) => s.branch_id === (req.user.branch_id || 1) && s.component_id === Number(item.component_id)
    );
    const available = stock?.quantity || 0;
    if (available < Number(item.quantity)) return res.status(400).json({ error: 'Insufficient stock' });
    stock.quantity -= Number(item.quantity);
    mockStore.state.studentHistory.unshift({
      id: mockStore.state.ids.transactions++,
      student_id: Number(student_id),
      type: 'issue',
      date: new Date().toISOString(),
      component_id: Number(item.component_id),
      component_name: mockStore.getComponentName(item.component_id),
      quantity: Number(item.quantity),
    });
    mockStore.logAudit('issue_component', `student:${student_id}`, req.user.id);
    return res.status(201).json({ transactionId: mockStore.state.ids.transactions - 1 });
  }
  try {
    const branchId = req.user.branch_id;
    const { student_id, items, project_id, project_name, project_code } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

    await db.pool.query('BEGIN');

    let resolvedProjectId = project_id != null ? Number(project_id) : null;
    if (resolvedProjectId != null && (!Number.isInteger(resolvedProjectId) || resolvedProjectId < 1)) {
      await db.pool.query('ROLLBACK');
      return res.status(400).json({ error: 'project_id must be a positive integer' });
    }
    if (!resolvedProjectId && (project_name || project_code)) {
      const name = String(project_name || '').trim();
      if (!name) {
        await db.pool.query('ROLLBACK');
        return res.status(400).json({ error: 'project_name is required when creating a project' });
      }
      const created = await db.query(
        'INSERT INTO projects (branch_id, name, code, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [branchId, name, project_code ? String(project_code).trim() : null, 'active', req.user.id]
      );
      resolvedProjectId = created.rows[0].id;
    }

    const transactionResult = await db.query(
      'INSERT INTO transactions (student_id, branch_id, project_id, type, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [student_id, branchId, resolvedProjectId, 'issue']
    );
    const transaction = transactionResult.rows[0];

    for (const item of items) {
      const { component_id, quantity } = item;
      if (quantity <= 0) throw new Error('Quantity must be positive');
      const stock = await db.query(
        'SELECT quantity FROM branch_stock WHERE branch_id = $1 AND component_id = $2 FOR UPDATE',
        [branchId, component_id]
      );
      const available = stock.rows[0]?.quantity || 0;
      if (available < quantity) throw new Error('Insufficient stock for component ' + component_id);
      await db.query(
        'UPDATE branch_stock SET quantity = quantity - $1 WHERE branch_id = $2 AND component_id = $3',
        [quantity, branchId, component_id]
      );
      await db.query(
        'INSERT INTO transaction_items (transaction_id, component_id, quantity, type) VALUES ($1, $2, $3, $4)',
        [transaction.id, component_id, quantity, 'issue']
      );
    }

    await db.pool.query('COMMIT');
    res.status(201).json({ transactionId: transaction.id, project_id: resolvedProjectId });
  } catch (error) {
    await db.pool.query('ROLLBACK');
    next(error);
  }
});

router.post('/return', async (req, res, next) => {
  if (useMock) {
    const { student_id, component_id, quantity } = req.body;
    if (Number(quantity) <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    mockStore.upsertBranchStock(req.user.branch_id || 1, component_id, Number(quantity));
    mockStore.state.studentHistory.unshift({
      id: mockStore.state.ids.transactions++,
      student_id: Number(student_id),
      type: 'return',
      date: new Date().toISOString(),
      component_id: Number(component_id),
      component_name: mockStore.getComponentName(component_id),
      quantity: Number(quantity),
    });
    mockStore.logAudit('return_component', `student:${student_id}`, req.user.id);
    return res.status(201).json({ transactionId: mockStore.state.ids.transactions - 1 });
  }
  try {
    const branchId = req.user.branch_id;
    const { student_id, component_id, quantity, items, project_id, close_project } = req.body;
    const normalizedItems =
      Array.isArray(items) && items.length
        ? items
        : component_id != null
          ? [{ component_id, quantity, condition: 'returned' }]
          : [];
    if (!normalizedItems.length) return res.status(400).json({ error: 'No items provided' });

    await db.pool.query('BEGIN');
    const resolvedProjectId = project_id != null ? Number(project_id) : null;
    if (resolvedProjectId != null && (!Number.isInteger(resolvedProjectId) || resolvedProjectId < 1)) {
      await db.pool.query('ROLLBACK');
      return res.status(400).json({ error: 'project_id must be a positive integer' });
    }
    const transactionResult = await db.query(
      'INSERT INTO transactions (student_id, branch_id, project_id, type, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [student_id, branchId, resolvedProjectId, 'return']
    );
    const transaction = transactionResult.rows[0];

    for (const item of normalizedItems) {
      const cid = Number(item.component_id);
      const qty = Number(item.quantity);
      const condition = item.condition ? String(item.condition) : 'returned';
      if (!Number.isInteger(cid) || cid < 1) throw new Error('Invalid component_id');
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Quantity must be positive');
      if (!['returned', 'damaged'].includes(condition)) throw new Error('Invalid condition; must be returned or damaged');

      if (condition === 'returned') {
        await db.query(
          'INSERT INTO branch_stock (branch_id, component_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (branch_id, component_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity',
          [branchId, cid, qty]
        );
      }

      await db.query(
        'INSERT INTO transaction_items (transaction_id, component_id, quantity, type, condition) VALUES ($1, $2, $3, $4, $5)',
        [transaction.id, cid, qty, 'return', condition]
      );
    }

    if (resolvedProjectId && close_project === true) {
      await db.query(
        "UPDATE projects SET status = 'closed', closed_at = NOW() WHERE id = $1 AND status = 'active'",
        [resolvedProjectId]
      );
    }
    await db.pool.query('COMMIT');
    res.status(201).json({ transactionId: transaction.id, project_id: resolvedProjectId || null });
  } catch (error) {
    await db.pool.query('ROLLBACK');
    next(error);
  }
});

router.post('/transfer-requests', async (req, res, next) => {
  if (useMock) {
    const fromBranch = req.user.branch_id || 1;
    const { to_branch, component_id, quantity } = req.body;
    const created = {
      id: mockStore.state.ids.transferRequests++,
      from_branch: Number(fromBranch),
      to_branch: Number(to_branch),
      component_id: Number(component_id),
      component_name: mockStore.getComponentName(component_id),
      quantity: Number(quantity),
      status: 'pending',
      requested_by: req.user.id,
      created_at: new Date().toISOString(),
    };
    mockStore.state.transferRequests.unshift(created);
    mockStore.logAudit('create_transfer_request', `transfer:${created.id}`, req.user.id);
    return res.status(201).json(created);
  }
  try {
    const fromBranch = req.user.branch_id;
    const { to_branch, component_id, quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    const result = await db.query(
      'INSERT INTO transfer_requests (from_branch, to_branch, component_id, quantity, status, requested_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [fromBranch, to_branch, component_id, quantity, 'pending', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
