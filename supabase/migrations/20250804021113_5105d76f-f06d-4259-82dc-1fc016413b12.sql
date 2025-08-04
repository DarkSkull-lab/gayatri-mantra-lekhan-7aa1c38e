-- Remove test accounts from users table
DELETE FROM users WHERE name LIKE 'test%' OR name LIKE 'owner%';