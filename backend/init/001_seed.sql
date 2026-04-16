INSERT INTO users (email, password, created_at)
VALUES ('demo@example.com', 'demo-password', NOW())
ON CONFLICT (email) DO NOTHING;
