<?php
/* MSA Vegas 2026 consultation request: rodrikconsulting.com/#request
   Upload to public_html/msa2026/index.php. The homepage loads this file and shows the form
   at the top of the page only when the address ends in #request (the brochure and tabletop
   QR codes). This file also receives the form and saves it, and sends anyone who opens
   /msa2026 on to /#request. Only first name, email and company are required. */

/* ===== Settings: fill these in before the event ===== */
// Where new-lead alerts go.
const MSA_NOTIFY_TO = 'oscar@rodrikconsulting.com';
// Mailbox the lead alerts are sent from, and its password (the one you use for webmail;
// hPanel > Emails can reset it). Sending signed in through Hostinger's mail server is what
// gets the alerts into your rodrikconsulting.com inbox. Left empty, the page falls back to
// PHP mail(), which Hostinger may filter when it is addressed to your own domain.
const MSA_MAIL_FROM = 'oscar@rodrikconsulting.com';
const MSA_SMTP_PASS = '';
// Also send the visitor a short "thanks, I'll be in touch" email, from this address.
// Replies to it go to MSA_NOTIFY_TO. If the no-reply mailbox exists in hPanel > Emails, put its
// password here so it is sent signed in too; left empty, it is sent with PHP mail().
const MSA_SEND_VISITOR_COPY = true;
const MSA_VISITOR_FROM = 'no-reply@rodrikconsulting.com';
const MSA_VISITOR_FROM_NAME = 'Rodrik Consulting';
const MSA_VISITOR_SMTP_PASS = '';
// Hostinger's outgoing mail server.
const MSA_SMTP_HOST = 'smtp.hostinger.com';
const MSA_SMTP_PORT = 465;
// MySQL database from hPanel > Databases (browse leads in phpMyAdmin).
// Leave MSA_DB_NAME empty to save to a SQLite file outside public_html instead.
const MSA_DB_HOST = 'localhost';
const MSA_DB_NAME = '';
const MSA_DB_USER = '';
const MSA_DB_PASS = '';

const MSA_HOME_URL = 'https://rodrikconsulting.com/';
const MSA_REDIRECT_SECONDS = 5;

/* ===== Form options (the labels are what gets saved and emailed) ===== */
const MSA_SIZES = [
  '1-10' => '1–10 employees', '11-50' => '11–50 employees', '51-200' => '51–200 employees',
  '201-1000' => '201–1,000 employees', '1000+' => '1,000+ employees',
];
const MSA_HELP = [
  'ai' => 'AI strategy & adoption', 'automation' => 'Automation & workflows',
  'data' => 'Data, analytics & dashboards', 'web' => 'Website & digital presence',
  'apps' => 'Custom apps & software', 'governance' => 'AI governance & risk',
  'leadership' => 'Leadership & strategy', 'unsure' => 'Not sure yet',
];
const MSA_MEETING = [
  'video' => 'Video call', 'phone' => 'Phone call', 'in_person' => 'In person', 'email' => 'Email first',
];
const MSA_TIMING = [
  'this_week' => 'This week', 'two_weeks' => 'Within 2 weeks',
  'month' => 'Within a month', 'no_rush' => 'No rush, just exploring',
];
const MSA_MAX = [
  'first_name' => 100, 'last_name' => 100, 'email' => 254, 'company' => 200, 'phone' => 50,
  'website' => 255, 'role' => 150, 'location' => 150, 'challenges' => 5000,
];

if (session_status() !== PHP_SESSION_ACTIVE) session_start();
if (empty($_SESSION['msa_csrf'])) $_SESSION['msa_csrf'] = bin2hex(random_bytes(16));

function msa_h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* Private folder for the SQLite file and logs: next to public_html, so it can't be downloaded. */
function msa_data_dir(): ?string {
  static $dir = false;
  if ($dir !== false) return $dir;
  $root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
  $candidates = $root !== '' ? [dirname($root) . '/msa2026-data'] : [];
  $candidates[] = __DIR__ . '/.data';
  foreach ($candidates as $c) {
    if ((is_dir($c) || @mkdir($c, 0750, true)) && is_writable($c)) {
      if (strpos($c, __DIR__) === 0 && !file_exists("$c/.htaccess")) {
        @file_put_contents("$c/.htaccess", "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
      }
      return $dir = $c;
    }
  }
  return $dir = null;
}

function msa_log(string $file, string $line): void {
  $dir = msa_data_dir();
  $entry = gmdate('Y-m-d H:i:s') . " UTC  $line\n";
  if (!$dir || @file_put_contents("$dir/$file", $entry, FILE_APPEND | LOCK_EX) === false) {
    error_log("[msa2026] $line"); // falls back to the server's PHP error log
  }
}

function msa_db(): PDO {
  $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
  if (MSA_DB_NAME !== '') {
    $pdo = new PDO('mysql:host=' . MSA_DB_HOST . ';dbname=' . MSA_DB_NAME . ';charset=utf8mb4', MSA_DB_USER, MSA_DB_PASS, $opts);
    $pdo->exec("CREATE TABLE IF NOT EXISTS msa_leads (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      created_at DATETIME NOT NULL COMMENT 'UTC',
      first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NULL,
      email VARCHAR(254) NOT NULL, company VARCHAR(200) NOT NULL,
      phone VARCHAR(50) NULL, website VARCHAR(255) NULL, role VARCHAR(150) NULL, location VARCHAR(150) NULL,
      company_size VARCHAR(40) NULL, help_areas VARCHAR(500) NULL, challenges TEXT NULL,
      meeting_method VARCHAR(40) NULL, timing VARCHAR(40) NULL,
      source VARCHAR(40) NULL, ip VARCHAR(45) NULL, user_agent VARCHAR(255) NULL,
      notify_status VARCHAR(20) NOT NULL DEFAULT 'pending', notify_error VARCHAR(500) NULL, notified_at DATETIME NULL,
      KEY idx_created (created_at), KEY idx_notify (notify_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    return $pdo;
  }
  $dir = msa_data_dir();
  if (!$dir) throw new RuntimeException('No writable folder for the leads database');
  $pdo = new PDO("sqlite:$dir/msa2026-leads.sqlite", null, null, $opts);
  $pdo->exec('PRAGMA busy_timeout = 5000');
  $pdo->exec("CREATE TABLE IF NOT EXISTS msa_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    first_name TEXT NOT NULL, last_name TEXT, email TEXT NOT NULL, company TEXT NOT NULL,
    phone TEXT, website TEXT, role TEXT, location TEXT,
    company_size TEXT, help_areas TEXT, challenges TEXT, meeting_method TEXT, timing TEXT,
    source TEXT, ip TEXT, user_agent TEXT,
    notify_status TEXT NOT NULL DEFAULT 'pending', notify_error TEXT, notified_at TEXT
  )");
  return $pdo;
}

function msa_clean_text($v, int $max, bool $multiline = false): string {
  $v = is_string($v) ? $v : '';
  $v = $multiline ? str_replace(["\r\n", "\r"], "\n", $v) : preg_replace('/\s+/u', ' ', $v);
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$v);
  $v = trim((string)$v);
  return mb_substr($v, 0, $max, 'UTF-8');
}

/* Returns [clean values, field errors]. Only first name, email and company can fail. */
function msa_validate(array $in): array {
  $d = [];
  foreach (MSA_MAX as $k => $max) $d[$k] = msa_clean_text($in[$k] ?? '', $max, $k === 'challenges');
  $d['company_size'] = MSA_SIZES[$in['company_size'] ?? ''] ?? '';
  $d['meeting_method'] = MSA_MEETING[$in['meeting_method'] ?? ''] ?? '';
  $d['timing'] = MSA_TIMING[$in['timing'] ?? ''] ?? '';
  $help = [];
  foreach ((array)($in['help'] ?? []) as $k) if (is_string($k) && isset(MSA_HELP[$k])) $help[$k] = MSA_HELP[$k];
  $d['help_areas'] = implode('; ', $help);
  $d['help_keys'] = array_keys($help);
  $src = strtolower((string)($in['src'] ?? ''));
  $d['source'] = preg_match('/^[a-z0-9_-]{1,40}$/', $src) ? $src : '';

  $e = [];
  if ($d['first_name'] === '') $e['first_name'] = 'Please enter your first name.';
  if ($d['email'] === '') $e['email'] = 'Please enter your email address.';
  elseif (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $e['email'] = 'Please enter a valid email address, like name@company.com.';
  if ($d['company'] === '') $e['company'] = 'Please enter your company name.';
  return [$d, $e];
}

function msa_header_safe(string $s): string { return trim(str_replace(["\r", "\n"], ' ', $s)); }

/* "Dr. Oscar A. Rodriguez" needs quotes in a From line (the periods); non-ASCII names get encoded. */
function msa_display_name(string $name): string {
  $name = msa_header_safe($name);
  if (preg_match('/[^\x20-\x7E]/', $name)) return mb_encode_mimeheader($name, 'UTF-8', 'B', "\r\n");
  return '"' . addcslashes($name, '"\\') . '"';
}

/* Sends a plain-text email from $from. Through Hostinger's SMTP server, signed in as $from, when
   $password is set; otherwise PHP mail(). On failure, $error says why (never includes the password). */
function msa_send_mail(string $to, string $subject, string $body, string $from, string $fromName, string $password,
                       string $replyTo = '', ?string &$error = null): bool {
  $error = null;
  $host = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? '') ?: 'rodrikconsulting.com';
  $headers = [
    'Date: ' . date(DATE_RFC2822),
    'From: ' . msa_display_name($fromName) . " <$from>",
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (explode('@', $from)[1] ?? $host) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
  ];
  if ($replyTo !== '') $headers[] = 'Reply-To: ' . msa_header_safe($replyTo);
  $subject = mb_encode_mimeheader(msa_header_safe($subject), 'UTF-8', 'B', "\r\n");
  $body = str_replace("\r\n", "\n", quoted_printable_encode(str_replace(["\r\n", "\r"], "\n", $body)));

  if ($password === '') {
    $params = filter_var($from, FILTER_VALIDATE_EMAIL) ? '-f' . $from : '';
    error_clear_last();
    if (@mail($to, $subject, $body, implode("\r\n", $headers), $params)) return true;
    $error = 'mail(): ' . (error_get_last()['message'] ?? 'returned false');
    return false;
  }

  $fp = @stream_socket_client('ssl://' . MSA_SMTP_HOST . ':' . MSA_SMTP_PORT, $errno, $errstr, 15);
  if (!$fp) { $error = "SMTP connect to " . MSA_SMTP_HOST . " failed: $errstr"; return false; }
  stream_set_timeout($fp, 20);
  // Send one command (or none, for the greeting) and check the reply code. $shown is what an error may reveal.
  $step = function (?string $line, array $expect, string $shown) use ($fp, &$error): bool {
    if ($line !== null) fwrite($fp, $line . "\r\n");
    $reply = '';
    while (($l = fgets($fp, 1024)) !== false) { $reply .= $l; if (!isset($l[3]) || $l[3] === ' ') break; }
    if (in_array((int)substr($reply, 0, 3), $expect, true)) return true;
    $error = "SMTP $shown: " . (trim($reply) ?: 'no reply');
    return false;
  };
  $message = implode("\r\n", array_merge(["To: <$to>", "Subject: $subject"], $headers)) . "\r\n\r\n"
    . preg_replace('/^\./m', '..', str_replace("\n", "\r\n", $body));
  $ok = $step(null, [220], 'greeting')
    && $step("EHLO $host", [250], 'EHLO')
    && $step('AUTH LOGIN', [334], 'AUTH')
    && $step(base64_encode($from), [334], 'login (username)')
    && $step(base64_encode($password), [235], "login as $from (check its password)")
    && $step("MAIL FROM:<$from>", [250], 'MAIL FROM')
    && $step("RCPT TO:<$to>", [250, 251], "RCPT TO $to")
    && $step('DATA', [354], 'DATA')
    && $step($message . "\r\n.", [250], 'message');
  @fwrite($fp, "QUIT\r\n");
  fclose($fp);
  return $ok;
}

/* Emails go out after the lead is saved. A failure here never loses the lead:
   it is recorded on the row (notify_status) and in msa2026-notify-failures.log for follow-up. */
function msa_notify(PDO $pdo, int $id, array $d): void {
  $problems = [];
  $status = 'sent';
  $when = (new DateTime('now', new DateTimeZone('America/Los_Angeles')))->format('D, M j, Y g:i A T');
  $v = function ($x) { return $x !== '' ? $x : '—'; };

  if (!filter_var(MSA_NOTIFY_TO, FILTER_VALIDATE_EMAIL)) {
    $status = 'not_configured';
    $problems[] = 'MSA_NOTIFY_TO is not set to a valid email address';
  } else {
    $name = trim($d['first_name'] . ' ' . $d['last_name']);
    $body = "New consultation request from rodrikconsulting.com/#request (MSA Vegas 2026)\n"
      . "Lead #$id · $when\n\n"
      . "Name:            {$name}\n"
      . "Email:           {$d['email']}\n"
      . "Company:         {$d['company']}\n"
      . "Phone:           " . $v($d['phone']) . "\n"
      . "Website:         " . $v($d['website']) . "\n"
      . "Role:            " . $v($d['role']) . "\n"
      . "Location:        " . $v($d['location']) . "\n"
      . "Company size:    " . $v($d['company_size']) . "\n"
      . "Needs help with: " . $v($d['help_areas']) . "\n"
      . "Meeting method:  " . $v($d['meeting_method']) . "\n"
      . "Timing:          " . $v($d['timing']) . "\n"
      . "QR source:       " . $v($d['source']) . "\n\n"
      . "Business challenges:\n" . $v($d['challenges']) . "\n\n"
      . "Reply to this email to respond to {$d['first_name']} directly.\n";
    if (!msa_send_mail(MSA_NOTIFY_TO, "New MSA Vegas lead: $name, {$d['company']}", $body, MSA_MAIL_FROM, 'Rodrik Consulting Website', MSA_SMTP_PASS, $d['email'], $why)) {
      $status = 'failed';
      $problems[] = "internal notification failed: $why";
    }
  }

  if (MSA_SEND_VISITOR_COPY) {
    $body = "Hi {$d['first_name']},\n\n"
      . "Thank you for connecting with Rodrik Consulting at MSA Vegas and for sharing a little about {$d['company']}. "
      . "Your information came through, and I look forward to learning more about your business and exploring how we can put AI and technology to work for you.\n\n"
      . "I'll be in touch within one business day. In the meantime, you're welcome to explore " . MSA_HOME_URL . "\n\n"
      . "Dr. Oscar A. Rodriguez, DSL\nRodrik Consulting\n";
    $replyTo = filter_var(MSA_NOTIFY_TO, FILTER_VALIDATE_EMAIL) ? MSA_NOTIFY_TO : '';
    if (!msa_send_mail($d['email'], 'Thank you for connecting, ' . $d['first_name'], $body,
                       MSA_VISITOR_FROM, MSA_VISITOR_FROM_NAME, MSA_VISITOR_SMTP_PASS, $replyTo, $why)) {
      $problems[] = "visitor confirmation failed: $why";
      if ($status === 'sent') $status = 'partial';
    }
  }

  $error = $problems ? mb_substr(implode(' | ', $problems), 0, 500, 'UTF-8') : null;
  if ($problems) msa_log('msa2026-notify-failures.log', "lead #$id ({$d['email']}): $error");
  try {
    $pdo->prepare('UPDATE msa_leads SET notify_status = ?, notify_error = ?, notified_at = ? WHERE id = ?')
        ->execute([$status, $error, gmdate('Y-m-d H:i:s'), $id]);
  } catch (Throwable $t) {
    msa_log('msa2026-notify-failures.log', "lead #$id: could not record notify status: " . $t->getMessage());
  }
}

/* Handles one submission. Returns [http status, response payload]. */
function msa_handle_post(): array {
  $generic = "Sorry, we couldn't save your information just now. Please try again in a moment.";

  if (!hash_equals($_SESSION['msa_csrf'], (string)($_POST['csrf'] ?? ''))) {
    return [419, ['ok' => false, 'code' => 'csrf', 'csrf' => $_SESSION['msa_csrf'],
      'message' => 'Your session timed out. Please press the button again to send your information.']];
  }
  // Honeypot: people never see this field, bots fill it in. Nothing is saved.
  if (trim((string)($_POST['fax_number'] ?? '')) !== '') {
    return [200, ['ok' => true, 'firstName' => msa_clean_text($_POST['first_name'] ?? '', 100)]];
  }
  $recent = array_filter($_SESSION['msa_sent'] ?? [], function ($t) { return $t > time() - 600; });
  if (count($recent) >= 5) {
    return [429, ['ok' => false, 'message' => "Thank you, we've already received several requests from you. We'll be in touch soon."]];
  }

  [$d, $errors] = msa_validate($_POST);
  if ($errors) {
    return [422, ['ok' => false, 'errors' => $errors, 'data' => $d, 'message' => 'Please check the highlighted fields.']];
  }

  try {
    $pdo = msa_db();
    $row = [
      gmdate('Y-m-d H:i:s'), $d['first_name'], $d['last_name'] ?: null, $d['email'], $d['company'],
      $d['phone'] ?: null, $d['website'] ?: null, $d['role'] ?: null, $d['location'] ?: null,
      $d['company_size'] ?: null, $d['help_areas'] ?: null, $d['challenges'] ?: null,
      $d['meeting_method'] ?: null, $d['timing'] ?: null, $d['source'] ?: null,
      mb_substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45), mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255, 'UTF-8'),
    ];
    $pdo->prepare('INSERT INTO msa_leads (created_at, first_name, last_name, email, company, phone, website, role, location,
        company_size, help_areas, challenges, meeting_method, timing, source, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute($row);
    $id = (int)$pdo->lastInsertId();
    if ($id < 1) throw new RuntimeException('Insert returned no id');
  } catch (Throwable $t) {
    msa_log('msa2026-errors.log', 'save failed for ' . $d['email'] . ': ' . $t->getMessage());
    return [500, ['ok' => false, 'data' => $d, 'message' => $generic]];
  }

  // The lead is safe in the database from here on, so the visitor hears "success" whatever email does.
  $recent[] = time();
  $_SESSION['msa_sent'] = array_values($recent);
  try {
    msa_notify($pdo, $id, $d);
  } catch (Throwable $t) {
    msa_log('msa2026-notify-failures.log', "lead #$id ({$d['email']}): " . $t->getMessage());
  }
  return [200, ['ok' => true, 'firstName' => $d['first_name']]];
}


/* ===== The homepage section. index.php calls this at the top of <main>. =====
   Hidden unless the address ends in #request, or the page is showing a result
   from a submission made without JavaScript. */
function msa_render_section(): void {
  $thanksName = $_SESSION['msa_thanks'] ?? null;
  $flash = $_SESSION['msa_flash'] ?? [];
  unset($_SESSION['msa_thanks'], $_SESSION['msa_flash']);
  $formError = $flash['message'] ?? '';
  $fieldErrors = $flash['errors'] ?? [];
  $old = $flash['data'] ?? [];
  $open = $thanksName !== null || $flash;
  $src = strtolower((string)($_GET['src'] ?? ($old['source'] ?? '')));
  $src = preg_match('/^[a-z0-9_-]{1,40}$/', $src) ? $src : '';
  $val = function (string $k) use ($old) { return msa_h($old[$k] ?? ''); };
  $err = function (string $k) use ($fieldErrors) { return $fieldErrors[$k] ?? ''; };
  $inv = function (string $k) use ($fieldErrors) { return isset($fieldErrors[$k]) ? ' aria-invalid="true"' : ''; };
?>
<style>
  #request{display:none;}
  #request:target, #request.is-open{display:block;}
  #request{border-bottom:1px solid rgba(245,132,38,.35);
    background:radial-gradient(circle at 18% 0%, rgba(0,107,182,.16), transparent 40%),
               radial-gradient(circle at 88% 30%, rgba(245,132,38,.07), transparent 30%),
               linear-gradient(180deg, #05080d 0%, #08111d 100%);}
  #request [hidden]{display:none !important;}
  #request .msa-kicker{display:inline-block;margin:0 0 14px;padding:6px 12px;border-radius:999px;
    border:1px solid rgba(245,132,38,.5);background:rgba(245,132,38,.08);
    color:var(--knicks-orange);font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;}
  #request .msa-intro h2{margin:0;max-width:820px;font-size:clamp(30px,4.2vw,46px);line-height:1.08;letter-spacing:-.03em;}
  #request .msa-lede{margin:16px 0 0;max-width:760px;font-size:18px;color:var(--ink);opacity:.92;}
  #request .msa-help{display:flex;flex-wrap:wrap;gap:8px 18px;margin:18px 0 0;padding:0;list-style:none;color:var(--muted);font-size:15px;}
  #request .msa-help li{position:relative;padding-left:18px;}
  #request .msa-help li::before{content:"";position:absolute;left:0;top:.5em;width:8px;height:8px;border-radius:50%;background:var(--knicks-orange);}
  #request .msa-note{margin:18px 0 0;color:var(--muted);font-size:15px;}
  #request .btn-lg{padding:14px 22px;font-size:17px;}
  #request button.btn{font:inherit;font-weight:600;cursor:pointer;}
  #request .btn[disabled]{opacity:.65;cursor:progress;transform:none;}

  #request .form-card{max-width:860px;margin-top:26px;background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
    border:1px solid rgba(245,132,38,.38);border-radius:16px;padding:30px;box-shadow:var(--shadow);}
  #request .msa-form .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
  #request .msa-form .row.three{grid-template-columns:repeat(3,minmax(0,1fr));}
  #request .msa-form .field{display:flex;flex-direction:column;gap:6px;margin:0 0 16px;min-width:0;}
  #request .msa-form .field > span, #request .msa-form legend{font-weight:600;font-size:15px;color:var(--ink);}
  #request .msa-form .opt{font-weight:400;color:var(--muted);font-size:13px;margin-left:4px;}
  #request .msa-form .req{color:var(--knicks-orange);margin-left:2px;}
  #request .msa-form input[type=text], #request .msa-form input[type=email], #request .msa-form input[type=tel],
  #request .msa-form select, #request .msa-form textarea{
    width:100%;box-sizing:border-box;margin:0;padding:12px 14px;border-radius:10px;font:inherit;font-size:16px; /* 16px stops iOS zooming in */
    color:var(--ink);background:rgba(5,8,13,.85);border:1px solid rgba(255,255,255,.16);transition:border-color .15s, box-shadow .15s;}
  #request .msa-form select{appearance:none;-webkit-appearance:none;padding-right:36px;
    background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);
    background-position:calc(100% - 20px) 52%,calc(100% - 14px) 52%;background-size:6px 6px;background-repeat:no-repeat;}
  #request .msa-form select option{background:#0b0f17;color:var(--ink);}
  #request .msa-form textarea{min-height:120px;resize:vertical;}
  #request .msa-form input:focus, #request .msa-form select:focus, #request .msa-form textarea:focus{outline:none;border-color:var(--knicks-blue);box-shadow:var(--focus);}
  #request .msa-form [aria-invalid="true"]{border-color:#ff8a80;}
  #request .msa-form .err{color:#ff8a80;font-size:14px;}
  #request .msa-form .err:empty{display:none;}
  #request .msa-form .divider{display:flex;align-items:center;gap:12px;margin:10px 0 18px;color:var(--muted);font-size:14px;}
  #request .msa-form .divider::before, #request .msa-form .divider::after{content:"";flex:1;height:1px;background:var(--stroke);}
  #request .msa-form fieldset{border:0;padding:0;margin:0 0 16px;min-width:0;}
  #request .msa-form legend{padding:0;margin-bottom:8px;}
  #request .chips{display:flex;flex-wrap:wrap;gap:8px;}
  #request .chip{position:relative;display:inline-block;margin:0;}
  #request .chip input{position:absolute;opacity:0;width:1px;height:1px;margin:0;}
  #request .chip span{display:inline-block;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
    background:rgba(5,8,13,.6);color:var(--ink);font-size:14px;font-weight:400;cursor:pointer;user-select:none;transition:.15s ease;}
  #request .chip span:hover{border-color:rgba(245,132,38,.5);}
  #request .chip input:checked + span{background:rgba(0,107,182,.28);border-color:var(--knicks-blue);color:#fff;}
  #request .chip input:checked + span::before{content:"✓ ";}
  #request .chip input:focus-visible + span{box-shadow:var(--focus);}
  #request .hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;}
  #request .form-alert{display:none;margin:0 0 18px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,138,128,.5);background:rgba(255,138,128,.08);color:#ffd2cd;}
  #request .form-alert.show{display:block;}
  #request .privacy{font-size:13px;color:var(--muted);margin:14px 0 0;}
  #request .spinner{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border-radius:50%;
    border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:msa-spin .8s linear infinite;}
  @keyframes msa-spin{to{transform:rotate(360deg);}}

  #request .thanks{max-width:720px;margin:0 auto;text-align:center;background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
    border:1px solid rgba(245,132,38,.45);border-radius:16px;padding:40px 30px;box-shadow:var(--shadow);}
  #request .thanks .check{width:64px;height:64px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;
    background:rgba(0,107,182,.18);border:1px solid rgba(0,107,182,.6);}
  #request .thanks .check svg{width:30px;height:30px;stroke:#5fb4ff;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round;}
  #request .thanks h2{margin:0 0 14px;letter-spacing:-.02em;}
  #request .thanks h2:focus{outline:none;}
  #request .thanks p{margin:0 auto 12px;max-width:560px;}
  #request .thanks .muted{color:var(--muted);}
  #request .thanks .countdown{margin:22px 0 18px;font-weight:600;color:var(--knicks-orange);font-variant-numeric:tabular-nums;}

  @media (max-width:760px){
    #request .msa-form .row, #request .msa-form .row.three{grid-template-columns:1fr;gap:0;}
  }
  @media (max-width:640px){
    #request .msa-lede{font-size:17px;}
    #request .form-card{padding:22px 18px;}
    #request .thanks{padding:32px 20px;}
    #request .msa-submit{display:block;width:100%;}
  }
</style>

<section id="request" class="section<?= $open ? ' is-open' : '' ?>" aria-label="MSA Vegas 2026 consultation request">
  <div id="msa-wrap"<?= $thanksName !== null ? ' hidden' : '' ?>>
    <div class="msa-intro">
      <p class="msa-kicker">MSA Vegas 2026</p>
      <h2>Put AI and technology to work for your business</h2>
      <p class="msa-lede">Great to meet you. Rodrik Consulting helps business owners and leaders use AI, automation, and data to save time, make better decisions, and grow, with practical steps rather than hype.</p>
      <ul class="msa-help">
        <li>AI strategy &amp; adoption</li>
        <li>Automation &amp; workflows</li>
        <li>Data &amp; dashboards</li>
        <li>Websites, apps &amp; digital tools</li>
      </ul>
      <p class="msa-note">Request a consultation below. Only your <strong>first name</strong>, <strong>email</strong>, and <strong>company name</strong> are required; everything else is optional.</p>
    </div>

    <div class="form-card">
      <form id="msa-form" class="msa-form" action="/msa2026/" method="POST" novalidate autocomplete="on">
        <input type="hidden" name="csrf" value="<?= msa_h($_SESSION['msa_csrf']) ?>">
        <input type="hidden" name="src" value="<?= msa_h($src) ?>">
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="fax_number" tabindex="-1" autocomplete="off"></label></div>

        <div id="msa-alert" class="form-alert<?= $formError ? ' show' : '' ?>" role="alert"><?= msa_h($formError) ?></div>

        <div class="row three">
          <label class="field">
            <span>First name<span class="req" aria-hidden="true">*</span></span>
            <input type="text" name="first_name" id="msa-f-first_name" autocomplete="given-name" maxlength="100" required value="<?= $val('first_name') ?>" aria-describedby="msa-err-first_name"<?= $inv('first_name') ?>>
            <small class="err" id="msa-err-first_name"><?= msa_h($err('first_name')) ?></small>
          </label>
          <label class="field">
            <span>Email address<span class="req" aria-hidden="true">*</span></span>
            <input type="email" name="email" id="msa-f-email" autocomplete="email" inputmode="email" maxlength="254" required value="<?= $val('email') ?>" aria-describedby="msa-err-email"<?= $inv('email') ?>>
            <small class="err" id="msa-err-email"><?= msa_h($err('email')) ?></small>
          </label>
          <label class="field">
            <span>Company name<span class="req" aria-hidden="true">*</span></span>
            <input type="text" name="company" id="msa-f-company" autocomplete="organization" maxlength="200" required value="<?= $val('company') ?>" aria-describedby="msa-err-company"<?= $inv('company') ?>>
            <small class="err" id="msa-err-company"><?= msa_h($err('company')) ?></small>
          </label>
        </div>

        <div class="divider">Optional details, share whatever is helpful</div>

        <div class="row">
          <label class="field"><span>Last name <span class="opt">(optional)</span></span>
            <input type="text" name="last_name" autocomplete="family-name" maxlength="100" value="<?= $val('last_name') ?>"></label>
          <label class="field"><span>Phone number <span class="opt">(optional)</span></span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="50" value="<?= $val('phone') ?>"></label>
        </div>
        <div class="row">
          <label class="field"><span>Company website <span class="opt">(optional)</span></span>
            <input type="text" name="website" autocomplete="url" inputmode="url" maxlength="255" placeholder="yourcompany.com" value="<?= $val('website') ?>"></label>
          <label class="field"><span>Role or job title <span class="opt">(optional)</span></span>
            <input type="text" name="role" autocomplete="organization-title" maxlength="150" value="<?= $val('role') ?>"></label>
        </div>
        <div class="row">
          <label class="field"><span>Company location <span class="opt">(optional)</span></span>
            <input type="text" name="location" autocomplete="address-level2" maxlength="150" placeholder="City, State" value="<?= $val('location') ?>"></label>
          <label class="field"><span>Company size <span class="opt">(optional)</span></span>
            <select name="company_size">
              <option value="">Prefer not to say</option>
              <?php foreach (MSA_SIZES as $k => $label): ?>
                <option value="<?= msa_h($k) ?>"<?= ($old['company_size'] ?? '') === $label ? ' selected' : '' ?>><?= msa_h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
        </div>

        <fieldset>
          <legend>Areas where your business needs help <span class="opt">(optional, pick any)</span></legend>
          <div class="chips">
            <?php foreach (MSA_HELP as $k => $label): ?>
              <label class="chip"><input type="checkbox" name="help[]" value="<?= msa_h($k) ?>"<?= in_array($k, $old['help_keys'] ?? [], true) ? ' checked' : '' ?>><span><?= msa_h($label) ?></span></label>
            <?php endforeach; ?>
          </div>
        </fieldset>

        <label class="field"><span>Tell us about your business challenges <span class="opt">(optional)</span></span>
          <textarea name="challenges" rows="4" maxlength="5000" placeholder="What's taking too much time, what you'd like to improve, or ideas you're exploring."><?= $val('challenges') ?></textarea></label>

        <div class="row">
          <label class="field"><span>Preferred meeting method <span class="opt">(optional)</span></span>
            <select name="meeting_method">
              <option value="">No preference</option>
              <?php foreach (MSA_MEETING as $k => $label): ?>
                <option value="<?= msa_h($k) ?>"<?= ($old['meeting_method'] ?? '') === $label ? ' selected' : '' ?>><?= msa_h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
          <label class="field"><span>Preferred consultation timing <span class="opt">(optional)</span></span>
            <select name="timing">
              <option value="">No preference</option>
              <?php foreach (MSA_TIMING as $k => $label): ?>
                <option value="<?= msa_h($k) ?>"<?= ($old['timing'] ?? '') === $label ? ' selected' : '' ?>><?= msa_h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
        </div>

        <button class="btn btn-lg msa-submit" type="submit" id="msa-submit">Request my consultation</button>
        <p class="privacy">We'll only use your information to follow up on your request. No spam, and we never sell or share your details.</p>
      </form>
    </div>
  </div>

  <div class="thanks" id="msa-thanks" role="status" aria-live="polite"<?= $thanksName === null ? ' hidden' : '' ?>>
    <?php if ($thanksName !== null): ?><noscript><meta http-equiv="refresh" content="<?= MSA_REDIRECT_SECONDS ?>;url=<?= msa_h(MSA_HOME_URL) ?>"></noscript><?php endif; ?>
    <div class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <h2 id="msa-thanks-title" tabindex="-1">Thank you, <span id="msa-thanks-name"><?= msa_h($thanksName ?? '') ?></span>!</h2>
    <p>Your information has been successfully submitted. I look forward to learning more about your business and exploring how we can put AI and technology to work for you.</p>
    <p class="muted" id="msa-redirect-note">You'll be redirected to the Rodrik Consulting homepage shortly.</p>
    <p class="countdown" id="msa-countdown" aria-live="off">Redirecting in <span id="msa-countdown-n"><?= MSA_REDIRECT_SECONDS ?></span> <span id="msa-countdown-unit">seconds</span>...</p>
    <a class="btn btn-lg" id="msa-visit-now" href="<?= msa_h(MSA_HOME_URL) ?>">Visit Rodrik Consulting Now</a>
  </div>
</section>

<script>
(function(){
  var section = document.getElementById('request');
  if (!section) return;

  /* Show the section for #request links, and keep it open once shown.
     It is the first thing on the page, so "scroll to it" means the top of the page:
     the browser's own jump would tuck it under the sticky header. */
  function toTop(){ window.scrollTo(0, 0); }
  function openIfTargeted(){
    // #msarequest was the address before; keep it working for anything already shared.
    if (location.hash === '#request' || location.hash === '#msarequest'){ section.classList.add('is-open'); return true; }
    return false;
  }
  if (openIfTargeted()){
    toTop();
    window.addEventListener('load', function(){ requestAnimationFrame(toTop); });
  }
  window.addEventListener('hashchange', function(){ if (openIfTargeted()) toTop(); });

  /* Confirmation countdown, then on to the homepage. Stopped whenever the page goes away. */
  var HOME = <?= json_encode(MSA_HOME_URL) ?>;
  var SECONDS = <?= (int)MSA_REDIRECT_SECONDS ?>;
  var timer = null;
  function render(n){
    document.getElementById('msa-countdown-n').textContent = n;
    document.getElementById('msa-countdown-unit').textContent = n === 1 ? 'second' : 'seconds';
  }
  function stop(){ if (timer !== null){ clearInterval(timer); timer = null; } }
  function start(){
    stop();
    var n = SECONDS;
    render(n);
    timer = setInterval(function(){
      n -= 1;
      render(Math.max(n, 0));
      if (n <= 0){ stop(); window.location.assign(HOME); }
    }, 1000);
  }
  function showThanks(firstName){
    document.getElementById('msa-wrap').hidden = true;
    document.getElementById('msa-thanks-name').textContent = firstName;
    document.getElementById('msa-thanks').hidden = false;
    section.classList.add('is-open');
    toTop();
    document.getElementById('msa-thanks-title').focus({ preventScroll: true });
    start();
  }
  document.getElementById('msa-visit-now').addEventListener('click', stop);
  window.addEventListener('pagehide', stop);
  // Back button from the homepage (page restored from cache): don't bounce them away again.
  window.addEventListener('pageshow', function(e){
    if (e.persisted && !document.getElementById('msa-thanks').hidden){
      stop();
      document.getElementById('msa-countdown').hidden = true;
      document.getElementById('msa-redirect-note').hidden = true;
    }
  });
  <?php if ($thanksName !== null): ?>start();<?php endif; ?>

  /* Form: validate, send, and only say "thank you" once the server confirms the lead was saved. */
  var form = document.getElementById('msa-form');
  if (!form || !window.fetch || !window.FormData) return; // falls back to a normal form post
  var btn = document.getElementById('msa-submit');
  var btnLabel = btn.textContent;
  var alertBox = document.getElementById('msa-alert');
  var REQUIRED = ['first_name', 'email', 'company'];
  var MESSAGES = {
    first_name: 'Please enter your first name.',
    email: 'Please enter your email address.',
    company: 'Please enter your company name.'
  };
  var GENERIC = "Sorry, we couldn't save your information just now. Please try again in a moment.";
  var OFFLINE = "We couldn't reach the server. Please check your connection and try again.";

  function setError(name, msg){
    var input = form.elements[name], el = document.getElementById('msa-err-' + name);
    if (el) el.textContent = msg || '';
    if (input){ if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function showAlert(msg){ alertBox.textContent = msg || ''; alertBox.classList.toggle('show', !!msg); }
  function validate(){
    var errors = {};
    REQUIRED.forEach(function(name){ if (!form.elements[name].value.trim()) errors[name] = MESSAGES[name]; });
    var email = form.elements.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address, like name@company.com.';
    return errors;
  }
  function applyErrors(errors){
    var first = null;
    REQUIRED.forEach(function(name){
      setError(name, errors[name]);
      if (errors[name] && !first) first = form.elements[name];
    });
    if (first) first.focus();
    return !!first;
  }
  function setBusy(busy){
    btn.disabled = busy;
    btn.innerHTML = '';
    if (busy){ var s = document.createElement('span'); s.className = 'spinner'; s.setAttribute('aria-hidden', 'true'); btn.appendChild(s); btn.appendChild(document.createTextNode('Sending...')); }
    else btn.textContent = btnLabel;
  }
  // Clear a field's error as soon as it's fixed.
  REQUIRED.forEach(function(name){
    form.elements[name].addEventListener('input', function(){
      if (this.getAttribute('aria-invalid') === 'true' && !validate()[name]) setError(name, '');
    });
  });

  function send(isRetry){
    setBusy(true);
    fetch(form.getAttribute('action'), {
      method: 'POST', body: new FormData(form), credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(r){ return r.json().catch(function(){ return { ok: false, message: GENERIC }; }); })
    .then(function(data){
      if (data && data.ok === true){
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_name: 'msa2026' });
        showThanks(data.firstName || form.elements.first_name.value.trim());
        return;
      }
      if (data && data.csrf) form.elements.csrf.value = data.csrf;
      if (data && data.code === 'csrf' && !isRetry) return send(true); // session expired: retry once with the fresh token
      setBusy(false);
      if (data && data.errors) applyErrors(data.errors);
      showAlert((data && data.message) || GENERIC);
    })
    .catch(function(){ setBusy(false); showAlert(OFFLINE); });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (btn.disabled) return;
    showAlert('');
    if (applyErrors(validate())) { showAlert('Please fill in the highlighted fields.'); return; }
    send(false);
  });
})();
</script>
<?php
}

/* ===== Direct requests to /msa2026/ (the homepage includes this file with MSA_EMBED set) ===== */
if (!defined('MSA_EMBED')) {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    [$status, $res] = msa_handle_post();
    if (stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
      unset($res['data']);
      http_response_code($status);
      header('Content-Type: application/json; charset=utf-8');
      header('Cache-Control: no-store');
      echo json_encode($res);
      exit;
    }
    // Without JavaScript: keep the result in the session and go back to the form,
    // so a refresh can't send it twice.
    if ($res['ok']) $_SESSION['msa_thanks'] = $res['firstName'];
    else $_SESSION['msa_flash'] = ['message' => $res['message'], 'errors' => $res['errors'] ?? [], 'data' => $res['data'] ?? []];
    header('Location: /#request', true, 303);
    exit;
  }
  // Old links and QR codes to /msa2026 land on the homepage form.
  $src = strtolower((string)($_GET['src'] ?? ''));
  $query = preg_match('/^[a-z0-9_-]{1,40}$/', $src) ? '?src=' . $src : '';
  header('Location: /' . $query . '#request', true, 302);
  exit;
}
