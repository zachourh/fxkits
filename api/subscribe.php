<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const KIT_FORM_ID = 9881119;
const FALLBACK_CONFIG = __DIR__ . '/../../fxkits-kit-config.php';

function respond(bool $ok, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok]);
    exit;
}

function read_config(): array
{
    $config = [];
    if (is_readable(FALLBACK_CONFIG)) {
        $loaded = require FALLBACK_CONFIG;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    return [
        'api_key' => getenv('KIT_API_KEY') ?: ($config['KIT_API_KEY'] ?? ''),
        'tag_id' => getenv('KIT_TAG_ID') ?: ($config['KIT_TAG_ID'] ?? ''),
    ];
}

function client_ip(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $parts = explode(',', $forwarded);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rate_limited(string $ip): bool
{
    $dir = sys_get_temp_dir() . '/fxkits-email-gate';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $bucket = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $ip);
    $file = $dir . '/' . $bucket . '.json';
    $now = time();
    $window = 3600;
    $limit = 12;
    $hits = [];

    if (is_readable($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded)) {
            $hits = array_values(array_filter($decoded, function ($ts) use ($now, $window) {
                return is_int($ts) && $ts > $now - $window;
            }));
        }
    }

    if (count($hits) >= $limit) {
        return true;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

function kit_post(string $path, array $payload, string $apiKey): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'status' => 0, 'body' => ''];
    }

    $ch = curl_init('https://api.kit.com/v4' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Kit-Api-Key: ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);

    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'ok' => $error === '' && $status >= 200 && $status < 300,
        'status' => $status,
        'body' => is_string($body) ? $body : '',
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 405);
}

$raw = file_get_contents('php://input');
$data = json_decode((string) $raw, true);
$email = is_array($data) ? trim((string) ($data['email'] ?? '')) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    respond(false, 400);
}

if (rate_limited(client_ip())) {
    respond(false, 429);
}

$config = read_config();
$apiKey = trim((string) $config['api_key']);
$tagId = (int) $config['tag_id'];

if ($apiKey === '' || $apiKey === 'PASTE_HERE' || $tagId <= 0) {
    respond(false, 500);
}

$payload = ['email_address' => $email];
$subscriber = kit_post('/subscribers', $payload, $apiKey);
if (!$subscriber['ok']) {
    respond(false, 502);
}

$form = kit_post('/forms/' . KIT_FORM_ID . '/subscribers', $payload, $apiKey);
if (!$form['ok']) {
    respond(false, 502);
}

$tag = kit_post('/tags/' . $tagId . '/subscribers', $payload, $apiKey);
if (!$tag['ok']) {
    respond(false, 502);
}

respond(true);
