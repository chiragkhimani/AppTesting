<?php
require_once __DIR__ . '/db.php';

require_method('POST');

$body = read_json_body();

$first_name = trim($body['first_name'] ?? '');
$last_name  = trim($body['last_name']  ?? '');
$address    = trim($body['address']    ?? '');
$city       = trim($body['city']       ?? '');
$zipcode    = trim($body['zipcode']    ?? '');
$user_id    = isset($body['user_id']) ? (int)$body['user_id'] : null;
$items      = $body['items'] ?? [];
$total      = isset($body['total']) ? (float)$body['total'] : 0.0;

if ($first_name === '' || $last_name === '' || $address === '' || $city === '' || $zipcode === '') {
    send_error('Shipping fields are required', 400);
}
if (!is_array($items) || count($items) === 0) {
    send_error('Cart is empty', 400);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO orders (user_id, first_name, last_name, address, city, zipcode, total, created_at)
         VALUES (:user_id, :first_name, :last_name, :address, :city, :zipcode, :total, NOW())'
    );
    $stmt->execute([
        ':user_id'    => $user_id,
        ':first_name' => $first_name,
        ':last_name'  => $last_name,
        ':address'    => $address,
        ':city'       => $city,
        ':zipcode'    => $zipcode,
        ':total'      => $total,
    ]);
    $orderId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES (:order_id, :product_id, :name, :price, :quantity)'
    );
    foreach ($items as $i) {
        $itemStmt->execute([
            ':order_id'   => $orderId,
            ':product_id' => (int)($i['product_id'] ?? 0),
            ':name'       => (string)($i['name'] ?? ''),
            ':price'      => (float)($i['price'] ?? 0),
            ':quantity'   => (int)($i['quantity'] ?? 1),
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    send_error('Could not create order', 500);
}

send_json([
    'success'  => true,
    'order_id' => $orderId,
    'total'    => round($total, 2),
]);
