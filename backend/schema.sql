-- Inventory Management Schema

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master_admin','admin','staff','center_manager')),
  branch_id INTEGER REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sku TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id),
  name TEXT NOT NULL,
  code TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','closed')) DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_stock (
  branch_id INTEGER REFERENCES branches(id),
  component_id INTEGER REFERENCES components(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_id, component_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  branch_id INTEGER REFERENCES branches(id),
  project_id INTEGER REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN ('issue','return')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  component_id INTEGER REFERENCES components(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issue','return')),
  condition TEXT CHECK (condition IN ('returned','damaged'))
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id SERIAL PRIMARY KEY,
  from_branch INTEGER REFERENCES branches(id),
  to_branch INTEGER REFERENCES branches(id),
  component_id INTEGER REFERENCES components(id),
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
