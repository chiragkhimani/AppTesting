<?php
/**
 * Public forgot-password (demo): set a new password by username.
 * Body: { username, password, confirm_password }
 */
require_once __DIR__ . '/../db.php';

require_method('POST');

$body = read_json_body();
$username         = trim($body['username'] ?? '');
$password         = (string)($body['password'] ?? '');
$confirm_password = (string)($body['confirm_password'] ?? '');

if ($username === '' || $password === '' || $confirm_password === '') {
    send_error('Username, password and confirm_password are required', 400);
}
if (strlen($password) < 6) {
    send_error('Password must be at least 6 characters', 400);
}
if ($password !== $confirm_password) {
    send_error('Password and confirm_password do not match', 400);
}

$stmt = db()->prepare(
    'SELECT id, locked FROM users WHERE username = :u LIMIT 1'
);
$stmt->execute([':u' => $username]);
$user = $stmt->fetch();

if (!$user) {
    send_error('No account found with that username', 404);
}
if ((int)$user['locked'] === 1) {
    send_error('Sorry, this user has been locked out.', 403);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$upd = db()->prepare('UPDATE users SET password_hash = :h WHERE id = :id');
$upd->execute([':h' => $hash, ':id' => (int)$user['id']]);

// Invalidate existing sessions so the new password must be used to log in again
$del = db()->prepare('DELETE FROM auth_tokens WHERE user_id = :id');
$del->execute([':id' => (int)$user['id']]);

send_json([
    'success' => true,
    'message' => 'Password updated successfully. You can now log in with your new password.',
]);
