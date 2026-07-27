<?php
require_once __DIR__ . '/db.php';

/** Match frontend checkoutPricing.js */
const TAX_RATE = 0.08;
const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_MIN = 100.0;

function order_pricing(float $subtotal): array {
    $shipping = $subtotal >= FREE_SHIPPING_MIN ? 0.0 : SHIPPING_FLAT;
    $tax = round($subtotal * TAX_RATE, 2);
    $total = round($subtotal + $shipping + $tax, 2);
    return [
        'subtotal' => round($subtotal, 2),
        'shipping' => round($shipping, 2),
        'tax'      => $tax,
        'total'    => $total,
    ];
}

$me = require_user(); // protected

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['user_id'])) {
        $uid = (int)$_GET['user_id'];
    } else {
        $uid = (int)$me['id']; // default: current user's own orders
    }
    $stmt = db()->prepare(
        'SELECT id, user_id, full_name, address, city, state, pincode, phone,
                subtotal, shipping, tax, total, status, created_at
         FROM orders WHERE user_id = :uid ORDER BY id DESC'
    );
    $stmt->execute([':uid' => $uid]);
    $orders = $stmt->fetchAll();

    if (!$orders) send_json(['orders' => []]);

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
        $subtotal = isset($o['subtotal']) ? (float)$o['subtotal'] : (float)$o['total'];
        $shipping = isset($o['shipping']) ? (float)$o['shipping'] : 0.0;
        $tax      = isset($o['tax']) ? (float)$o['tax'] : 0.0;
        return [
            'id'         => (int)$o['id'],
            'user_id'    => $o['user_id'] !== null ? (int)$o['user_id'] : null,
            'full_name'  => $o['full_name'],
            'address'    => $o['address'],
            'city'       => $o['city'],
            'state'      => $o['state'],
            'pincode'    => $o['pincode'],
            'phone'      => $o['phone'],
            'subtotal'   => $subtotal,
            'shipping'   => $shipping,
            'tax'        => $tax,
            'total'      => (float)$o['total'],
            'status'     => $o['status'] ?: 'pending',
            'created_at' => $o['created_at'],
            'items'      => $itemsByOrder[(int)$o['id']] ?? [],
        ];
    }, $orders);
    send_json(['orders' => $result]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $full_name = trim($body['full_name'] ?? '');
    $address   = trim($body['address']   ?? '');
    $city      = trim($body['city']      ?? '');
    $state     = trim($body['state']     ?? '');
    $pincode   = trim($body['pincode']   ?? '');
    $phone     = trim($body['phone']     ?? '');
    $items     = $body['items'] ?? [];

    if ($full_name === '' || $address === '' || $city === '' || $state === '' || $pincode === '' || $phone === '') {
        send_error('All shipping fields are required', 400);
    }
    if (!preg_match('/^[+\d][\d\s\-()]{5,19}$/', $phone)) {
        send_error('Invalid phone number', 400);
    }
    if (!is_array($items) || count($items) === 0) {
        send_error('Cart is empty', 400);
    }

    $pdo = db();
    $priceStmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = :id LIMIT 1');

    $serverItems = [];
    $subtotal = 0.0;
    foreach ($items as $i) {
        $pid = (int)($i['product_id'] ?? 0);
        $qty = max(1, (int)($i['quantity'] ?? 0));
        if ($pid <= 0) send_error('Invalid product_id', 400);

        $priceStmt->execute([':id' => $pid]);
        $p = $priceStmt->fetch();
        if (!$p) send_error("Unknown product id $pid", 400);

        $line = round((float)$p['price'] * $qty, 2);
        $subtotal += $line;
        $serverItems[] = [
            'product_id' => (int)$p['id'],
            'name'       => $p['name'],
            'price'      => (float)$p['price'],
            'quantity'   => $qty,
        ];
    }
    $pricing = order_pricing($subtotal);

    $pdo->beginTransaction();
    try {
        $oStmt = $pdo->prepare(
            'INSERT INTO orders (user_id, full_name, address, city, state, pincode, phone, subtotal, shipping, tax, total, status, created_at)
             VALUES (:uid, :fn, :a, :c, :s, :pc, :ph, :sub, :ship, :tax, :t, \'pending\', NOW())'
        );
        $oStmt->execute([
            ':uid'  => $me['id'],
            ':fn'   => $full_name,
            ':a'    => $address,
            ':c'    => $city,
            ':s'    => $state,
            ':pc'   => $pincode,
            ':ph'   => $phone,
            ':sub'  => $pricing['subtotal'],
            ':ship' => $pricing['shipping'],
            ':tax'  => $pricing['tax'],
            ':t'    => $pricing['total'],
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
        'subtotal' => $pricing['subtotal'],
        'shipping' => $pricing['shipping'],
        'tax'      => $pricing['tax'],
        'total'    => $pricing['total'],
    ], 201);
}

send_error('Method not allowed', 405);
