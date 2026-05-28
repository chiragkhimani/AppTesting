<?php
require_once __DIR__ . '/db.php';

$me = require_user(); // every method on this resource is protected

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = db()->query(
        'SELECT id, username, email, first_name, last_name, locked, created_at
         FROM users ORDER BY id ASC'
    );
    $rows = $stmt->fetchAll();
    $users = array_map(function ($r) {
        return [
            'id'         => (int)$r['id'],
            'username'   => $r['username'],
            'email'      => $r['email'],
            'first_name' => $r['first_name'],
            'last_name'  => $r['last_name'],
            'locked'     => (bool)$r['locked'],
            'created_at' => $r['created_at'],
        ];
    }, $rows);
    send_json(['users' => $users]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $username   = trim($body['username']   ?? '');
    $email      = trim($body['email']      ?? '');
    $password   = (string)($body['password'] ?? '');
    $first_name = trim($body['first_name'] ?? '');
    $last_name  = trim($body['last_name']  ?? '');

    if ($username === '' || $email === '' || $password === '') {
        send_error('Username, email and password are required', 400);
    }
    if (strlen($password) < 4) {
        send_error('Password must be at least 4 characters', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_error('Invalid email address', 400);
    }

    $check = db()->prepare('SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1');
    $check->execute([':u' => $username, ':e' => $email]);
    if ($check->fetch()) {
        send_error('Username or email already exists', 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = db()->prepare(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, locked, created_at)
         VALUES (:u, :e, :h, :fn, :ln, 0, NOW())'
    );
    $stmt->execute([
        ':u'  => $username,
        ':e'  => $email,
        ':h'  => $hash,
        ':fn' => $first_name !== '' ? $first_name : $username,
        ':ln' => $last_name,
    ]);
    $newId = (int)db()->lastInsertId();

    send_json([
        'user' => [
            'id'         => $newId,
            'username'   => $username,
            'email'      => $email,
            'first_name' => $first_name !== '' ? $first_name : $username,
            'last_name'  => $last_name,
            'locked'     => false,
            'created_at' => date('Y-m-d H:i:s'),
        ],
    ], 201);
}

send_error('Method not allowed', 405);
