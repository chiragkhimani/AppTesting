<?php
require_once __DIR__ . '/db.php';

require_method('GET');

if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    if ($id <= 0) send_error('Invalid product id', 400);

    $stmt = db()->prepare('SELECT id, name, description, price, image_url, category, stock FROM products WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) send_error('Product not found', 404);

    send_json(['product' => [
        'id'          => (int)$row['id'],
        'name'        => $row['name'],
        'description' => $row['description'],
        'price'       => (float)$row['price'],
        'image_url'   => $row['image_url'],
        'category'    => $row['category'],
        'stock'       => (int)$row['stock'],
    ]]);
}

$stmt = db()->query('SELECT id, name, description, price, image_url, category, stock FROM products ORDER BY id ASC');
$rows = $stmt->fetchAll();

$products = array_map(function ($r) {
    return [
        'id'          => (int)$r['id'],
        'name'        => $r['name'],
        'description' => $r['description'],
        'price'       => (float)$r['price'],
        'image_url'   => $r['image_url'],
        'category'    => $r['category'],
        'stock'       => (int)$r['stock'],
    ];
}, $rows);

send_json(['products' => $products]);
