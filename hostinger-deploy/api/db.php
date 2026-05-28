<?php
/**
 * Database connection (PDO) and common JSON / CORS helpers.
 *
 * Edit the four constants below with the credentials provided by Hostinger.
 * Keep this file OUTSIDE of any public include path that exposes source code,
 * but inside the /api folder it's protected by .htaccess (PHP is executed,
 * not served as text).
 */

// === EDIT THESE ON HOSTINGER (hPanel → Databases → MySQL) ===
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
define('DB_CHARSET', 'utf8mb4');

// --- CORS (allow same-origin React build; tweak if frontend is on a different domain) ---
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
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

/**
 * Send a JSON response and exit.
 */
function send_json($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Send a JSON error response and exit.
 */
function send_error(string $message, int $status = 400) {
    send_json(['error' => $message, 'detail' => $message], $status);
}

/**
 * Parse JSON body of the request.
 */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Require a specific HTTP method or exit with 405.
 */
function require_method(string $method) {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        send_error('Method not allowed', 405);
    }
}
