<?php
/**
 * Database connection (PDO), JSON helpers, and Bearer-token auth.
 *
 * Edit the four constants below with the credentials provided by Hostinger.
 */

// === Hostinger MySQL credentials (hPanel → Databases → MySQL) ===
define('DB_HOST', 'srv831.hstgr.io');
define('DB_NAME', 'u922767486_store');
define('DB_USER', 'u922767486_chirag_khimani');
define('DB_PASS', 'SpecialTrust@123');
define('DB_CHARSET', 'utf8mb4');

// Bearer token TTL in seconds (24 hours)
define('TOKEN_TTL_SECONDS', 24 * 60 * 60);

// --- CORS (same-origin React build by default; tweak if hosted elsewhere) ---
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/** @return PDO */
function db() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed', 'detail' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

function send_json($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function send_error(string $message, int $status = 400) {
    send_json(['error' => $message, 'detail' => $message], $status);
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method(string $method) {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        send_error('Method not allowed', 405);
    }
}

/**
 * Extract Bearer token from the Authorization header.
 * Works under both mod_php and CGI/FPM.
 */
function bearer_token(): ?string {
    $h = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $h = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $h = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $all = getallheaders();
        foreach ($all as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $h = $v; break; }
        }
    }
    if (!$h) return null;
    if (stripos($h, 'Bearer ') !== 0) return null;
    return trim(substr($h, 7));
}

/**
 * Issue a fresh bearer token for the given user_id.
 * Returns ['token' => ..., 'expires_at' => 'Y-m-d H:i:s'].
 */
function issue_token(int $user_id): array {
    $token = bin2hex(random_bytes(32));
    $expires = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
        ->modify('+' . TOKEN_TTL_SECONDS . ' seconds')
        ->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'INSERT INTO auth_tokens (user_id, token, expires_at, created_at) VALUES (:uid, :tok, :exp, NOW())'
    );
    $stmt->execute([':uid' => $user_id, ':tok' => $token, ':exp' => $expires]);
    return ['token' => $token, 'expires_at' => $expires];
}

/**
 * Resolve the currently-authenticated user or send 401 and exit.
 * Returns associative array of user fields (no password_hash).
 */
function require_user(): array {
    $token = bearer_token();
    if (!$token) send_error('Missing bearer token', 401);

    $stmt = db()->prepare(
        'SELECT t.user_id, t.expires_at, u.id, u.username, u.email, u.first_name, u.last_name, u.locked, u.created_at
         FROM auth_tokens t INNER JOIN users u ON u.id = t.user_id
         WHERE t.token = :tok LIMIT 1'
    );
    $stmt->execute([':tok' => $token]);
    $row = $stmt->fetch();
    if (!$row) send_error('Invalid token', 401);

    if (strtotime($row['expires_at']) < time()) {
        $del = db()->prepare('DELETE FROM auth_tokens WHERE token = :tok');
        $del->execute([':tok' => $token]);
        send_error('Token expired', 401);
    }
    if ((int)$row['locked'] === 1) {
        send_error('User is locked', 403);
    }

    return [
        'id'         => (int)$row['id'],
        'username'   => $row['username'],
        'email'      => $row['email'],
        'first_name' => $row['first_name'],
        'last_name'  => $row['last_name'],
        'locked'     => (bool)$row['locked'],
        'created_at' => $row['created_at'],
    ];
}
