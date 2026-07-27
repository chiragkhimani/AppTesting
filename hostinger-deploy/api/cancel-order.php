<?php
/**
 * Cancel an order belonging to the authenticated user.
 * Body: { order_id: int }
 */
require_once __DIR__ . '/db.php';

$me = require_user();
require_method('POST');

$body = read_json_body();
$orderId = (int)($body['order_id'] ?? 0);
if ($orderId <= 0) {
    send_error('order_id is required', 400);
}

$stmt = db()->prepare(
    'SELECT id, user_id, status FROM orders WHERE id = :id LIMIT 1'
);
$stmt->execute([':id' => $orderId]);
$order = $stmt->fetch();

if (!$order) {
    send_error('Order not found', 404);
}
if ((int)$order['user_id'] !== (int)$me['id']) {
    send_error('You can only cancel your own orders', 403);
}

$status = $order['status'] ?? 'pending';
if ($status === 'cancelled') {
    send_error('Order is already cancelled', 400);
}

$upd = db()->prepare(
    "UPDATE orders SET status = 'cancelled' WHERE id = :id AND user_id = :uid"
);
$upd->execute([':id' => $orderId, ':uid' => (int)$me['id']]);

send_json([
    'success'  => true,
    'message'  => 'Order cancelled',
    'order_id' => $orderId,
    'status'   => 'cancelled',
]);
