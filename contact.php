<?php
declare(strict_types=1);

if (!function_exists('mb_substr')) {
    function mb_substr(string $value, int $start, ?int $length = null): string
    {
        return $length === null ? substr($value, $start) : substr($value, $start, $length);
    }
}

function clean_value(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    return $value;
}

function redirect_back(string $status): void
{
    header('Location: contact.html?' . $status);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_back('error=method');
}

// Honeypot: real visitors never fill this hidden field. Pretend success for bots.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    redirect_back('sent=1');
}

// Time-trap: JS stamps form_ts on load; instant submits are bots.
// An empty value is allowed so no-JS visitors are not blocked.
$form_ts = (string)($_POST['form_ts'] ?? '');
if ($form_ts !== '' && ctype_digit($form_ts)) {
    $elapsed_ms = (int)round(microtime(true) * 1000) - (int)$form_ts;
    if ($elapsed_ms >= 0 && $elapsed_ms < 3000) {
        redirect_back('sent=1');
    }
}

$name = mb_substr(clean_value((string)($_POST['name'] ?? '')), 0, 120);
$email_raw = mb_substr(clean_value((string)($_POST['email'] ?? '')), 0, 254);
$phone = mb_substr(clean_value((string)($_POST['phone'] ?? '')), 0, 30);
$profession = mb_substr(clean_value((string)($_POST['profession'] ?? '')), 0, 40);
$support_needed = mb_substr(clean_value((string)($_POST['support_needed'] ?? '')), 0, 40);
$message = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 5000);

$email = filter_var($email_raw, FILTER_VALIDATE_EMAIL);

if (
    $name === '' ||
    $email === false ||
    $phone === '' ||
    $profession === '' ||
    $support_needed === '' ||
    $message === ''
) {
    redirect_back('error=missing');
}

$to = 'support@oetwithdrhesham.co.uk';
$subject = 'OET Support Enquiry from ' . $name;
$body = [];
$body[] = 'New enquiry submitted from the website contact form.';
$body[] = '';
$body[] = 'Name: ' . $name;
$body[] = 'Email: ' . $email;
$body[] = 'WhatsApp Number: ' . $phone;
$body[] = 'Profession: ' . $profession;
$body[] = 'Support Needed: ' . $support_needed;
$body[] = '';
$body[] = 'Message:';
$body[] = $message;
$body[] = '';
$body[] = 'Submitted at: ' . date('Y-m-d H:i:s');
$body[] = 'IP Address: ' . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown');
$body = implode("\r\n", $body);

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: OET Website <support@oetwithdrhesham.co.uk>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    redirect_back('sent=1');
}

redirect_back('error=mail');
