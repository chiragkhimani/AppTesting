<?php
require_once __DIR__ . '/db.php';

$me = require_user(); // protected

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['user_id'])) {
        $uid = (int)$_GET['user_id'];
        $stmt = db()->prepare(
            'SELECT id, user_id, first_name, last_name, address, city, zipcode, total, created_at
             FROM orders WHERE user_id = :uid ORDER BY id DESC'
        );
        $stmt->execute([':uid' => $uid]);
    } else {
        $stmt = db()->query(
            'SELECT id, user_id, first_name, last_name, address, city, zipcode, total, created_at
             FROM orders ORDER BY id DESC'
        );
    }
    $orders = $stmt->fetchAll();

    if (!$orders) send_json(['orders' => []]);

    // Load all items in a single query
    $ids = array_map(fn($o) => (int)$o['id'], $orders);
    $place = implode(',', array_fill(0, count($ids), '?'));
    $itemStmt = db()->prepare(
        "SELECT order_id, product_id, name, price, quantity FROM order_items WHERE order_id IN ($place)"
    );
    $itemStmt->execute($ids);

    $itemsByOrder = [];
    foreach ($itemStmt->fetchAll() as $row) {
        $itemsByOrder[(int)$row['order_id']][] = [
            'product_id' => (int)$row['product_id'],
            'name'       => $row['name'],
            'price'      => (float)$row['price'],
            'quantity'   => (int)$row['quantity'],
        ];
    }

    $result = array_map(function ($o) use ($itemsByOrder) {
        return [
            'id'         => (int)$o['id'],
            'user_id'    => $o['user_id'] !== null ? (int)$o['user_id'] : null,
            'first_name' => $o['first_name'],
            'last_name'  => $o['last_name'],
            'address'    => $o['address'],
            'city'       => $o['city'],
            'zipcode'    => $o['zipcode'],
            'total'      => (float)$o['total'],
            'created_at' => $o['created_at'],
            'items'      => $itemsByOrder[(int)$o['id']] ?? [],
        ];
    }, $orders);
    send_json(['orders' => $result]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $first_name = trim($body['first_name'] ?? '');
    $last_name  = trim($body['last_name']  ?? '');
    $address    = trim($body['address']    ?? '');
    $city       = trim($body['city']       ?? '');
    $zipcode    = trim($body['zipcode']    ?? '');
    $items      = $body['items'] ?? [];

    if ($first_name === '' || $last_name === '' || $address === '' || $city === '' || $zipcode === '') {
        send_error('Shipping fields are required', 400);
    }
    if (!is_array($items) || count($items) === 0) {
        send_error('Cart is empty', 400);
    }

    // === SERVER-SIDE TOTAL: always recompute from DB prices. ===
    $pdo = db();
    $priceStmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = :id LIMIT 1');

    $serverItems = [];
    $total = 0.0;
    foreach ($items as $i) {
        $pid = (int)($i['product_id'] ?? 0);
        $qty = max(1, (int)($i['quantity'] ?? 0));
        if ($pid <= 0) send_error('Invalid product_id', 400);

        $priceStmt->execute([':id' => $pid]);
        $p = $priceStmt->fetch();
        if (!$p) send_error("Unknown product id $pid", 400);

        $line = round((float)$p['price'] * $qty, 2);
        $total += $line;
        $serverItems[] = [
            'product_id' => (int)$p['id'],
            'name'       => $p['name'],
            'price'      => (float)$p['price'],
            'quantity'   => $qty,
        ];
    }
    $total = round($total, 2);

    $pdo->beginTransaction();
    try {
        $oStmt = $pdo->prepare(
            'INSERT INTO orders (user_id, first_name, last_name, address, city, zipcode, total, created_at)
             VALUES (:uid, :fn, :ln, :a, :c, :z, :t, NOW())'
        );
        $oStmt->execute([
            ':uid' => $me['id'],
            ':fn'  => $first_name,
            ':ln'  => $last_name,
            ':a'   => $address,
            ':c'   => $city,
            ':z'   => $zipcode,
            ':t'   => $total,
        ]);
        $orderId = (int)$pdo->lastInsertId();

        $iStmt = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, name, price, quantity)
             VALUES (:oid, :pid, :n, :pr, :q)'
        );
        foreach ($serverItems as $it) {
            $iStmt->execute([
                ':oid' => $orderId,
                ':pid' => $it['product_id'],
                ':n'   => $it['name'],
                ':pr'  => $it['price'],
                ':q'   => $it['quantity'],
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
        'total'    => $total,
    ], 201);
}

send_error('Method not allowed', 405);
