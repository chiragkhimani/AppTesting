<?php
require_once __DIR__ . '/../db.php';

require_method('POST');

$body = read_json_body();
$username = trim($body['username'] ?? '');
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
    send_error('Username and password are required', 400);
}

$stmt = db()->prepare(
    'SELECT id, username, email, password_hash, first_name, last_name, locked, created_at
     FROM users WHERE username = :u LIMIT 1'
);
$stmt->execute([':u' => $username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string)$user['password_hash'])) {
    send_error('Username and password do not match any user in this service', 401);
}

if ((int)$user['locked'] === 1) {
    send_error('Sorry, this user has been locked out.', 403);
}

// Opportunistic rehash if the cost/algorithm has changed
if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT)) {
    $new = password_hash($password, PASSWORD_BCRYPT);
    $u = db()->prepare('UPDATE users SET password_hash = :h WHERE id = :id');
    $u->execute([':h' => $new, ':id' => (int)$user['id']]);
}

$tok = issue_token((int)$user['id']);

send_json([
    'token'      => $tok['token'],
    'expires_at' => $tok['expires_at'],
    'user' => [
        'id'         => (int)$user['id'],
        'username'   => $user['username'],
        'email'      => $user['email'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'locked'     => false,
        'created_at' => $user['created_at'],
    ],
]);
