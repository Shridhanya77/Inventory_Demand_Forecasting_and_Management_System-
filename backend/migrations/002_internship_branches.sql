-- Optional: insert the nine internship centers if they are missing (safe to run multiple times).

INSERT INTO branches (name, location)
SELECT v.name, v.location
FROM (VALUES
  ('Belagavi', 'Internship center'),
  ('Hubli', 'Internship center'),
  ('JP P Nagar', 'Internship center — Bengaluru'),
  ('Kalburagi', 'Internship center'),
  ('Mangalore', 'Internship center'),
  ('Mysore', 'Internship center'),
  ('Tumkur', 'Internship center'),
  ('Yelahanka', 'Internship center — Bengaluru'),
  ('Gopalan Mall', 'Internship center — Bengaluru')
) AS v(name, location)
WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.name = v.name);
