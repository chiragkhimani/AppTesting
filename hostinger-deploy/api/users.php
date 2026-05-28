<?php
require_once __DIR__ . '/db.php';

require_method('GET');

$stmt = db()->query('SELECT id, username, first_name, last_name, locked FROM users ORDER BY id ASC');
$rows = $stmt->fetchAll();

$users = array_map(function ($r) {
    return [
        'id'         => (int)$r['id'],
        'username'   => $r['username'],
        'first_name' => $r['first_name'],
        'last_name'  => $r['last_name'],
        'locked'     => (bool)$r['locked'],
    ];
}, $rows);

send_json(['users' => $users]);
