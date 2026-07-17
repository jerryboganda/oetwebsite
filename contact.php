<?php
declare(strict_types=1);

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

$name = clean_value((string)($_POST['name'] ?? ''));
$email_raw = clean_value((string)($_POST['email'] ?? ''));
$phone = clean_value((string)($_POST['phone'] ?? ''));
$profession = clean_value((string)($_POST['profession'] ?? ''));
$support_needed = clean_value((string)($_POST['support_needed'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

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
