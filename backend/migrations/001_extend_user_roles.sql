-- Run once on existing databases if users.role only allows admin/staff.
-- PostgreSQL names inline CHECK constraints as {table}_{column}_check

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'center_manager'));
