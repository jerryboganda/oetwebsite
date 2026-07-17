<?php
declare(strict_types=1);

require_once __DIR__ . '/oet-chat-lib.php';

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
$thread = oet_chat_load_thread($threadRef);
$sync = oet_chat_sync_mailbox_for_thread($thread);

if (!empty($sync['ok']) && !empty($sync['available'])) {
    oet_chat_save_thread($thread);
}

echo json_encode([
    'ok' => true,
    'available' => (bool) ($sync['available'] ?? false),
    'added' => (int) ($sync['added'] ?? 0),
    'folders' => $sync['folders'] ?? [],
    'thread_ref' => $threadRef,
    'thread' => oet_chat_public_thread($thread),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

