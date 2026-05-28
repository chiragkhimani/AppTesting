<?php
require_once __DIR__ . '/db.php';

$me = require_user();
send_json(['user' => $me]);
