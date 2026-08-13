<?php
declare(strict_types=1);

require_once __DIR__ . '/oet-chat-lib.php';
require_once __DIR__ . '/oet-rate-limit.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (!function_exists('mb_strlen')) {
    function mb_strlen(string $value): int
    {
        return strlen($value);
    }
}

function oet_chat_fail(int $status, string $message, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(array_merge([
        'ok' => false,
        'error' => $message,
    ], $extra), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    oet_chat_fail(405, 'method_not_allowed');
}

$honeypot = trim((string) ($_POST['company'] ?? ''));
if ($honeypot !== '') {
    oet_chat_fail(400, 'invalid_request');
}

$clientIp = oet_rl_client_ip();
if (!oet_rl_allow('chat-send-min', $clientIp, 5, 60) || !oet_rl_allow('chat-send-day', $clientIp, 60, 86400)) {
    oet_chat_fail(429, 'rate_limited', [
        'message' => 'You are sending messages too quickly. Please wait a moment and try again.',
    ]);
}

$threadRef = oet_chat_clean_thread_ref((string) ($_POST['thread_ref'] ?? ''));
$providedToken = trim((string) ($_POST['access_token'] ?? ''));
$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$messageText = trim((string) ($_POST['message'] ?? ''));

if (mb_strlen($name) > 120 || mb_strlen($email) > 254 || mb_strlen($phone) > 40 || mb_strlen($messageText) > 4000) {
    oet_chat_fail(413, 'too_long', [
        'message' => 'Your message is too long. Please keep it under 4,000 characters.',
    ]);
}

$messageText = oet_chat_normalize_text($messageText);
$name = oet_chat_header_value($name);
$phone = oet_chat_header_value($phone);

if ($name === '' || $email === '' || $messageText === '') {
    oet_chat_fail(422, 'missing_fields', [
        'message' => 'Please add your name, email address, and message.',
    ]);
}

$emailValid = filter_var($email, FILTER_VALIDATE_EMAIL);
if ($emailValid === false) {
    oet_chat_fail(422, 'invalid_email', [
        'message' => 'Please enter a valid email address.',
    ]);
}

$threadExists = oet_chat_thread_exists($threadRef);
$thread = oet_chat_load_thread($threadRef);

// Thread access control: existing tokenized threads require the matching secret.
$storedToken = (string) ($thread['access_token'] ?? '');
if ($threadExists && $storedToken !== '' && !hash_equals($storedToken, $providedToken)) {
    oet_chat_fail(403, 'forbidden', [
        'message' => 'This chat reference could not be verified. Please start a new chat.',
    ]);
}
if ($storedToken === '') {
    $thread['access_token'] = oet_chat_generate_access_token();
}

if (count($thread['messages'] ?? []) >= 300) {
    oet_chat_fail(429, 'thread_full', [
        'message' => 'This conversation is very long. Please email support@oetwithdrhesham.co.uk to continue.',
    ]);
}

$thread['thread_ref'] = $threadRef;
$thread['visitor'] = array_merge($thread['visitor'] ?? [], [
    'name' => $name,
    'email' => $emailValid,
    'phone' => $phone,
]);
$thread['updated_at'] = oet_chat_now();

$dispatch = oet_chat_send_support_email($thread, [
    'name' => $name,
    'email' => $emailValid,
    'phone' => $phone,
], $messageText);

if (empty($dispatch['ok'])) {
    oet_chat_fail(502, 'send_failed', [
        'message' => 'We could not send your message right now. Please try again in a moment.',
        'transport' => (string) ($dispatch['error'] ?? 'unknown'),
    ]);
}

oet_chat_append_message($thread, [
    'role' => 'user',
    'name' => $name,
    'email' => $emailValid,
    'phone' => $phone,
    'text' => $messageText,
    'source' => 'website',
    'created_at' => oet_chat_now(),
    'signature' => sha1($threadRef . '|' . $name . '|' . $emailValid . '|' . $messageText),
]);

oet_chat_save_thread($thread);

echo json_encode([
    'ok' => true,
    'message' => 'Your message has been sent to the OET team.',
    'thread_ref' => $threadRef,
    'access_token' => (string) $thread['access_token'],
    'delivery_mode' => (string) ($dispatch['mode'] ?? 'mail'),
    'thread' => oet_chat_public_thread($thread),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

