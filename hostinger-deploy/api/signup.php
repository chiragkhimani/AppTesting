<?php
require_once __DIR__ . '/db.php';

require_method('POST');

$body = read_json_body();
$username = trim($body['username'] ?? '');
$email    = strtolower(trim($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
    send_error('Username, email and password are required', 400);
}
if (!preg_match('/^[A-Za-z0-9_.-]{3,60}$/', $username)) {
    send_error("Username must be 3-60 chars and only letters, numbers, '.', '_' or '-'", 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_error('Invalid email address', 400);
}
if (strlen($password) < 6) {
    send_error('Password must be at least 6 characters', 400);
}

$check = db()->prepare('SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1');
$check->execute([':u' => $username, ':e' => $email]);
if ($check->fetch()) {
    send_error('Username or email is already taken', 400);
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = db()->prepare(
    'INSERT INTO users (username, email, password_hash, first_name, last_name, locked, created_at)
     VALUES (:u, :e, :h, :fn, "", 0, NOW())'
);
$stmt->execute([
    ':u'  => $username,
    ':e'  => $email,
    ':h'  => $hash,
    ':fn' => $username,
]);
$newId = (int)db()->lastInsertId();

send_json([
    'success' => true,
    'message' => 'Account created successfully',
    'user' => [
        'id'         => $newId,
        'username'   => $username,
        'email'      => $email,
        'first_name' => $username,
        'last_name'  => '',
        'locked'     => false,
        'created_at' => date('Y-m-d H:i:s'),
    ],
], 201);
