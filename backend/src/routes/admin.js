const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { permit } = require('../middleware/roles');
const { generateDataUrl } = require('../utils/qrcode');
const mockStore = require('../mock/store');

const router = express.Router();
router.use(authenticate, permit('admin', 'master_admin'));
const useMock = process.env.DEV_BYPASS_LOGIN === 'true';

router.get('/branches', async (req, res, next) => {
  if (useMock) return res.json(mockStore.state.branches);
  try {
    const result = await db.query('SELECT id, name, location FROM branches ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/branches', async (req, res, next) => {
  if (useMock) {
    const { name, location } = req.body;
    const created = { id: mockStore.state.ids.branches++, name, location };
    mockStore.state.branches.push(created);
    mockStore.logAudit('create_branch', `branch:${created.id}`, req.user.id);
    return res.status(201).json(created);
  }
  try {
    const { name, location } = req.body;
    const result = await db.query('INSERT INTO branches (name, location) VALUES ($1, $2) RETURNING *', [name, location]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/components', async (req, res, next) => {
  if (useMock) return res.json(mockStore.state.components);
  try {
    const result = await db.query('SELECT id, name, unit_price, sku, description, created_at FROM components ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/components', async (req, res, next) => {
  if (useMock) {
    const { name, unit_price, sku, description } = req.body;
    const created = { id: mockStore.state.ids.components++, name, unit_price: Number(unit_price || 0), sku: sku || null, description: description || null };
    mockStore.state.components.push(created);
    mockStore.logAudit('create_component', `component:${created.id}`, req.user.id);
    return res.status(201).json(created);
  }
  try {
    const { name, unit_price, sku, description } = req.body;
    const price = unit_price == null ? 0 : Number(unit_price);
    if (Number.isNaN(price) || price < 0) return res.status(400).json({ error: 'unit_price must be a non-negative number' });
    const result = await db.query(
      'INSERT INTO components (name, unit_price, sku, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, sku || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/components/:id/qr', async (req, res, next) => {
  if (useMock) {
    const componentId = Number(req.params.id);
    const component = mockStore.state.components.find((c) => c.id === componentId);
    if (!component) return res.status(404).json({ error: 'Component not found' });
    return res.json({ component, qr: '' });
  }
  try {
    const componentId = req.params.id;
    const result = await db.query('SELECT id, name, unit_price, sku, description FROM components WHERE id = $1', [componentId]);
    const component = result.rows[0];
    if (!component) return res.status(404).json({ error: 'Component not found' });
    const payload = JSON.stringify({ type: 'component', component_id: component.id });
    const qr = await generateDataUrl(payload);
    res.json({ component, qr });
  } catch (error) {
    next(error);
  }
});

router.get('/transfer-requests', async (req, res, next) => {
  if (useMock) return res.json(mockStore.state.transferRequests);
  try {
    const result = await db.query(
      `SELECT tr.id, tr.from_branch, tr.to_branch, tr.component_id, c.name AS component_name, tr.quantity, tr.status, tr.requested_by, tr.created_at
       FROM transfer_requests tr
       JOIN components c ON c.id = tr.component_id
       ORDER BY tr.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/transfer-requests/:id/approve', async (req, res, next) => {
  if (useMock) {
    const requestId = Number(req.params.id);
    const request = mockStore.state.transferRequests.find((r) => r.id === requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already handled' });
    request.status = 'approved';
    mockStore.upsertBranchStock(request.from_branch, request.component_id, -request.quantity);
    mockStore.upsertBranchStock(request.to_branch, request.component_id, request.quantity);
    mockStore.logAudit('approve_transfer', `transfer:${requestId}`, req.user.id);
    return res.json({ success: true });
  }
  try {
    const requestId = req.params.id;
    const requestResult = await db.query('SELECT * FROM transfer_requests WHERE id = $1', [requestId]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already handled' });

    await db.pool.query('BEGIN');
    const sourceStock = await db.query(
      'SELECT quantity FROM branch_stock WHERE branch_id = $1 AND component_id = $2 FOR UPDATE',
      [request.from_branch, request.component_id]
    );
    const available = sourceStock.rows[0]?.quantity || 0;
    if (available < request.quantity) {
      await db.pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough stock at source branch' });
    }
    await db.query(
      'UPDATE branch_stock SET quantity = quantity - $1 WHERE branch_id = $2 AND component_id = $3',
      [request.quantity, request.from_branch, request.component_id]
    );
    await db.query(
      'INSERT INTO branch_stock (branch_id, component_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (branch_id, component_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity',
      [request.to_branch, request.component_id, request.quantity]
    );
    await db.query('UPDATE transfer_requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3', ['approved', req.user.id, requestId]);
    await db.pool.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await db.pool.query('ROLLBACK');
    next(error);
  }
});

router.patch('/transfer-requests/:id/reject', async (req, res, next) => {
  if (useMock) {
    const requestId = Number(req.params.id);
    const request = mockStore.state.transferRequests.find((r) => r.id === requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.status = 'rejected';
    mockStore.logAudit('reject_transfer', `transfer:${requestId}`, req.user.id);
    return res.json(request);
  }
  try {
    const requestId = req.params.id;
    const { reason } = req.body;
    const result = await db.query('UPDATE transfer_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_reason = $3 WHERE id = $4 RETURNING *', ['rejected', req.user.id, reason || 'Rejected by admin', requestId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Request not found' });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', async (req, res, next) => {
  if (useMock) return res.json(mockStore.getAnalytics());
  try {
    const stockResult = await db.query(
      `SELECT b.id AS branch_id, b.name AS branch_name, SUM(bs.quantity) AS total_stock
       FROM branches b
       LEFT JOIN branch_stock bs ON bs.branch_id = b.id
       GROUP BY b.id ORDER BY b.id`
    );
    const lowStockResult = await db.query(
      `SELECT b.name AS branch_name, c.name AS component_name, bs.quantity
       FROM branch_stock bs
       JOIN branches b ON b.id = bs.branch_id
       JOIN components c ON c.id = bs.component_id
       WHERE bs.quantity <= 5
       ORDER BY bs.quantity ASC`
    );
    const netWorthResult = await db.query(
      `SELECT b.id AS branch_id, b.name AS branch_name, COALESCE(SUM(bs.quantity * c.unit_price), 0) AS net_worth
       FROM branches b
       LEFT JOIN branch_stock bs ON bs.branch_id = b.id
       LEFT JOIN components c ON c.id = bs.component_id
       GROUP BY b.id
       ORDER BY b.id`
    );
    const rotationResult = await db.query(
      `SELECT c.id AS component_id, c.name AS component_name, COALESCE(SUM(ti.quantity), 0) AS issued_qty
       FROM components c
       LEFT JOIN transaction_items ti ON ti.component_id = c.id AND ti.type = 'issue'
       GROUP BY c.id
       ORDER BY issued_qty DESC, c.id ASC
       LIMIT 20`
    );
    const lowUsageResult = await db.query(
      `SELECT c.id AS component_id, c.name AS component_name, COALESCE(SUM(ti.quantity), 0) AS issued_qty
       FROM components c
       LEFT JOIN transaction_items ti ON ti.component_id = c.id AND ti.type = 'issue'
       GROUP BY c.id
       ORDER BY issued_qty ASC, c.id ASC
       LIMIT 20`
    );
    res.json({
      branchStock: stockResult.rows,
      lowStock: lowStockResult.rows,
      netWorthByBranch: netWorthResult.rows,
      componentRotationTop: rotationResult.rows,
      componentLowUsage: lowUsageResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/branch/:branchId', async (req, res, next) => {
  if (useMock) return res.json({ error: 'Not available in mock mode' });
  try {
    const branchId = Number(req.params.branchId);
    if (!Number.isInteger(branchId) || branchId < 1) return res.status(400).json({ error: 'Invalid branchId' });

    const netWorth = await db.query(
      `SELECT COALESCE(SUM(bs.quantity * c.unit_price), 0) AS net_worth
       FROM branch_stock bs
       JOIN components c ON c.id = bs.component_id
       WHERE bs.branch_id = $1`,
      [branchId]
    );
    const totalCount = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) AS total_count FROM branch_stock WHERE branch_id = $1',
      [branchId]
    );
    const rotation = await db.query(
      `SELECT c.id AS component_id, c.name AS component_name, COALESCE(SUM(ti.quantity), 0) AS issued_qty
       FROM components c
       LEFT JOIN transaction_items ti ON ti.component_id = c.id AND ti.type = 'issue'
       LEFT JOIN transactions t ON t.id = ti.transaction_id AND t.branch_id = $1
       GROUP BY c.id
       ORDER BY issued_qty DESC
       LIMIT 50`,
      [branchId]
    );
    res.json({
      branch_id: branchId,
      net_worth: netWorth.rows[0]?.net_worth ?? '0',
      total_count: totalCount.rows[0]?.total_count ?? '0',
      rotation: rotation.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req, res, next) => {
  if (useMock) return res.json(mockStore.state.studentHistory);
  try {
    const result = await db.query(
      `SELECT t.id, t.type, t.date, t.student_id, t.branch_id, ti.component_id, c.name AS component_name, ti.quantity
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.id
       JOIN components c ON c.id = ti.component_id
       ORDER BY t.date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  if (useMock) return res.json(mockStore.state.auditLogs);
  try {
    const result = await db.query('SELECT id, actor_id, action, resource, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/usage', async (req, res, next) => {
  if (useMock) return res.json({ error: 'Not available in mock mode' });
  try {
    const { from, to, branch_id, component_id, project_id } = req.query;
    const filters = [];
    const params = [];

    if (from) {
      params.push(from);
      filters.push(`t.date >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      filters.push(`t.date <= $${params.length}::timestamptz`);
    }
    if (branch_id) {
      params.push(Number(branch_id));
      filters.push(`t.branch_id = $${params.length}`);
    }
    if (project_id) {
      params.push(Number(project_id));
      filters.push(`t.project_id = $${params.length}`);
    }
    if (component_id) {
      params.push(Number(component_id));
      filters.push(`ti.component_id = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT 
         ti.component_id,
         c.name AS component_name,
         COALESCE(SUM(CASE WHEN ti.type = 'issue' THEN ti.quantity ELSE 0 END), 0) AS issued_qty,
         COALESCE(SUM(CASE WHEN ti.type = 'return' AND ti.condition = 'returned' THEN ti.quantity ELSE 0 END), 0) AS returned_qty,
         COALESCE(SUM(CASE WHEN ti.type = 'return' AND ti.condition = 'damaged' THEN ti.quantity ELSE 0 END), 0) AS damaged_qty
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       JOIN components c ON c.id = ti.component_id
       ${where}
       GROUP BY ti.component_id, c.name
       ORDER BY issued_qty DESC, ti.component_id ASC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/projects', async (req, res, next) => {
  if (useMock) return res.json({ error: 'Not available in mock mode' });
  try {
    const { branch_id, status } = req.query;
    const filters = [];
    const params = [];

    if (branch_id) {
      params.push(Number(branch_id));
      filters.push(`p.branch_id = $${params.length}`);
    }
    if (status) {
      params.push(String(status));
      filters.push(`p.status = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT
         p.id AS project_id,
         p.name AS project_name,
         p.code AS project_code,
         p.status,
         p.started_at,
         p.closed_at,
         p.branch_id,
         b.name AS branch_name,
         COALESCE(SUM(CASE WHEN ti.type = 'issue' THEN ti.quantity ELSE 0 END), 0) AS issued_qty,
         COALESCE(SUM(CASE WHEN ti.type = 'return' AND ti.condition = 'returned' THEN ti.quantity ELSE 0 END), 0) AS returned_qty,
         COALESCE(SUM(CASE WHEN ti.type = 'return' AND ti.condition = 'damaged' THEN ti.quantity ELSE 0 END), 0) AS damaged_qty
       FROM projects p
       JOIN branches b ON b.id = p.branch_id
       LEFT JOIN transactions t ON t.project_id = p.id
       LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
       ${where}
       GROUP BY p.id, b.name
       ORDER BY p.started_at DESC, p.id DESC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/loss', async (req, res, next) => {
  if (useMock) return res.json({ error: 'Not available in mock mode' });
  try {
    const { from, to, branch_id, project_id } = req.query;
    const filters = [`ti.type = 'return' AND ti.condition = 'damaged'`];
    const params = [];

    if (from) {
      params.push(from);
      filters.push(`t.date >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      filters.push(`t.date <= $${params.length}::timestamptz`);
    }
    if (branch_id) {
      params.push(Number(branch_id));
      filters.push(`t.branch_id = $${params.length}`);
    }
    if (project_id) {
      params.push(Number(project_id));
      filters.push(`t.project_id = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT
         t.branch_id,
         b.name AS branch_name,
         t.project_id,
         p.name AS project_name,
         ti.component_id,
         c.name AS component_name,
         COALESCE(SUM(ti.quantity), 0) AS damaged_qty,
         COALESCE(SUM(ti.quantity * c.unit_price), 0) AS loss_value
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       JOIN components c ON c.id = ti.component_id
       LEFT JOIN branches b ON b.id = t.branch_id
       LEFT JOIN projects p ON p.id = t.project_id
       ${where}
       GROUP BY t.branch_id, b.name, t.project_id, p.name, ti.component_id, c.name
       ORDER BY loss_value DESC, damaged_qty DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
