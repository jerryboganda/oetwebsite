<?php
declare(strict_types=1);

require_once __DIR__ . '/oet-chat-lib.php';
require_once __DIR__ . '/oet-rate-limit.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function oet_chat_sync_fail(int $status, string $message, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(array_merge([
        'ok' => false,
        'error' => $message,
    ], $extra), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    oet_chat_sync_fail(405, 'method_not_allowed');
}

$threadRef = trim((string) ($_POST['thread_ref'] ?? ''));
if ($threadRef === '') {
    echo json_encode([
        'ok' => true,
        'available' => false,
        'added' => 0,
        'thread_ref' => '',
        'thread' => null,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$threadRef = oet_chat_clean_thread_ref($threadRef);

if (!oet_rl_allow('chat-sync-min', oet_rl_client_ip(), 30, 60)) {
    oet_chat_sync_fail(429, 'rate_limited');
}

$threadExists = oet_chat_thread_exists($threadRef);
$thread = oet_chat_load_thread($threadRef);

// Thread access control: tokenized threads require the matching secret.
$storedToken = (string) ($thread['access_token'] ?? '');
$providedToken = trim((string) ($_POST['access_token'] ?? ''));
if ($threadExists && $storedToken !== '' && !hash_equals($storedToken, $providedToken)) {
    oet_chat_sync_fail(403, 'forbidden');
}

// Throttle mailbox syncs per thread: IMAP is expensive on shared hosting.
$lastSync = (string) ($thread['last_sync_at'] ?? '');
$throttled = false;
if ($threadExists && $lastSync !== '') {
    $lastTs = strtotime($lastSync);
    if ($lastTs !== false && (time() - $lastTs) < 20) {
        $throttled = true;
    }
}

if ($throttled || !$threadExists) {
    $sync = ['ok' => true, 'available' => $threadExists, 'added' => 0, 'folders' => []];
} else {
    $sync = oet_chat_sync_mailbox_for_thread($thread);
}

if (!$throttled && !empty($sync['ok']) && !empty($sync['available'])) {
    if ($threadExists) {
        $thread['last_sync_at'] = oet_chat_now();
        oet_chat_save_thread($thread);
    }
}

echo json_encode([
    'ok' => true,
    'available' => (bool) ($sync['available'] ?? false),
    'added' => (int) ($sync['added'] ?? 0),
    'folders' => $sync['folders'] ?? [],
    'thread_ref' => $threadRef,
    'thread' => oet_chat_public_thread($thread),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

