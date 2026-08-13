<?php
declare(strict_types=1);

/**
 * Shared file-based rate limiter for the website's PHP endpoints.
 * Fixed-window counters stored under storage/oet-chat/ratelimit
 * (directory is denied to the web by storage/oet-chat/.htaccess).
 * Fails open: storage trouble must never take the feature down.
 */

function oet_rl_dir(): string
{
    return __DIR__ . '/storage/oet-chat/ratelimit';
}

function oet_rl_client_ip(): string
{
    // REMOTE_ADDR only — X-Forwarded-For is spoofable on shared hosting.
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/**
 * Register a hit and report whether the request is still within the limit.
 *
 * @param string $bucket logical counter name, e.g. "contact-ip"
 * @param string $key    subject being limited, e.g. the client IP
 * @param int    $max    maximum hits allowed inside the window
 * @param int    $windowSeconds window length in seconds
 */
function oet_rl_allow(string $bucket, string $key, int $max, int $windowSeconds): bool
{
    $dir = oet_rl_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
        return true;
    }

    $bucket = preg_replace('/[^a-z0-9_-]/i', '', $bucket) ?? 'bucket';
    $path = $dir . '/' . $bucket . '-' . sha1($key) . '.json';

    $fp = @fopen($path, 'c+');
    if ($fp === false) {
        return true;
    }

    $allowed = true;

    try {
        if (!flock($fp, LOCK_EX)) {
            return true;
        }

        $now = time();
        $state = ['start' => $now, 'count' => 0];

        $raw = stream_get_contents($fp);
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['start'], $decoded['count'])) {
                $state = ['start' => (int) $decoded['start'], 'count' => (int) $decoded['count']];
            }
        }

        if ($now - $state['start'] >= $windowSeconds) {
            $state = ['start' => $now, 'count' => 0];
        }

        $state['count']++;
        $allowed = $state['count'] <= $max;

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) json_encode($state));
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }

    // Opportunistic GC: roughly 1% of requests sweep stale counters.
    if (random_int(1, 100) === 1) {
        $stale = time() - 2 * 86400;
        foreach ((array) @glob($dir . '/*.json') as $file) {
            if (is_string($file) && @filemtime($file) < $stale) {
                @unlink($file);
            }
        }
    }

    return $allowed;
}
