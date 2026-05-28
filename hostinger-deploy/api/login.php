<?php
require_once __DIR__ . '/db.php';

require_method('POST');

$body = read_json_body();
$username = trim($body['username'] ?? '');
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
    send_error('Username and password are required', 400);
}

$stmt = db()->prepare('SELECT id, username, password, first_name, last_name, locked FROM users WHERE username = :u LIMIT 1');
$stmt->execute([':u' => $username]);
$user = $stmt->fetch();

if (!$user || !hash_equals((string)$user['password'], $password)) {
    send_error('Username and password do not match any user in this service', 401);
}

if ((int)$user['locked'] === 1) {
    send_error('Sorry, this user has been locked out.', 403);
}

send_json([
    'success' => true,
    'user' => [
        'id'         => (int)$user['id'],
        'username'   => $user['username'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'locked'     => false,
    ],
]);
