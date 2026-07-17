<?php
declare(strict_types=1);

function oet_chat_config(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $supportEmail = trim((string) (getenv('OET_SUPPORT_EMAIL') ?: 'support@oetwithdrhesham.co.uk'));
    $supportName = trim((string) (getenv('OET_SUPPORT_NAME') ?: 'OET Support'));

    $config = [
        'support_email' => $supportEmail !== '' ? $supportEmail : 'support@oetwithdrhesham.co.uk',
        'support_name' => $supportName !== '' ? $supportName : 'OET Support',
        'storage_root' => __DIR__ . '/storage/oet-chat',
        'smtp' => [
            'host' => trim((string) (getenv('OET_SMTP_HOST') ?: '')),
            'port' => (int) (getenv('OET_SMTP_PORT') ?: 587),
            'username' => trim((string) (getenv('OET_SMTP_USERNAME') ?: '')),
            'password' => trim((string) (getenv('OET_SMTP_PASSWORD') ?: '')),
            'encryption' => strtolower(trim((string) (getenv('OET_SMTP_ENCRYPTION') ?: 'tls'))),
            'from_email' => trim((string) (getenv('OET_SMTP_FROM') ?: $supportEmail)),
            'from_name' => trim((string) (getenv('OET_SMTP_FROM_NAME') ?: 'OET Website')),
        ],
        'imap' => [
            'host' => trim((string) (getenv('OET_IMAP_HOST') ?: '')),
            'port' => (int) (getenv('OET_IMAP_PORT') ?: 993),
            'username' => trim((string) (getenv('OET_IMAP_USERNAME') ?: '')),
            'password' => trim((string) (getenv('OET_IMAP_PASSWORD') ?: '')),
            'encryption' => strtolower(trim((string) (getenv('OET_IMAP_ENCRYPTION') ?: 'ssl'))),
            'inbox_mailbox' => trim((string) (getenv('OET_IMAP_INBOX_MAILBOX') ?: 'INBOX')),
            'sent_mailbox' => trim((string) (getenv('OET_IMAP_SENT_MAILBOX') ?: 'Sent Items')),
        ],
    ];

    return $config;
}

function oet_chat_now(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DATE_ATOM);
}

function oet_chat_normalize_text(string $text): string
{
    $text = str_replace(["\r\n", "\r"], "\n", trim($text));
    $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;
    return trim($text);
}

function oet_chat_storage_root(): string
{
    return oet_chat_config()['storage_root'];
}

function oet_chat_threads_dir(): string
{
    return oet_chat_storage_root() . '/threads';
}

function oet_chat_ensure_storage(): void
{
    $dirs = [
        oet_chat_storage_root(),
        oet_chat_threads_dir(),
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
    }
}

function oet_chat_generate_thread_ref(): string
{
    try {
        $token = strtoupper(bin2hex(random_bytes(4)));
    } catch (Throwable $e) {
        $token = strtoupper(substr(sha1(uniqid('', true)), 0, 8));
    }

    return 'OETCHAT-' . $token;
}

function oet_chat_clean_thread_ref(?string $threadRef): string
{
    $threadRef = strtoupper(trim((string) $threadRef));
    $threadRef = preg_replace('/[^A-Z0-9\-]/', '', $threadRef) ?? '';

    if ($threadRef === '') {
        return oet_chat_generate_thread_ref();
    }

    return $threadRef;
}

function oet_chat_thread_path(string $threadRef): string
{
    oet_chat_ensure_storage();
    return oet_chat_threads_dir() . '/' . oet_chat_clean_thread_ref($threadRef) . '.json';
}

function oet_chat_default_thread(string $threadRef): array
{
    $now = oet_chat_now();

    return [
        'thread_ref' => oet_chat_clean_thread_ref($threadRef),
        'created_at' => $now,
        'updated_at' => $now,
        'last_sync_at' => null,
        'visitor' => [
            'name' => '',
            'email' => '',
            'phone' => '',
        ],
        'messages' => [],
        'message_signatures' => [],
    ];
}

function oet_chat_load_thread(string $threadRef): array
{
    $path = oet_chat_thread_path($threadRef);
    if (!is_file($path)) {
        return oet_chat_default_thread($threadRef);
    }

    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return oet_chat_default_thread($threadRef);
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return oet_chat_default_thread($threadRef);
    }

    $data['thread_ref'] = oet_chat_clean_thread_ref((string) ($data['thread_ref'] ?? $threadRef));
    $data['visitor'] = array_merge(
        ['name' => '', 'email' => '', 'phone' => ''],
        is_array($data['visitor'] ?? null) ? $data['visitor'] : []
    );
    $data['messages'] = is_array($data['messages'] ?? null) ? $data['messages'] : [];
    $data['message_signatures'] = is_array($data['message_signatures'] ?? null) ? $data['message_signatures'] : [];
    $data['created_at'] = (string) ($data['created_at'] ?? oet_chat_now());
    $data['updated_at'] = (string) ($data['updated_at'] ?? oet_chat_now());
    $data['last_sync_at'] = $data['last_sync_at'] ?? null;

    return $data;
}

function oet_chat_save_thread(array $thread): bool
{
    oet_chat_ensure_storage();

    $threadRef = oet_chat_clean_thread_ref((string) ($thread['thread_ref'] ?? ''));
    if ($threadRef === '') {
        return false;
    }

    $thread['thread_ref'] = $threadRef;
    $thread['updated_at'] = oet_chat_now();

    $payload = json_encode(
        $thread,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    if ($payload === false) {
        return false;
    }

    return file_put_contents(oet_chat_thread_path($threadRef), $payload . PHP_EOL, LOCK_EX) !== false;
}

function oet_chat_next_message_id(array $thread): int
{
    $maxId = 0;
    foreach ($thread['messages'] ?? [] as $message) {
        $maxId = max($maxId, (int) ($message['id'] ?? 0));
    }

    return $maxId + 1;
}

function oet_chat_append_message(array &$thread, array $message): array
{
    $message = array_merge([
        'id' => oet_chat_next_message_id($thread),
        'role' => 'user',
        'name' => '',
        'email' => '',
        'phone' => '',
        'text' => '',
        'source' => 'website',
        'created_at' => oet_chat_now(),
        'signature' => '',
    ], $message);

    $thread['messages'][] = $message;
    return $message;
}

function oet_chat_public_thread(array $thread): array
{
    $messages = [];
    foreach ($thread['messages'] ?? [] as $message) {
        $messages[] = [
            'id' => (int) ($message['id'] ?? 0),
            'role' => (string) ($message['role'] ?? 'user'),
            'name' => (string) ($message['name'] ?? ''),
            'email' => (string) ($message['email'] ?? ''),
            'phone' => (string) ($message['phone'] ?? ''),
            'text' => (string) ($message['text'] ?? ''),
            'source' => (string) ($message['source'] ?? 'website'),
            'created_at' => (string) ($message['created_at'] ?? oet_chat_now()),
        ];
    }

    return [
        'thread_ref' => (string) ($thread['thread_ref'] ?? ''),
        'created_at' => (string) ($thread['created_at'] ?? oet_chat_now()),
        'updated_at' => (string) ($thread['updated_at'] ?? oet_chat_now()),
        'last_sync_at' => $thread['last_sync_at'] ?? null,
        'visitor' => array_merge(
            ['name' => '', 'email' => '', 'phone' => ''],
            is_array($thread['visitor'] ?? null) ? $thread['visitor'] : []
        ),
        'messages' => $messages,
    ];
}

function oet_chat_strip_quoted_sections(string $text): string
{
    $patterns = [
        "/\nOn .+ wrote:\n/is",
        "/\n-----Original Message-----\n/is",
        "/\nFrom: .+\nSent: .+\nTo: .+\nSubject: .+\n/is",
    ];

    foreach ($patterns as $pattern) {
        $parts = preg_split($pattern, $text, 2);
        if (is_array($parts) && isset($parts[0])) {
            $text = $parts[0];
        }
    }

    return trim($text);
}

function oet_chat_parse_sender(string $rawFrom): array
{
    $rawFrom = trim($rawFrom);
    $name = $rawFrom;
    $email = '';

    if (preg_match('/^(.*)<([^>]+)>$/', $rawFrom, $matches)) {
        $name = trim(trim($matches[1]), '"');
        $email = trim($matches[2]);
    } elseif (filter_var($rawFrom, FILTER_VALIDATE_EMAIL)) {
        $email = $rawFrom;
        $name = $rawFrom;
    }

    $name = trim((string) (function_exists('imap_utf8') ? imap_utf8($name) : $name));
    $email = trim($email);

    if ($name === '') {
        $name = 'OET Support';
    }

    return ['name' => $name, 'email' => $email];
}

function oet_chat_build_message_signature(array $overview, string $body): string
{
    $messageId = trim((string) ($overview->message_id ?? ''));
    if ($messageId !== '') {
        return $messageId;
    }

    return sha1(
        ((string) ($overview->date ?? '')) . '|' .
        ((string) ($overview->from ?? '')) . '|' .
        ((string) ($overview->subject ?? '')) . '|' .
        $body
    );
}

function oet_chat_fetch_imap_body($imap, int $uid): string
{
    $body = (string) @imap_body($imap, $uid, FT_UID | FT_PEEK);
    $structure = @imap_fetchstructure($imap, $uid, FT_UID);

    if (is_object($structure) && isset($structure->encoding)) {
        if ((int) $structure->encoding === 3) {
            $decoded = base64_decode($body, true);
            if ($decoded !== false) {
                $body = $decoded;
            }
        } elseif ((int) $structure->encoding === 4) {
            $body = quoted_printable_decode($body);
        }
    }

    $body = html_entity_decode(strip_tags($body), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $body = preg_replace('/\s+/', ' ', trim($body)) ?? trim($body);
    return oet_chat_strip_quoted_sections($body);
}

function oet_chat_folder_name(array $imapConfig, string $folder): string
{
    $host = $imapConfig['host'];
    $port = (int) $imapConfig['port'];
    $encryption = strtolower((string) $imapConfig['encryption']);
    $suffix = '/' . strtolower($encryption === 'ssl' ? 'ssl' : 'tls');
    if ($encryption === 'none') {
        $suffix = '/notls';
    }

    return sprintf('{%s:%d%s}%s', $host, $port, $suffix, $folder);
}

function oet_chat_smtp_write($socket, string $command, array $expectedCodes): string
{
    fwrite($socket, $command . "\r\n");
    $response = '';

    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }

        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }

    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException(trim($response) !== '' ? trim($response) : 'SMTP command failed');
    }

    return $response;
}

function oet_chat_send_via_smtp(array $smtp, string $to, string $subject, string $body, array $headers): array
{
    if ($smtp['host'] === '' || $smtp['username'] === '' || $smtp['password'] === '') {
        return ['ok' => false, 'error' => 'smtp_not_configured'];
    }

    $encryption = strtolower((string) $smtp['encryption']);
    $transportHost = $encryption === 'ssl' ? 'ssl://' . $smtp['host'] : $smtp['host'];
    $socket = @stream_socket_client(
        sprintf('%s:%d', $transportHost, (int) $smtp['port']),
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT
    );

    if (!$socket) {
        return ['ok' => false, 'error' => 'smtp_connect_failed: ' . $errstr];
    }

    stream_set_timeout($socket, 20);

    try {
        $greeting = '';
        while (!feof($socket)) {
            $line = fgets($socket, 515);
            if ($line === false) {
                break;
            }
            $greeting .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
        }
        if ((int) substr($greeting, 0, 3) !== 220) {
            throw new RuntimeException(trim($greeting) !== '' ? trim($greeting) : 'SMTP greeting failed');
        }

        oet_chat_smtp_write($socket, 'EHLO oetwithdrhesham.co.uk', [250]);

        if ($encryption === 'tls') {
            oet_chat_smtp_write($socket, 'STARTTLS', [220]);
            $enabled = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($enabled !== true) {
                throw new RuntimeException('SMTP TLS negotiation failed');
            }
            oet_chat_smtp_write($socket, 'EHLO oetwithdrhesham.co.uk', [250]);
        }

        oet_chat_smtp_write($socket, 'AUTH LOGIN', [334]);
        oet_chat_smtp_write($socket, base64_encode((string) $smtp['username']), [334]);
        oet_chat_smtp_write($socket, base64_encode((string) $smtp['password']), [235]);

        oet_chat_smtp_write($socket, 'MAIL FROM:<' . $smtp['from_email'] . '>', [250]);
        oet_chat_smtp_write($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        oet_chat_smtp_write($socket, 'DATA', [354]);

        $payload = '';
        $payload .= 'From: ' . $smtp['from_name'] . ' <' . $smtp['from_email'] . ">\r\n";
        foreach ($headers as $header) {
            $payload .= $header . "\r\n";
        }
        $payload .= 'To: ' . $to . "\r\n";
        $payload .= 'Subject: ' . $subject . "\r\n";
        $payload .= "Date: " . gmdate(DATE_RFC2822) . "\r\n";
        $payload .= "\r\n";
        $payload .= preg_replace('/^\./m', '..', $body) . "\r\n";
        $payload .= ".\r\n";

        fwrite($socket, $payload);
        $response = '';
        while (!feof($socket)) {
            $line = fgets($socket, 515);
            if ($line === false) {
                break;
            }
            $response .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
        }

        if ((int) substr($response, 0, 3) !== 250) {
            throw new RuntimeException(trim($response) !== '' ? trim($response) : 'SMTP data send failed');
        }

        @fwrite($socket, "QUIT\r\n");
        fclose($socket);

        return ['ok' => true, 'mode' => 'smtp'];
    } catch (Throwable $e) {
        fclose($socket);
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}

function oet_chat_send_via_mail(array $config, string $to, string $subject, string $body, array $headers): array
{
    $headerLines = $headers;
    $headerLines[] = 'From: ' . $config['support_name'] . ' <' . $config['support_email'] . '>';
    $headerLines[] = 'To: ' . $to;
    $headerLines[] = 'Subject: ' . $subject;
    $headerLines[] = 'Date: ' . gmdate(DATE_RFC2822);

    $result = @mail(
        $to,
        $subject,
        $body,
        implode("\r\n", $headerLines)
    );

    return $result
        ? ['ok' => true, 'mode' => 'mail']
        : ['ok' => false, 'error' => 'mail_transport_failed'];
}

function oet_chat_send_support_email(array $thread, array $visitor, string $messageText): array
{
    $config = oet_chat_config();
    $threadRef = (string) ($thread['thread_ref'] ?? '');
    $subject = sprintf('OET Live Chat [%s] - %s', $threadRef, $visitor['name'] !== '' ? $visitor['name'] : 'Website visitor');

    $body = [];
    $body[] = 'A new live chat message was sent from the OET website.';
    $body[] = '';
    $body[] = 'Thread Ref: ' . $threadRef;
    $body[] = 'Visitor Name: ' . ($visitor['name'] !== '' ? $visitor['name'] : 'Not provided');
    $body[] = 'Visitor Email: ' . ($visitor['email'] !== '' ? $visitor['email'] : 'Not provided');
    $body[] = 'Visitor Phone: ' . ($visitor['phone'] !== '' ? $visitor['phone'] : 'Not provided');
    $body[] = '';
    $body[] = 'Message:';
    $body[] = $messageText;
    $body[] = '';
    $body[] = 'Reply directly to this email to continue the conversation.';
    $body[] = 'The website sync keeps this thread connected to the live widget.';
    $body[] = '';
    $body[] = 'Submitted at: ' . $thread['updated_at'];
    $body[] = 'Website: ' . (getenv('OET_SITE_URL') ?: 'https://oetwithdrhesham.co.uk');
    $body = implode("\r\n", $body);

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . ($visitor['name'] !== '' ? $visitor['name'] : 'OET Visitor') . ' <' . $visitor['email'] . '>',
        'X-OET-Thread-Ref: ' . $threadRef,
        'X-OET-Message-Type: user',
        'X-OET-Source: website-widget',
        'X-OET-Visitor-Email: ' . $visitor['email'],
    ];

    $smtp = $config['smtp'];
    if ($smtp['host'] !== '' && $smtp['username'] !== '' && $smtp['password'] !== '') {
        $sent = oet_chat_send_via_smtp($smtp, $config['support_email'], $subject, $body, $headers);
        if ($sent['ok']) {
            return $sent;
        }
    }

    return oet_chat_send_via_mail($config, $config['support_email'], $subject, $body, $headers);
}

function oet_chat_sync_mailbox_for_thread(array &$thread): array
{
    $config = oet_chat_config();
    $imap = $config['imap'];

    if (!function_exists('imap_open')) {
        return ['ok' => false, 'available' => false, 'reason' => 'imap_extension_missing', 'added' => 0];
    }

    if ($imap['host'] === '' || $imap['username'] === '' || $imap['password'] === '') {
        return ['ok' => false, 'available' => false, 'reason' => 'imap_not_configured', 'added' => 0];
    }

    $folders = array_values(array_unique(array_filter([
        $imap['inbox_mailbox'],
        $imap['sent_mailbox'],
    ])));

    $threadRef = (string) ($thread['thread_ref'] ?? '');
    $seen = array_fill_keys(is_array($thread['message_signatures'] ?? null) ? $thread['message_signatures'] : [], true);
    $added = 0;
    $visitedFolders = [];

    foreach ($folders as $folder) {
        $mailbox = oet_chat_folder_name($imap, $folder);
        $handle = @imap_open($mailbox, $imap['username'], $imap['password'], 0, 1, [
            'DISABLE_AUTHENTICATOR' => 'GSSAPI',
        ]);

        if (!$handle) {
            continue;
        }

        $visitedFolders[] = $folder;
        $search = @imap_search($handle, 'SUBJECT "' . addcslashes($threadRef, '"\\') . '"', SE_UID);
        if (!is_array($search) || $search === []) {
            @imap_close($handle);
            continue;
        }

        sort($search);

        foreach ($search as $uid) {
            $overview = @imap_fetch_overview($handle, (string) $uid, FT_UID);
            if (!is_array($overview) || !isset($overview[0])) {
                continue;
            }

            $head = (string) @imap_fetchheader($handle, $uid, FT_UID);
            if (stripos($head, 'X-OET-Message-Type: user') !== false) {
                continue;
            }

            $body = oet_chat_fetch_imap_body($handle, $uid);
            if ($body === '') {
                continue;
            }

            $signature = oet_chat_build_message_signature($overview[0], $body);
            if (isset($seen[$signature])) {
                continue;
            }

            $sender = oet_chat_parse_sender((string) ($overview[0]->from ?? 'OET Support'));
            $createdAt = (string) ($overview[0]->date ?? oet_chat_now());
            $thread['messages'][] = [
                'id' => oet_chat_next_message_id($thread),
                'role' => 'agent',
                'name' => $sender['name'],
                'email' => $sender['email'],
                'phone' => '',
                'text' => $body,
                'source' => 'email',
                'created_at' => $createdAt,
                'signature' => $signature,
            ];
            $seen[$signature] = true;
            $thread['message_signatures'][] = $signature;
            $added++;
        }

        @imap_close($handle);
    }

    if ($added > 0) {
        $thread['last_sync_at'] = oet_chat_now();
        $thread['updated_at'] = oet_chat_now();
    }

    return [
        'ok' => true,
        'available' => true,
        'added' => $added,
        'folders' => $visitedFolders,
    ];
}

