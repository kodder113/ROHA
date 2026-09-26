<?php
/* MSA Vegas 2026 landing page: rodrikconsulting.com/msa2026
   Upload to public_html/msa2026/index.php. Visitors arrive from the brochure and tabletop
   QR codes, request a consultation, and are sent on to the homepage once their details are saved.
   Only first name, email and company are required; everything else is optional. */

/* ===== Settings: fill these in before the event ===== */
// Where new-lead alerts go.
const MSA_NOTIFY_TO = '';
// Sender for all emails. Use a mailbox that exists on rodrikconsulting.com (hPanel > Emails), or Hostinger may refuse to send.
const MSA_MAIL_FROM = 'no-reply@rodrikconsulting.com';
// Also send the visitor a short "thanks, I'll be in touch" email.
const MSA_SEND_VISITOR_COPY = true;
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

session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax',
  'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
if (empty($_SESSION['msa_csrf'])) $_SESSION['msa_csrf'] = bin2hex(random_bytes(16));

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

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

function msa_send_mail(string $to, string $subject, string $body, string $replyTo = ''): bool {
  $from = MSA_MAIL_FROM;
  $headers = [
    'From: ' . mb_encode_mimeheader('Rodrik Consulting', 'UTF-8') . " <$from>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
  ];
  if ($replyTo !== '') $headers[] = 'Reply-To: ' . msa_header_safe($replyTo);
  $subject = mb_encode_mimeheader(msa_header_safe($subject), 'UTF-8', 'B', "\r\n");
  $params = filter_var($from, FILTER_VALIDATE_EMAIL) ? '-f' . $from : '';
  error_clear_last();
  return @mail($to, $subject, $body, implode("\r\n", $headers), $params);
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
    $body = "New consultation request from rodrikconsulting.com/msa2026\n"
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
    if (!msa_send_mail(MSA_NOTIFY_TO, "New MSA Vegas lead: $name, {$d['company']}", $body, $d['email'])) {
      $status = 'failed';
      $problems[] = 'internal notification failed: ' . (error_get_last()['message'] ?? 'mail() returned false');
    }
  }

  if (MSA_SEND_VISITOR_COPY) {
    $body = "Hi {$d['first_name']},\n\n"
      . "Thank you for connecting with Rodrik Consulting at MSA Vegas and for sharing a little about {$d['company']}. "
      . "Your information came through, and I look forward to learning more about your business and exploring how we can put AI and technology to work for you.\n\n"
      . "I'll be in touch within one business day. In the meantime, you're welcome to explore " . MSA_HOME_URL . "\n\n"
      . "Dr. Oscar A. Rodriguez, DSL\nRodrik Consulting\n";
    $replyTo = filter_var(MSA_NOTIFY_TO, FILTER_VALIDATE_EMAIL) ? MSA_NOTIFY_TO : '';
    if (!msa_send_mail($d['email'], 'Thank you for connecting, ' . $d['first_name'], $body, $replyTo)) {
      $problems[] = 'visitor confirmation failed: ' . (error_get_last()['message'] ?? 'mail() returned false');
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

/* ===== Request routing ===== */
$thanksName = null;
$formError = '';
$fieldErrors = [];
$old = [];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  [$status, $res] = msa_handle_post();
  $wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
  if ($wantsJson) {
    unset($res['data']);
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($res);
    exit;
  }
  // Without JavaScript: post, then redirect, so a refresh can't send the form twice.
  if ($res['ok']) {
    $_SESSION['msa_thanks'] = $res['firstName'];
    header('Location: ' . strtok($_SERVER['REQUEST_URI'] ?? '/msa2026/', '?') . '?thanks=1', true, 303);
    exit;
  }
  http_response_code($status);
  $formError = $res['message'];
  $fieldErrors = $res['errors'] ?? [];
  $old = $res['data'] ?? [];
} elseif (isset($_GET['thanks']) && isset($_SESSION['msa_thanks'])) {
  $thanksName = $_SESSION['msa_thanks'];
  unset($_SESSION['msa_thanks']);
}

$src = strtolower((string)($_GET['src'] ?? ($old['source'] ?? '')));
$src = preg_match('/^[a-z0-9_-]{1,40}$/', $src) ? $src : '';
$val = function (string $k) use ($old) { return h($old[$k] ?? ''); };
$err = function (string $k) use ($fieldErrors) { return $fieldErrors[$k] ?? ''; };
$ver = @filemtime(($_SERVER['DOCUMENT_ROOT'] ?? '') . '/assets/styles.css') ?: 1;
?>
<!doctype html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4NHP8GCFDE"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-4NHP8GCFDE');
  </script>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MSA Vegas 2026 — Put AI &amp; Technology to Work | Rodrik Consulting</title>
  <meta name="description" content="Great to meet you at MSA Vegas. Rodrik Consulting helps businesses put AI, automation, and data to work. Request a consultation in under a minute." />
  <meta name="robots" content="noindex" />
  <link rel="canonical" href="https://rodrikconsulting.com/msa2026" />
  <?php if ($thanksName !== null): ?>
  <noscript><meta http-equiv="refresh" content="<?= MSA_REDIRECT_SECONDS ?>;url=<?= h(MSA_HOME_URL) ?>"></noscript>
  <?php endif; ?>
  <link rel="icon" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/styles.css?v=<?= $ver ?>">

  <style>
    :root{
      --header-h:72px;
      --knicks-blue:#006BB6; --knicks-blue-600:#005A98; --knicks-blue-700:#004C82;
      --knicks-orange:#F58426;
      --ink:#E8EDF2; --muted:#A7B2BF; --stroke:rgba(255,255,255,.10);
      --panel:rgba(20,24,33,.9); --shadow:0 10px 30px rgba(0,0,0,.40);
      --focus:0 0 0 3px rgba(0,107,182,.35);
      --danger:#ff8a80;
    }
    html,body{background:#000;color:var(--ink);}
    html{scroll-behavior:smooth;}
    a{color:var(--knicks-blue);text-decoration:none;}
    a:hover{color:var(--knicks-blue-600);text-decoration:underline;}
    a:focus-visible,.btn:focus-visible{outline:none;box-shadow:var(--focus);border-radius:8px;}

    /* ===== Header (logo only: this page has one job) ===== */
    .site-header{position:sticky;top:0;z-index:10000;
      background:linear-gradient(180deg, rgba(11,15,23,.96), rgba(11,15,23,.78) 60%, rgba(11,15,23,0));
      -webkit-backdrop-filter:saturate(140%) blur(8px);backdrop-filter:saturate(140%) blur(8px);
      border-bottom:1px solid var(--stroke);}
    .site-header .container.nav{display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:0 20px;gap:12px;}
    .site-header .brand{display:flex;align-items:center;flex:0 0 auto;}
    .site-header .brand{min-width:0;flex:0 1 auto;}
    .site-header .logo{max-width:100%;height:auto;}
    .site-header .btn{white-space:nowrap;flex:0 0 auto;}
    .site-header .lbl-short{display:none;}
    @media (max-width:480px){ .site-header .lbl-long{display:none;} .site-header .lbl-short{display:inline;} }

    /* ===== Shared pieces ===== */
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .45s ease,transform .45s ease;will-change:opacity,transform;}
    .reveal.revealed{opacity:1;transform:none;}
    @media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none;}html{scroll-behavior:auto;}}
    .btn{display:inline-block;padding:10px 16px;border-radius:10px;font-weight:600;background:var(--knicks-blue);color:#fff;border:1px solid transparent;transition:.2s ease;cursor:pointer;font:inherit;font-weight:600;}
    .btn:hover{background:var(--knicks-blue-600);transform:translateY(-1px);color:#fff;text-decoration:none;}
    .btn:active{background:var(--knicks-blue-700);transform:none;}
    .btn.btn-outline{background:transparent;border-color:var(--knicks-blue);color:var(--knicks-blue);}
    .btn.btn-outline:hover{background:rgba(0,107,182,.12);color:#fff;border-color:var(--knicks-blue-600);}
    .btn.btn-lg{padding:14px 22px;font-size:17px;}
    .btn[disabled]{opacity:.65;cursor:progress;transform:none;}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
    [hidden]{display:none !important;}

    /* ===== Page bands (same rhythm as the homepage) ===== */
    .main.container{max-width:none;padding:0;overflow:hidden;
      background:radial-gradient(circle at 12% 8%, rgba(0,107,182,.10), transparent 28%),
                 radial-gradient(circle at 85% 44%, rgba(245,132,38,.06), transparent 24%), #000;}
    .main > .hero, .main > .section{
      padding-left:max(44px, calc((100vw - 1120px) / 2 + 20px));
      padding-right:max(44px, calc((100vw - 1120px) / 2 + 20px));}
    .main > .section{margin:0;padding-top:60px;padding-bottom:60px;position:relative;border-top:1px solid rgba(255,255,255,.065);
      scroll-margin-top:calc(var(--header-h) + 8px);}
    .main > .section > h2{margin:0 0 12px;letter-spacing:-.02em;}
    .section-lede{max-width:780px;color:var(--muted);}
    .band-blue{background:radial-gradient(circle at 18% 0%, rgba(0,107,182,.10), transparent 34%), linear-gradient(180deg, #05080d 0%, #08111d 100%);}
    .band-dark{background:radial-gradient(circle at 82% 20%, rgba(245,132,38,.055), transparent 26%), linear-gradient(180deg, #000 0%, #04070b 100%);}

    /* ===== Hero ===== */
    .hero{padding-top:64px;padding-bottom:72px;border-bottom:1px solid rgba(255,255,255,.08);
      background:linear-gradient(90deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.7) 50%, rgba(0,0,0,.85) 100%),
                 linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.92) 100%),
                 url('/assets/photos/banner.png') center/cover no-repeat;}
    .hero .kicker{display:inline-flex;align-items:center;gap:8px;margin:0 0 14px;padding:6px 12px;border-radius:999px;
      border:1px solid rgba(245,132,38,.5);background:rgba(245,132,38,.08);
      color:var(--knicks-orange);font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;}
    .hero h1{margin:0;max-width:820px;letter-spacing:-.03em;line-height:1.08;}
    .hero .lede{margin:18px 0 0;max-width:720px;font-size:18px;color:var(--ink);opacity:.92;}
    .hero .cta{margin-top:26px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;}
    .hero .cta-note{color:var(--muted);font-size:14px;}

    /* ===== Help cards ===== */
    .help-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:24px;}
    .help-card{background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));border:1px solid rgba(255,255,255,.11);
      border-radius:16px;padding:22px;box-shadow:var(--shadow);}
    .help-card .icon{width:52px;height:52px;display:grid;place-items:center;border-radius:14px;margin-bottom:14px;
      background:linear-gradient(180deg,rgba(25,30,40,.9),rgba(18,22,32,.9));border:1px solid var(--stroke);}
    .help-card .icon svg{width:26px;height:26px;stroke:var(--knicks-orange);stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round;}
    .help-card h3{margin:0 0 8px;font-size:18px;}
    .help-card p{margin:0;color:var(--muted);font-size:15px;}

    /* ===== Credibility strip ===== */
    .why{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px;}
    .why div{border-left:3px solid var(--knicks-orange);padding:4px 0 4px 16px;}
    .why strong{display:block;font-size:20px;margin-bottom:4px;}
    .why span{color:var(--muted);font-size:15px;}

    /* ===== Form ===== */
    .form-card{max-width:820px;margin-top:24px;background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
      border:1px solid rgba(245,132,38,.38);border-radius:16px;padding:30px;box-shadow:var(--shadow);}
    .msa-form .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
    .msa-form .row.three{grid-template-columns:repeat(3,minmax(0,1fr));}
    .msa-form .field{display:flex;flex-direction:column;gap:6px;margin:0 0 16px;min-width:0;}
    .msa-form .field > span, .msa-form legend{font-weight:600;font-size:15px;color:var(--ink);}
    .msa-form .opt{font-weight:400;color:var(--muted);font-size:13px;margin-left:4px;}
    .msa-form .req{color:var(--knicks-orange);margin-left:2px;}
    .msa-form input[type=text], .msa-form input[type=email], .msa-form input[type=tel], .msa-form input[type=url],
    .msa-form select, .msa-form textarea{
      width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;font:inherit;font-size:16px; /* 16px stops iOS zooming in */
      color:var(--ink);background:rgba(5,8,13,.85);border:1px solid rgba(255,255,255,.16);transition:border-color .15s, box-shadow .15s;}
    .msa-form select{appearance:none;-webkit-appearance:none;padding-right:36px;
      background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);
      background-position:calc(100% - 20px) 52%,calc(100% - 14px) 52%;background-size:6px 6px;background-repeat:no-repeat;}
    .msa-form select option{background:#0b0f17;color:var(--ink);}
    .msa-form textarea{min-height:120px;resize:vertical;}
    .msa-form input:focus, .msa-form select:focus, .msa-form textarea:focus{outline:none;border-color:var(--knicks-blue);box-shadow:var(--focus);}
    .msa-form [aria-invalid="true"]{border-color:var(--danger);}
    .msa-form .err{color:var(--danger);font-size:14px;min-height:0;}
    .msa-form .err:empty{display:none;}
    .msa-form .divider{display:flex;align-items:center;gap:12px;margin:10px 0 18px;color:var(--muted);font-size:14px;}
    .msa-form .divider::before, .msa-form .divider::after{content:"";flex:1;height:1px;background:var(--stroke);}
    .msa-form fieldset{border:0;padding:0;margin:0 0 16px;min-width:0;}
    .msa-form legend{padding:0;margin-bottom:8px;}
    .chips{display:flex;flex-wrap:wrap;gap:8px;}
    .chip{position:relative;}
    .chip input{position:absolute;opacity:0;width:1px;height:1px;}
    .chip span{display:inline-block;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
      background:rgba(5,8,13,.6);color:var(--ink);font-size:14px;cursor:pointer;user-select:none;transition:.15s ease;}
    .chip span:hover{border-color:rgba(245,132,38,.5);}
    .chip input:checked + span{background:rgba(0,107,182,.28);border-color:var(--knicks-blue);color:#fff;}
    .chip input:checked + span::before{content:"✓ ";}
    .chip input:focus-visible + span{box-shadow:var(--focus);}
    .hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;}
    .form-alert{display:none;margin:0 0 18px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,138,128,.5);background:rgba(255,138,128,.08);color:#ffd2cd;}
    .form-alert.show{display:block;}
    .submit-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:6px;}
    .privacy{font-size:13px;color:var(--muted);margin:14px 0 0;}
    .spinner{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border-radius:50%;
      border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:spin .8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* ===== Confirmation ===== */
    .thanks{max-width:720px;margin-top:24px;text-align:center;background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
      border:1px solid rgba(245,132,38,.45);border-radius:16px;padding:40px 30px;box-shadow:var(--shadow);}
    .thanks[hidden]{display:none;}
    .thanks .check{width:64px;height:64px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;
      background:rgba(0,107,182,.18);border:1px solid rgba(0,107,182,.6);}
    .thanks .check svg{width:30px;height:30px;stroke:#5fb4ff;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round;}
    .thanks h2{margin:0 0 14px;letter-spacing:-.02em;}
    .thanks h2:focus{outline:none;}
    .thanks p{margin:0 auto 12px;max-width:560px;}
    .thanks .muted{color:var(--muted);}
    .thanks .countdown{margin:22px 0 18px;font-weight:600;color:var(--knicks-orange);font-variant-numeric:tabular-nums;}

    .mini-footer{padding:28px 20px;text-align:center;color:var(--muted);font-size:14px;border-top:1px solid var(--stroke);}
    .mini-footer a{color:var(--muted);text-decoration:underline;}

    @media (max-width:1000px){ .help-grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
    @media (max-width:760px){
      .why{grid-template-columns:1fr;}
      .msa-form .row, .msa-form .row.three{grid-template-columns:1fr;gap:0;}
    }
    @media (max-width:640px){
      .main > .hero, .main > .section{padding-left:20px;padding-right:20px;}
      .main > .section{padding-top:48px;padding-bottom:48px;}
      .hero{padding-top:44px;padding-bottom:52px;}
      .hero h1{font-size:34px;}
      .hero .lede{font-size:17px;}
      .hero .cta .btn{display:block;width:100%;text-align:center;box-sizing:border-box;}
      .help-grid{grid-template-columns:1fr;}
      .form-card{padding:22px 18px;}
      .thanks{padding:32px 20px;}
      .submit-row .btn{width:100%;}
      .site-header .btn{padding:8px 12px;font-size:14px;}
      .site-header .logo{max-height:40px;width:auto;}
    }
  </style>
</head>
<body>

<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand"><img class="logo" src="/assets/Logo_Transparent.png" alt="Rodrik Consulting"></a>
    <?php if ($thanksName === null): ?><a class="btn" href="#request"><span class="lbl-long">Request a consultation</span><span class="lbl-short">Get in touch</span></a><?php endif; ?>
  </div>
</header>

<main class="container main">

  <?php if ($thanksName === null): ?>
  <section class="hero" id="top">
    <p class="kicker">MSA Vegas 2026</p>
    <h1>Put AI and technology to work for your business</h1>
    <p class="lede">Great to meet you. Rodrik Consulting helps business owners and leaders use AI, automation, and data to save time, make better decisions, and grow, with practical steps rather than hype.</p>
    <div class="cta">
      <a class="btn btn-lg" href="#request">Request a consultation</a>
      <span class="cta-note">Takes under a minute. Only 3 fields are required.</span>
    </div>
  </section>

  <section class="section band-dark" id="help">
    <h2 class="reveal">How we can help</h2>
    <p class="section-lede reveal">Whether you're just starting with AI or ready to automate and scale, we meet you where your business is today.</p>
    <div class="help-grid">
      <article class="help-card reveal">
        <div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></div>
        <h3>AI strategy &amp; adoption</h3>
        <p>Find where AI can actually help your business, choose the right tools, and roll them out safely and responsibly.</p>
      </article>
      <article class="help-card reveal">
        <div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.6"/><path d="M20 4v4.6h-4.6"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.4"/><path d="M4 20v-4.6h4.6"/></svg></div>
        <h3>Automation &amp; workflows</h3>
        <p>Cut repetitive work like intake, scheduling, follow-ups, reporting, and hand-offs between the systems you already use.</p>
      </article>
      <article class="help-card reveal">
        <div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg></div>
        <h3>Data &amp; dashboards</h3>
        <p>Turn scattered spreadsheets and systems into clear dashboards that show what's working and where to act next.</p>
      </article>
      <article class="help-card reveal">
        <div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/></svg></div>
        <h3>Websites, apps &amp; digital tools</h3>
        <p>Modern websites, customer-facing tools, and custom applications built around how your business really works.</p>
      </article>
    </div>
  </section>

  <section class="section band-blue" id="why">
    <h2 class="reveal">Why Rodrik Consulting</h2>
    <p class="section-lede reveal">Led by Dr. Oscar A. Rodriguez, DSL: enterprise experience, delivered with the attention of a boutique partner.</p>
    <div class="why reveal">
      <div><strong>20+ years</strong><span>Data, analytics, and technology leadership across Citigroup, TD Bank, and Liberty Mutual.</span></div>
      <div><strong>Doctor of Strategic Leadership</strong><span>Research in governance, ethical decision-making, and organizational transformation.</span></div>
      <div><strong>Responsible AI, built in</strong><span>Creator of the FLAME AI governance framework and author of <em>Leading With Machines</em>.</span></div>
    </div>
  </section>
  <?php endif; ?>

  <section class="section band-dark" id="request">
    <?php if ($thanksName === null): ?>
    <div id="request-intro">
      <h2>Request a consultation</h2>
      <p class="section-lede">Share as much or as little as you like. Only your <strong>first name</strong>, <strong>email</strong>, and <strong>company name</strong> are required. Everything else is optional.</p>
    </div>

    <div class="form-card" id="form-card">
      <form id="msa-form" class="msa-form" action="<?= h(strtok($_SERVER['REQUEST_URI'] ?? '/msa2026/', '?')) ?>#request" method="POST" novalidate autocomplete="on">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['msa_csrf']) ?>">
        <input type="hidden" name="src" value="<?= h($src) ?>">
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="fax_number" tabindex="-1" autocomplete="off"></label></div>

        <div id="form-alert" class="form-alert<?= $formError ? ' show' : '' ?>" role="alert"><?= h($formError) ?></div>

        <div class="row three">
          <label class="field">
            <span>First name<span class="req" aria-hidden="true">*</span></span>
            <input type="text" name="first_name" id="f-first_name" autocomplete="given-name" maxlength="100" required value="<?= $val('first_name') ?>"
              aria-describedby="err-first_name"<?= $err('first_name') ? ' aria-invalid="true"' : '' ?>>
            <small class="err" id="err-first_name"><?= h($err('first_name')) ?></small>
          </label>
          <label class="field">
            <span>Email address<span class="req" aria-hidden="true">*</span></span>
            <input type="email" name="email" id="f-email" autocomplete="email" inputmode="email" maxlength="254" required value="<?= $val('email') ?>"
              aria-describedby="err-email"<?= $err('email') ? ' aria-invalid="true"' : '' ?>>
            <small class="err" id="err-email"><?= h($err('email')) ?></small>
          </label>
          <label class="field">
            <span>Company name<span class="req" aria-hidden="true">*</span></span>
            <input type="text" name="company" id="f-company" autocomplete="organization" maxlength="200" required value="<?= $val('company') ?>"
              aria-describedby="err-company"<?= $err('company') ? ' aria-invalid="true"' : '' ?>>
            <small class="err" id="err-company"><?= h($err('company')) ?></small>
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
                <option value="<?= h($k) ?>"<?= ($old['company_size'] ?? '') === $label ? ' selected' : '' ?>><?= h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
        </div>

        <fieldset>
          <legend>Areas where your business needs help <span class="opt">(optional, pick any)</span></legend>
          <div class="chips">
            <?php foreach (MSA_HELP as $k => $label): ?>
              <label class="chip"><input type="checkbox" name="help[]" value="<?= h($k) ?>"<?= in_array($k, $old['help_keys'] ?? [], true) ? ' checked' : '' ?>><span><?= h($label) ?></span></label>
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
                <option value="<?= h($k) ?>"<?= ($old['meeting_method'] ?? '') === $label ? ' selected' : '' ?>><?= h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
          <label class="field"><span>Preferred consultation timing <span class="opt">(optional)</span></span>
            <select name="timing">
              <option value="">No preference</option>
              <?php foreach (MSA_TIMING as $k => $label): ?>
                <option value="<?= h($k) ?>"<?= ($old['timing'] ?? '') === $label ? ' selected' : '' ?>><?= h($label) ?></option>
              <?php endforeach; ?>
            </select></label>
        </div>

        <div class="submit-row">
          <button class="btn btn-lg" type="submit" id="submit-btn">Request my consultation</button>
        </div>
        <p class="privacy">We'll only use your information to follow up on your request. No spam, and we never sell or share your details.</p>
      </form>
    </div>
    <?php endif; ?>

    <div class="thanks" id="thanks" role="status" aria-live="polite"<?= $thanksName === null ? ' hidden' : '' ?>>
      <div class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h2 id="thanks-title" tabindex="-1">Thank you, <span id="thanks-name"><?= h($thanksName ?? '') ?></span>!</h2>
      <p>Your information has been successfully submitted. I look forward to learning more about your business and exploring how we can put AI and technology to work for you.</p>
      <p class="muted" id="thanks-redirect-note">You'll be redirected to the Rodrik Consulting homepage shortly.</p>
      <p class="countdown" id="countdown" aria-live="off">Redirecting in <span id="countdown-n"><?= MSA_REDIRECT_SECONDS ?></span> <span id="countdown-unit">seconds</span>...</p>
      <a class="btn btn-lg" id="visit-now" href="<?= h(MSA_HOME_URL) ?>">Visit Rodrik Consulting Now</a>
    </div>
  </section>

</main>

<footer class="mini-footer">
  © <span class="yr"><?= date('Y') ?></span> Rodrik Consulting · <a href="<?= h(MSA_HOME_URL) ?>">rodrikconsulting.com</a>
</footer>

<script>
/* Reveal-on-scroll (same as the homepage) */
(function(){
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function(el){ el.classList.add('revealed'); });
    return;
  }
  var io = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if (entry.isIntersecting){ entry.target.classList.add('revealed'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function(el){ io.observe(el); });
})();

/* Confirmation countdown, then on to the homepage. Stopped whenever the page goes away. */
var MSA = (function(){
  var HOME = <?= json_encode(MSA_HOME_URL) ?>;
  var SECONDS = <?= (int)MSA_REDIRECT_SECONDS ?>;
  var timer = null;

  function render(n){
    document.getElementById('countdown-n').textContent = n;
    document.getElementById('countdown-unit').textContent = n === 1 ? 'second' : 'seconds';
  }
  function stop(){ if (timer !== null){ clearInterval(timer); timer = null; } }
  function go(){ stop(); window.location.assign(HOME); }
  function start(){
    stop();
    var n = SECONDS;
    render(n);
    timer = setInterval(function(){
      n -= 1;
      render(Math.max(n, 0));
      if (n <= 0) go();
    }, 1000);
  }
  function showThanks(firstName){
    var card = document.getElementById('form-card'), intro = document.getElementById('request-intro');
    if (card) card.hidden = true;
    if (intro) intro.hidden = true;
    ['help', 'why'].forEach(function(id){ var s = document.getElementById(id); if (s) s.hidden = true; });
    var hero = document.getElementById('top'); if (hero) hero.hidden = true;
    var headerBtn = document.querySelector('.site-header .btn'); if (headerBtn) headerBtn.hidden = true;
    document.getElementById('thanks-name').textContent = firstName;
    var box = document.getElementById('thanks');
    box.hidden = false;
    window.scrollTo(0, 0);
    document.getElementById('thanks-title').focus({ preventScroll: true });
    start();
  }

  document.getElementById('visit-now').addEventListener('click', stop);
  window.addEventListener('pagehide', stop);
  // Back button from the homepage (page restored from cache): don't bounce them away again.
  window.addEventListener('pageshow', function(e){
    if (e.persisted && !document.getElementById('thanks').hidden){
      stop();
      document.getElementById('countdown').hidden = true;
      document.getElementById('thanks-redirect-note').hidden = true;
    }
  });

  return { start: start, stop: stop, showThanks: showThanks };
})();
<?php if ($thanksName !== null): ?>
MSA.start();
<?php endif; ?>

/* Form: validate, send, and only say "thank you" once the server confirms the lead was saved. */
(function(){
  var form = document.getElementById('msa-form');
  if (!form || !window.fetch || !window.FormData) return; // falls back to a normal form post
  var btn = document.getElementById('submit-btn');
  var btnLabel = btn.textContent;
  var alertBox = document.getElementById('form-alert');
  var REQUIRED = ['first_name', 'email', 'company'];
  var MESSAGES = {
    first_name: 'Please enter your first name.',
    email: 'Please enter your email address.',
    company: 'Please enter your company name.'
  };
  var GENERIC = "Sorry, we couldn't save your information just now. Please try again in a moment.";
  var OFFLINE = "We couldn't reach the server. Please check your connection and try again.";

  function setError(name, msg){
    var input = form.elements[name], el = document.getElementById('err-' + name);
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
        MSA.showThanks(data.firstName || form.elements.first_name.value.trim());
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
</body>
</html>
