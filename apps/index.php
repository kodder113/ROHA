<?php
/* Rodrik Apps: apps.rodrikconsulting.com
   RodIQ's web address; if it's ever emptied, its button reads "Coming soon". */
$rodiq_url = 'https://rodiq-app.droscarrodriguez.com/';

/* This page lives at apps.rodrikconsulting.com (a Hostinger subdomain pointed at public_html/apps).
   Anyone who opens rodrikconsulting.com/apps is sent there. */
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
if ($host !== 'apps.rodrikconsulting.com') {
  header('Location: https://apps.rodrikconsulting.com/', true, 301);
  exit;
}
/* The consulting site's shared files sit one folder up on disk. */
$shared = __DIR__ . '/../assets/';
$ver = function ($f) use ($shared) { return @filemtime($shared . $f) ?: 1; };
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
  <title>Rodrik Apps — Enterprise Solutions, Entertainment &amp; Simulation | Rodrik Consulting</title>
  <meta name="description" content="Rodrik Apps, from Rodrik Consulting: ScanPay for QR payments, FLAME for AI governance, ROHA for organizational health and RodIQ for personalized SAT and ACT preparation; plus Blocky Market and Fantasy Coach Live, entertainment apps built on real-time data and analytics." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Rodrik Apps — ScanPay, FLAME, ROHA, RodIQ, Blocky Market &amp; Fantasy Coach Live" />
  <meta property="og:description" content="Enterprise solutions for QR payments, AI governance, organizational health and SAT and ACT prep, and entertainment apps built on real-time data and simulation. From Rodrik Consulting." />
  <meta property="og:url" content="https://apps.rodrikconsulting.com/" />
  <meta property="og:image" content="https://apps.rodrikconsulting.com/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="https://apps.rodrikconsulting.com/" />
  <link rel="icon" href="https://rodrikconsulting.com/favicon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="https://rodrikconsulting.com/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="https://rodrikconsulting.com/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="https://rodrikconsulting.com/apple-touch-icon.png">
  <link rel="stylesheet" href="https://rodrikconsulting.com/assets/styles.css?v=<?= $ver('styles.css') ?>">

  <style>
    :root{
      --header-h:72px;
      --knicks-blue:#006BB6; --knicks-blue-600:#005A98; --knicks-blue-700:#004C82;
      --knicks-orange:#F58426;
      --ink:#E8EDF2; --muted:#A7B2BF; --stroke:rgba(255,255,255,.10);
      --panel:rgba(20,24,33,.9); --shadow:0 10px 30px rgba(0,0,0,.40);
      --focus:0 0 0 3px rgba(0,107,182,.35);
      --blocky-gold:#FFC23D;
      --roha:#34c68e; --roha-deep:#0f8a61;
    }
    html,body{background:#000;color:var(--ink);}
    a{color:var(--knicks-blue);text-decoration:none;}
    a:hover{color:var(--knicks-blue-600);text-decoration:underline;}
    a:focus-visible,.btn:focus-visible{outline:none;box-shadow:var(--focus);border-radius:8px;}

    /* ===== Header (same as the homepage) ===== */
    .site-header{position:sticky;top:0;z-index:10000;
      background:linear-gradient(180deg, rgba(11,15,23,.96), rgba(11,15,23,.78) 60%, rgba(11,15,23,0));
      -webkit-backdrop-filter:saturate(140%) blur(8px);backdrop-filter:saturate(140%) blur(8px);
      border-bottom:1px solid var(--stroke);}
    .site-header .container.nav{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:0 20px;gap:12px;}
    .site-header .brand{display:flex;align-items:center;gap:10px;flex:0 0 auto;z-index:10002;}
    .nav-toggle{display:none;order:2;flex:0 0 auto;background:none;border:0;cursor:pointer;width:44px;height:40px;padding:0;margin-left:auto;z-index:10003;}
    .nav-toggle .burger{display:block;width:28px;height:3px;background:#fff;border-radius:2px;margin:6px 8px;}
    .nav-links.desktop{display:flex;gap:18px;align-items:center;order:3;margin-left:8px;}
    .nav-links.desktop a{color:var(--ink);opacity:.9;}
    .nav-links.desktop a:hover{color:#fff;opacity:1;text-decoration:none;}
    .nav-links.desktop a.current{color:var(--knicks-orange);opacity:1;}
    .nav-links.desktop .btn{margin-left:6px;}
    .mobile-menu{display:none;}
    .mobile-menu.open{display:block;}
    @media (max-width:840px){
      .nav-links.desktop{display:none;}
      .nav-toggle{display:inline-block;}
      .mobile-menu{position:absolute;right:20px;top:calc(100% + 8px);width:min(78vw,320px);
        background:var(--panel);border:1px solid var(--stroke);border-radius:12px;padding:8px;box-shadow:var(--shadow);z-index:10001;}
      .mobile-menu a{display:block;color:var(--ink);padding:12px;border-radius:10px;}
      .mobile-menu a:hover{background:rgba(255,255,255,.06)}
      .mobile-menu .btn{display:block;text-align:center;margin:6px 4px 2px;}
    }

    /* ===== Shared pieces ===== */
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .45s ease,transform .45s ease;will-change:opacity,transform;}
    .reveal.revealed{opacity:1;transform:none;}
    .btn{display:inline-block;padding:10px 16px;border-radius:10px;font-weight:600;background:var(--knicks-blue);color:#fff;border:1px solid transparent;transition:.2s ease;}
    .btn:hover{background:var(--knicks-blue-600);transform:translateY(-1px);color:#fff;text-decoration:none;}
    .btn:active{background:var(--knicks-blue-700);transform:none;}
    .btn.btn-outline{background:transparent;border-color:var(--knicks-blue);color:var(--knicks-blue);}
    .btn.btn-outline:hover{background:rgba(0,107,182,.12);color:#fff;border-color:var(--knicks-blue-600);}
    .btn.btn-gold{background:linear-gradient(180deg,#FFD45E,#FFAC1C);color:#1a1204;}
    .btn.btn-gold:hover{color:#1a1204;filter:brightness(1.05);}
    .btn[aria-disabled="true"]{opacity:.5;pointer-events:none;}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}

    /* ===== Page bands (same rhythm as the homepage) ===== */
    .main.container{max-width:none;padding:0;overflow:hidden;
      background:radial-gradient(circle at 12% 8%, rgba(0,107,182,.10), transparent 28%),
                 radial-gradient(circle at 85% 44%, rgba(245,132,38,.06), transparent 24%), #000;}
    .main > .hero, .main > .section{
      padding-left:max(44px, calc((100vw - 1120px) / 2 + 20px));
      padding-right:max(44px, calc((100vw - 1120px) / 2 + 20px));}
    .main > .section{margin:0;padding-top:66px;padding-bottom:66px;position:relative;border-top:1px solid rgba(255,255,255,.065);}
    .main > .section > h2{margin:0 0 12px;letter-spacing:-.02em;}
    .section-lede{max-width:850px;color:var(--muted);}

    /* ===== Hero ===== */
    .apps-hero{display:grid;grid-template-columns:auto 1fr;gap:44px;align-items:center;
      padding-top:72px;padding-bottom:80px;border-bottom:1px solid rgba(255,255,255,.08);
      background:radial-gradient(circle at 20% 30%, rgba(0,107,182,.16), transparent 42%),
                 linear-gradient(180deg, #03060b 0%, #000 100%);}
    .apps-hero .kicker{margin:0 0 8px;color:var(--knicks-orange);font-weight:700;letter-spacing:.03em;text-transform:uppercase;}
    .apps-hero h1{margin:0;letter-spacing:-.03em;max-width:760px;}
    .apps-hero .lede{margin-top:18px;max-width:720px;color:var(--muted);}
    .apps-hero .cta{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap;}
    .jump{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;}
    .jump a{font-size:13px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--stroke);color:var(--ink);background:rgba(255,255,255,.03);}
    .jump a:hover{text-decoration:none;border-color:rgba(255,255,255,.28);color:#fff;}
    .jump a i{font-style:normal;display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:var(--c);}

    /* Spinning coin: two faces back to back, turned with a pure 3D transform
       (runs on the GPU, so it stays smooth). White medallion so the navy logo reads on black. */
    .coin-stage{width:180px;height:180px;perspective:800px;}
    .coin{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:coin-turn 6s linear infinite;}
    .coin .face{position:absolute;inset:0;border-radius:50%;
      background:url(coin.webp) center / 74% no-repeat, radial-gradient(circle at 35% 30%, #ffffff 0%, #eef1f6 70%, #dfe4ec 100%);
      box-shadow:inset 0 0 0 4px rgba(245,132,38,.55), inset 0 0 0 9px #fff;
      -webkit-backface-visibility:hidden;backface-visibility:hidden;}
    .coin .face.back{transform:rotateY(180deg);}
    @keyframes coin-turn{to{transform:rotateY(-360deg);}}
    @media (prefers-reduced-motion:reduce){.coin{animation:none;}.reveal{opacity:1;transform:none;transition:none;}}

    /* ===== Category headers: one per section, each with its own accent ===== */
    .cat-head{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start;margin-bottom:6px;}
    .cat-icon{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;
      background:color-mix(in srgb, var(--cat) 16%, transparent);border:1px solid color-mix(in srgb, var(--cat) 45%, transparent);}
    .cat-icon svg{width:26px;height:26px;stroke:var(--cat);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .cat-eyebrow{margin:2px 0 6px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--cat);}
    .cat-head h2{margin:0 0 10px;letter-spacing:-.02em;}
    .cat-head .section-lede{margin:0;}
    .cat-enterprise{--cat:#4aa8ff;}
    .cat-interactive{--cat:var(--knicks-orange);}
    .section.cat-enterprise{background:radial-gradient(circle at 90% 0%, rgba(0,107,182,.14), transparent 40%);}
    .section.cat-interactive{background:radial-gradient(circle at 92% 0%, rgba(245,132,38,.09), transparent 40%);}
    .under{margin:14px 0 0;max-width:850px;color:var(--muted);font-size:15px;border-left:3px solid var(--cat);padding-left:14px;}

    /* ===== App cards ===== */
    .apps-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:22px;}
    .app-card{display:flex;flex-direction:column;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.11);
      background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));box-shadow:var(--shadow);
      transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;}
    .app-card:hover{transform:translateY(-2px);border-color:rgba(245,132,38,.38);box-shadow:0 16px 36px rgba(0,0,0,.55);}
    .app-visual{height:260px;position:relative;display:grid;place-items:center;overflow:hidden;}
    .app-body{padding:22px 24px 26px;display:flex;flex-direction:column;flex:1;}
    .app-tag{align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
      padding:5px 10px;border-radius:999px;margin-bottom:10px;}
    .app-body h3{margin:0 0 8px;font-size:28px;letter-spacing:-.02em;}
    .app-body .full{margin:-4px 0 8px;font-size:14px;font-weight:600;color:var(--muted);letter-spacing:.01em;}
    .app-body .tagline{margin:0 0 10px;font-weight:700;color:var(--ink);}
    .app-body .pitch{color:var(--muted);margin:0 0 14px;}
    .app-body ul{list-style:none;margin:0 0 20px;padding:0;display:grid;gap:8px;}
    .app-body li{position:relative;padding-left:24px;color:var(--ink);}
    .app-body li::before{content:"";position:absolute;left:2px;top:.55em;width:10px;height:10px;border-radius:50%;background:var(--dot);}
    .app-actions{margin-top:auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
    .app-note{font-size:12px;color:var(--muted);margin:12px 0 0;}
    .status-pill{position:absolute;top:14px;right:14px;z-index:3;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.12em;
      text-transform:uppercase;background:rgba(5,8,14,.74);border:1px solid var(--pill);color:#fff;}

    /* Feature cards: the enterprise apps, full width, picture beside the words */
    .feature-stack{display:grid;gap:22px;margin-top:26px;}
    .app-card.feature{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);}
    .app-card.feature .app-visual{height:auto;min-height:400px;}
    .app-card.feature .app-body{padding:30px 32px 32px;}
    .app-card.feature .app-body h3{font-size:34px;}
    .app-card.feature.flip .app-visual{order:2;}
    .app-card.feature ul{grid-template-columns:1fr 1fr;column-gap:18px;}

    /* Compact cards: the interactive showcase, three across */
    .apps-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
    .compact .app-visual{height:200px;}
    .compact .app-body{padding:18px 20px 22px;}
    .compact .app-body h3{font-size:23px;}
    .compact .app-body .pitch{font-size:14.5px;}
    .compact .app-body ul{gap:6px;margin-bottom:14px;font-size:14px;}
    .compact .phone{width:96px;border-radius:15px;border-width:3px;}
    .compact .phone.a{transform:translate(30px,20px) rotate(5deg);}
    .compact .phone.b{transform:translate(-44px,30px) rotate(-6deg);}
    .tech{margin:0 0 16px;}
    .tech b{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
    .tech span{display:inline-block;font-size:12px;font-weight:600;padding:4px 9px;border-radius:999px;margin:0 4px 5px 0;
      background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:var(--ink);}

    /* ScanPay: QR payments, green brand with a yellow pay button; the product mockup on its own dark field */
    .scanpay .app-visual{background:#08090d url(scanpay.webp) center / contain no-repeat;}
    .scanpay .app-tag{background:rgba(34,195,122,.15);color:#5fe0a4;}
    .scanpay h3 em{font-style:normal;color:#22c37a;}
    .scanpay li{--dot:#22c37a;}
    .scanpay .btn:not(.btn-outline){background:#F2DC4A;color:#141204;}
    .scanpay .btn-outline{border-color:#22c37a;color:#5fe0a4;}
    .scanpay .btn-outline:hover{background:rgba(34,195,122,.12);color:#fff;border-color:#22c37a;}
    .scanpay .status-pill{--pill:rgba(242,220,74,.6);color:#fdf6c3;}

    /* ROHA: organizational analytics -- a health index, five dimensions, current vs desired */
    .roha .app-visual{background:radial-gradient(circle at 70% 20%, rgba(52,198,142,.22), transparent 58%), linear-gradient(180deg,#0c1b35,#070f1f);}
    .roha .app-tag{background:rgba(52,198,142,.15);color:#6fe0b2;}
    .roha .laptop .scr{background-image:url(roha-dashboard.webp);border-color:#1c2940;}
    .roha .laptop .base{background:linear-gradient(180deg,#2c3a52,#131b2a);}
    .report{position:absolute;right:1%;bottom:-3%;width:30%;aspect-ratio:520/673;border-radius:4px;z-index:2;transform:rotate(4deg);
      background:#fff url(roha-report.webp) center / cover no-repeat;box-shadow:0 18px 40px rgba(0,0,0,.6);}
    .roha h3 em{font-style:normal;color:var(--roha);}
    .roha li{--dot:var(--roha);}
    .roha .btn:not(.btn-outline){background:var(--roha-deep);}
    .roha .btn:not(.btn-outline):hover{background:#0b5f58;}
    .roha .btn-outline{border-color:var(--roha);color:#6fe0b2;}
    .roha .btn-outline:hover{background:rgba(52,198,142,.12);color:#fff;border-color:var(--roha);}
    .roha .status-pill{--pill:rgba(52,198,142,.6);color:#d1fae5;}

    /* RodIQ: its own purple brand, two live screens */
    .rodiq .app-visual{background:radial-gradient(circle at 70% 15%, rgba(124,92,255,.38), transparent 60%), linear-gradient(180deg,#171235,#0d0a22);}
    .rodiq .app-tag{background:rgba(124,92,255,.18);color:#b4a4ff;}
    .rodiq h3 em{font-style:normal;color:#8f7bff;}
    .rodiq li{--dot:#8f7bff;}
    .rodiq .btn{background:#5b3fd6;}
    .rodiq .btn:hover{background:#4a31bd;}
    .phone{position:absolute;width:132px;aspect-ratio:1284/2778;border-radius:20px;overflow:hidden;border:4px solid #1c2644;
      box-shadow:0 18px 40px rgba(0,0,0,.6);background:#0a0e1a center / cover no-repeat;}
    .phone.r1{background-image:url(rodiq-login.webp);border-color:#2a2350;transform:translate(-62px,40px) rotate(-6deg);opacity:.92;}
    .phone.r2{background-image:url(rodiq-signup.webp);border-color:#2a2350;transform:translate(38px,26px) rotate(5deg);z-index:2;}
    .phone.rp{aspect-ratio:390/844;}
    .feature .phone.rp{width:156px;}
    .feature .phone.r1{transform:translate(-78px,34px) rotate(-6deg);}
    .feature .phone.r2{transform:translate(52px,14px) rotate(5deg);}

    /* Blocky Market */
    .blocky .app-visual{background:radial-gradient(circle at 75% 15%, rgba(255,194,61,.22), transparent 55%), #0a0e1a;}
    .blocky .app-tag{background:rgba(255,194,61,.14);color:var(--blocky-gold);}
    .blocky h3 em{font-style:normal;color:var(--blocky-gold);}
    .blocky li{--dot:var(--blocky-gold);}
    .phone.a{background-image:url(blocky-slots.webp);transform:translate(38px,26px) rotate(5deg);z-index:2;}
    .phone.b{background-image:url(blocky-predict.webp);transform:translate(-62px,40px) rotate(-6deg);opacity:.9;}

    /* FLAME: a laptop screen and a phone, in its orange-on-charcoal style */
    .flame .app-visual{background:radial-gradient(circle at 30% 20%, rgba(232,93,36,.28), transparent 60%), linear-gradient(180deg,#1b1310,#0d0a09);}
    .flame .app-tag{background:rgba(232,93,36,.16);color:#ff9a6b;}
    .flame h3 em{font-style:italic;color:#ff7a3d;font-family:Georgia,"Times New Roman",serif;}
    .flame li{--dot:#ff7a3d;}
    .flame .btn{background:#e0531f;}
    .flame .btn:hover{background:#c64615;}
    /* the pair scales with the card, so nothing runs off the right edge on narrow screens */
    .duo{position:relative;width:min(360px,88%);aspect-ratio:360/236;}
    .feature .duo{width:min(460px,88%);}
    .roha .duo{width:min(560px,94%);}
    .laptop{position:absolute;left:0;top:6%;width:82%;}
    .laptop .scr{aspect-ratio:1440/900;border-radius:10px 10px 0 0;border:6px solid #2a2320;border-bottom-width:10px;
      background:#111 url(flame-desk.webp) center / cover no-repeat;box-shadow:0 18px 40px rgba(0,0,0,.6);}
    .laptop .base{height:10px;margin:0 -18px;border-radius:0 0 12px 12px;background:linear-gradient(180deg,#3a312d,#1d1816);}
    .phone.fp{aspect-ratio:390/844;width:26%;right:2%;bottom:0;border-width:3px;border-radius:14px;border-color:#2a2320;background-image:url(flame-phone.webp);transform:rotate(4deg);z-index:2;}

    /* Fantasy Coach Live: the logo on its chalkboard */
    /* contain, not cover: the whole logo always shows, letterboxed on its own dark field */
    .fcl .app-visual{background:#0b0714 url(fcl-logo.webp) center / contain no-repeat;background-origin:content-box;padding:10px 14px;}
    .fcl .app-tag{background:rgba(155,92,255,.18);color:#c9a6ff;}
    .fcl h3 em{font-style:normal;color:#b07bff;}
    .fcl li{--dot:#9b5cff;}
    .fcl .btn{background:linear-gradient(180deg,#b07bff,#7c3aed);}


    /* More on the way */
    .more-card{display:flex;align-items:center;gap:22px;flex-wrap:wrap;border:1px dashed rgba(245,132,38,.45);border-radius:16px;margin-top:22px;
      padding:26px 28px;background:linear-gradient(180deg,rgba(18,25,38,.6),rgba(12,18,29,.6));}
    .more-card .dots{display:flex;gap:8px;}
    .more-card .dots span{width:12px;height:12px;border-radius:50%;background:var(--knicks-orange);opacity:.35;animation:pulse 1.6s ease-in-out infinite;}
    .more-card .dots span:nth-child(2){animation-delay:.2s;} .more-card .dots span:nth-child(3){animation-delay:.4s;}
    @keyframes pulse{50%{opacity:1;transform:scale(1.15);}}
    .more-card h3{margin:0 0 4px;}
    .more-card p{margin:0;color:var(--muted);}
    .more-card .grow{flex:1;min-width:240px;}

    /* ===== Pillars ===== */
    .pillars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px;}
    .pillar{background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:20px;box-shadow:var(--shadow);}
    .pillar h3{margin:0 0 6px;}
    .pillar p{margin:0;color:var(--muted);}
    .help-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;}

    @media (max-width:1000px){
      .app-card.feature ul{grid-template-columns:1fr;}
    }
    @media (max-width:900px){
      .apps-hero{grid-template-columns:1fr;text-align:center;justify-items:center;}
      .apps-hero .cta,.jump{justify-content:center;}
      .apps-grid,.pillars,.apps-grid.compact{grid-template-columns:1fr;}
      .app-card.feature{grid-template-columns:1fr;}
      .app-card.feature.flip .app-visual{order:0;}
      .app-card.feature .app-visual{min-height:300px;}
    }
    @media (max-width:640px){
      .main > .hero, .main > .section{padding-left:20px;padding-right:20px;}
      .apps-hero{padding-top:48px;padding-bottom:56px;}
      .apps-hero h1{font-size:34px;}
      .coin-stage{width:140px;height:140px;}
      .cat-head{grid-template-columns:1fr;gap:12px;}
      .app-card.feature .app-body{padding:22px 20px 24px;}
      .app-card.feature .app-body h3{font-size:28px;}
      .app-card.feature .app-visual{padding:18px 14px;}
      .feature .phone.rp{width:128px;}
    }
  </style>
</head>
<body>

<header class="site-header">
  <div class="container nav">
    <a href="https://rodrikconsulting.com/" class="brand">
      <img class="logo" src="https://rodrikconsulting.com/assets/Logo_Transparent.png" alt="Rodrik Consulting">
    </a>

    <button class="nav-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle navigation">
      <span class="sr-only">Toggle menu</span>
      <span class="burger"></span><span class="burger"></span><span class="burger"></span>
    </button>

    <nav class="nav-links desktop" aria-label="Primary">
      <a href="https://rodrikconsulting.com/about.php" data-en="About" data-es="Acerca">About</a>
      <a href="https://rodrikconsulting.com/#solutions" data-en="Solutions" data-es="Soluciones">Solutions</a>
      <a href="https://rodrikconsulting.com/#work" data-en="Work" data-es="Trabajo">Work</a>
      <a href="https://rodrikconsulting.com/#framework" data-en="FLAME" data-es="FLAME">FLAME</a>
      <a href="https://apps.rodrikconsulting.com/" class="current" data-en="Apps" data-es="Apps">Apps</a>
      <a href="https://rodrikconsulting.com/team.php" data-en="Team" data-es="Equipo">Team</a>
      <a href="https://rodrikconsulting.com/#contact" class="btn" data-en="Contact" data-es="Contacto">Contact</a>
      <span class="lang-switcher"><button class="lang-en active" aria-label="English">EN</button><span class="lang-divider"></span><button class="lang-es" aria-label="Español">ES</button></span>
    </nav>
  </div>

  <nav id="mobile-menu" class="mobile-menu" aria-label="Primary">
    <a href="https://rodrikconsulting.com/about.php">About</a>
    <a href="https://rodrikconsulting.com/#solutions">Solutions</a>
    <a href="https://rodrikconsulting.com/#work">Work</a>
    <a href="https://rodrikconsulting.com/#framework">FLAME</a>
    <a href="https://apps.rodrikconsulting.com/">Apps</a>
    <a href="https://rodrikconsulting.com/team.php">Team</a>
    <a href="https://rodrikconsulting.com/#contact" class="btn">Contact</a>
    <span class="lang-switcher"><button class="lang-en active" aria-label="English">EN</button><span class="lang-divider"></span><button class="lang-es" aria-label="Español">ES</button></span>
  </nav>
</header>

<main class="container main">

  <section class="hero apps-hero">
    <div class="coin-stage" aria-hidden="true"><div class="coin"><div class="face"></div><div class="face back"></div></div></div>
    <div>
      <p class="kicker" data-en="Rodrik Apps" data-es="Rodrik Apps">Rodrik Apps</p>
      <h1 data-en="Software built on the way we think about organizations" data-es="Software construido sobre nuestra forma de entender las organizaciones">Software built on the way we think about organizations</h1>
      <p class="lede"><span data-en="The same focus on clarity, evidence and measurable impact that guides our consulting work. Enterprise solutions for QR payments, AI governance, organizational health and SAT and ACT preparation. And entertainment apps that put real-time data, analytics and simulation in people's hands." data-es="El mismo enfoque en claridad, evidencia e impacto medible que guía nuestra consultoría. Soluciones empresariales para pagos con QR, la gobernanza de la IA, la salud organizacional y la preparación para el SAT y el ACT. Y apps de entretenimiento que ponen datos en tiempo real, analítica y simulación en manos de las personas.">The same focus on clarity, evidence and measurable impact that guides our consulting work. Enterprise solutions for QR payments, AI governance, organizational health and SAT and ACT preparation. And entertainment apps that put real-time data, analytics and simulation in people's hands.</span></p>
      <div class="cta">
        <a class="btn" href="#enterprise" data-en="Enterprise solutions" data-es="Soluciones empresariales">Enterprise solutions</a>
        <a class="btn btn-outline" href="https://rodrikconsulting.com/#contact" data-en="Work with us" data-es="Trabaje con nosotros">Work with us</a>
      </div>
      <div class="jump" aria-label="Jump to a category">
        <a href="#enterprise" style="--c:#4aa8ff"><i></i><span data-en="Enterprise Solutions" data-es="Soluciones Empresariales">Enterprise Solutions</span></a>
        <a href="#entertainment" style="--c:#F58426"><i></i><span data-en="Entertainment &amp; Simulation" data-es="Entretenimiento y Simulación">Entertainment &amp; Simulation</span></a>
      </div>
    </div>
  </section>

  <!-- ═══ 1. ENTERPRISE SOLUTIONS ═══ -->
  <section id="enterprise" class="section cat-enterprise">
    <div class="cat-head reveal">
      <div class="cat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg></div>
      <div>
        <p class="cat-eyebrow" data-en="01 · Enterprise Solutions" data-es="01 · Soluciones Empresariales">01 · Enterprise Solutions</p>
        <h2 data-en="Enterprise Solutions" data-es="Soluciones Empresariales">Enterprise Solutions</h2>
        <p class="section-lede"><span data-en="Payment, assessment, decision-support and learning platforms developed to support organizational performance, leadership, governance and student achievement." data-es="Plataformas de pagos, evaluación, apoyo a la toma de decisiones y aprendizaje desarrolladas para fortalecer el desempeño organizacional, el liderazgo, la gobernanza y el logro de los estudiantes.">Payment, assessment, decision-support and learning platforms developed to support organizational performance, leadership, governance and student achievement.</span></p>
      </div>
    </div>

    <div class="feature-stack">
      <article class="app-card feature scanpay reveal" id="scanpay">
        <div class="app-visual" role="img" aria-label="ScanPay dashboard and customer payment screen on two phones">
          <span class="status-pill" data-en="Pilot · Coming soon" data-es="Piloto · Próximamente">Pilot · Coming soon</span>
        </div>
        <div class="app-body">
          <span class="app-tag" data-en="Payments" data-es="Pagos">Payments</span>
          <h3>Scan<em>Pay</em></h3>
          <p class="full" data-en="QR payments for service businesses" data-es="Pagos con QR para negocios de servicios">QR payments for service businesses</p>
          <p class="tagline" data-en="Get paid on the spot. Straight to your account." data-es="Cobre en el momento. Directo a su cuenta.">Get paid on the spot. Straight to your account.</p>
          <p class="pitch"><span data-en="ScanPay turns any job, ticket or counter into a QR code. The customer scans it, adds a tip, and pays with Apple Pay, Google Pay, card, Zelle, Venmo or Cash App. The money goes straight to the business's own account, and the owner sees it come in live." data-es="ScanPay convierte cualquier trabajo, ticket o mostrador en un código QR. El cliente lo escanea, agrega una propina y paga con Apple Pay, Google Pay, tarjeta, Zelle, Venmo o Cash App. El dinero va directo a la cuenta del negocio, y el dueño lo ve llegar en vivo.">ScanPay turns any job, ticket or counter into a QR code. The customer scans it, adds a tip, and pays with Apple Pay, Google Pay, card, Zelle, Venmo or Cash App. The money goes straight to the business's own account, and the owner sees it come in live.</span></p>
          <ul>
            <li data-en="Scan-to-pay in seconds. The customer doesn't need an app or an account." data-es="Pague con un escaneo en segundos. El cliente no necesita una app ni una cuenta.">Scan-to-pay in seconds. The customer doesn't need an app or an account.</li>
            <li data-en="Apple Pay and Google Pay, plus Zelle, Venmo and Cash App" data-es="Apple Pay y Google Pay, además de Zelle, Venmo y Cash App">Apple Pay and Google Pay, plus Zelle, Venmo and Cash App</li>
            <li data-en="Tips built in: 10%, 15%, 20% or a custom amount" data-es="Propinas integradas: 10&nbsp;%, 15&nbsp;%, 20&nbsp;% o un monto personalizado">Tips built in: 10%, 15%, 20% or a custom amount</li>
            <li data-en="Ticket QRs for invoices, with automatic reminders for unpaid ones" data-es="QR por ticket para facturas, con recordatorios automáticos de las pendientes">Ticket QRs for invoices, with automatic reminders for unpaid ones</li>
            <li data-en="A QR for each tech, with owner, manager and staff roles" data-es="Un QR para cada técnico, con roles de dueño, gerente y personal">A QR for each tech, with owner, manager and staff roles</li>
            <li data-en="An AI weekly report with sales, KPIs and top performers" data-es="Un informe semanal con IA con ventas, KPI y mejores desempeños">An AI weekly report with sales, KPIs and top performers</li>
          </ul>
          <p class="tech"><b data-en="At a glance" data-es="De un vistazo">At a glance</b><span>Stripe Connect</span><span data-en="Real-time payments" data-es="Pagos en tiempo real">Real-time payments</span><span data-en="Role-based teams" data-es="Equipos por roles">Role-based teams</span><span data-en="AI analytics" data-es="Analítica con IA">AI analytics</span><span data-en="English &amp; Spanish" data-es="Inglés y español">English &amp; Spanish</span></p>
          <div class="app-actions">
            <span class="btn" aria-disabled="true" data-en="Pilot program · Coming soon" data-es="Programa piloto · Próximamente">Pilot program · Coming soon</span>
            <a class="btn btn-outline" href="https://rodrikconsulting.com/#contact" data-en="Ask about the pilot" data-es="Pregunte por el piloto">Ask about the pilot</a>
          </div>
          <p class="app-note"><span data-en="Plans from $19.99/month" data-es="Planes desde $19.99 al mes">Plans from $19.99/month</span></p>
        </div>
      </article>

      <article class="app-card feature flip flame reveal" id="flame">
        <div class="app-visual" aria-hidden="true">
          <div class="duo">
            <div class="laptop"><div class="scr"></div><div class="base"></div></div>
            <div class="phone fp"></div>
          </div>
        </div>
        <div class="app-body">
          <span class="app-tag" data-en="AI governance" data-es="Gobernanza de IA">AI governance</span>
          <h3>FLAME <em>Decision Audit</em></h3>
          <p class="pitch"><span data-en="Lead with clarity, not guesswork. An AI-powered audit of any organizational decision across the five dimensions of the FLAME framework: Future, Leadership, Analytics, Morality and Ethics." data-es="Lidere con claridad, no con suposiciones. Una auditoría con IA de cualquier decisión organizacional en las cinco dimensiones del marco FLAME: Futuro, Liderazgo, Analítica, Moralidad y Ética.">Lead with clarity, not guesswork. An AI-powered audit of any organizational decision across the five dimensions of the FLAME framework: Future, Leadership, Analytics, Morality and Ethics.</span></p>
          <ul>
            <li data-en="In about 10 minutes, see where your risks are" data-es="En unos 10 minutos, vea dónde están sus riesgos">In about 10 minutes, see where your risks are</li>
            <li data-en="A scored report with what to do about each one" data-es="Un informe con puntaje y qué hacer con cada riesgo">A scored report with what to do about each one</li>
            <li data-en="Based on Leading With Machines by Dr. Oscar A. Rodriguez" data-es="Basado en Leading With Machines del Dr. Oscar A. Rodriguez">Based on <em>Leading With Machines</em> by Dr. Oscar A. Rodriguez</li>
            <li data-en="In English and Spanish, no credit card required" data-es="En inglés y español, sin tarjeta de crédito">In English and Spanish, no credit card required</li>
          </ul>
          <div class="app-actions">
            <a class="btn" href="https://flame.droscarrodriguez.com" target="_blank" rel="noopener" data-en="Start an audit" data-es="Iniciar una auditoría">Start an audit</a>
          </div>
        </div>
      </article>

      <article class="app-card feature roha reveal" id="roha">
        <div class="app-visual" aria-hidden="true">
          <span class="status-pill" data-en="Pilot · Coming soon" data-es="Piloto · Próximamente">Pilot · Coming soon</span>
          <div class="duo roha-duo">
            <div class="laptop"><div class="scr"></div><div class="base"></div></div>
            <div class="report"></div>
          </div>
        </div>
        <div class="app-body">
          <span class="app-tag" data-en="Organizational health" data-es="Salud organizacional">Organizational health</span>
          <h3>RO<em>HA</em></h3>
          <p class="full" data-en="Rodrik Organizational Health Assessment" data-es="Evaluación de Salud Organizacional Rodrik">Rodrik Organizational Health Assessment</p>
          <p class="tagline" data-en="Understand Your Organization. Strengthen What Matters." data-es="Comprenda su organización. Fortalezca lo que importa.">Understand Your Organization. Strengthen What Matters.</p>
          <p class="pitch"><span data-en="A confidential organizational assessment platform that helps leaders understand how employees experience leadership, culture, engagement, operations, and strategic alignment. Identify gaps between current reality and desired conditions, uncover organizational priorities, and develop an actionable improvement roadmap." data-es="Una plataforma confidencial de evaluación organizacional que ayuda a los líderes a entender cómo los colaboradores viven el liderazgo, la cultura, el compromiso, las operaciones y la alineación estratégica. Identifique las brechas entre la realidad actual y las condiciones deseadas, descubra las prioridades de la organización y desarrolle una hoja de ruta de mejora accionable.">A confidential organizational assessment platform that helps leaders understand how employees experience leadership, culture, engagement, operations, and strategic alignment. Identify gaps between current reality and desired conditions, uncover organizational priorities, and develop an actionable improvement roadmap.</span></p>
          <ul>
            <li data-en="Confidential employee assessments" data-es="Evaluaciones confidenciales de colaboradores">Confidential employee assessments</li>
            <li data-en="Five organizational health dimensions" data-es="Cinco dimensiones de salud organizacional">Five organizational health dimensions</li>
            <li data-en="Current vs. desired state analysis" data-es="Análisis del estado actual vs. el deseado">Current vs. desired state analysis</li>
            <li data-en="Executive dashboards and organizational health scoring" data-es="Tableros ejecutivos y puntaje de salud organizacional">Executive dashboards and organizational health scoring</li>
            <li data-en="AI-assisted executive reports" data-es="Informes ejecutivos asistidos por IA">AI-assisted executive reports</li>
            <li data-en="30/60/90-day improvement planning" data-es="Planes de mejora a 30, 60 y 90 días">30/60/90-day improvement planning</li>
          </ul>
          <div class="app-actions">
            <span class="btn" aria-disabled="true" data-en="Pilot program · Coming soon" data-es="Programa piloto · Próximamente">Pilot program · Coming soon</span>
            <a class="btn btn-outline" href="https://rodrikconsulting.com/#contact" data-en="Ask about the pilot" data-es="Pregunte por el piloto">Ask about the pilot</a>
          </div>
          <p class="app-note"><span data-en="An independently developed organizational assessment platform, preparing for its first pilot." data-es="Una plataforma de evaluación organizacional de desarrollo independiente, en preparación para su primer piloto.">An independently developed organizational assessment platform, preparing for its first pilot.</span></p>
        </div>
      </article>

      <article class="app-card feature flip rodiq reveal" id="rodiq">
        <div class="app-visual" aria-hidden="true">
          <div class="phone rp r1"></div>
          <div class="phone rp r2"></div>
        </div>
        <div class="app-body">
          <span class="app-tag" data-en="SAT &amp; ACT prep" data-es="Preparación SAT y ACT">SAT &amp; ACT prep</span>
          <h3>Rod<em>IQ</em></h3>
          <p class="full" data-en="Personalized SAT &amp; ACT Preparation" data-es="Preparación personalizada para el SAT y el ACT">Personalized SAT &amp; ACT Preparation</p>
          <p class="pitch"><span data-en="Personalized SAT and ACT preparation by Dr. Rod. Students prepare on their own, and Dr. Rod's tutoring clients sign in with the link Dr. Rod sends them." data-es="Preparación personalizada para el SAT y el ACT del Dr. Rod. Los estudiantes se preparan por su cuenta, y los clientes de tutoría del Dr. Rod ingresan con el enlace que el Dr. Rod les envía.">Personalized SAT and ACT preparation by Dr. Rod. Students prepare on their own, and Dr. Rod's tutoring clients sign in with the link Dr. Rod sends them.</span></p>
          <ul>
            <li data-en="Diagnostics that find where each student stands" data-es="Diagnósticos que muestran el nivel de cada estudiante">Diagnostics that find where each student stands</li>
            <li data-en="Recommendations for what to study next" data-es="Recomendaciones sobre qué estudiar a continuación">Recommendations for what to study next</li>
            <li data-en="Practice for the SAT, the ACT, or both" data-es="Práctica para el SAT, el ACT o ambos">Practice for the SAT, the ACT, or both</li>
            <li data-en="Progress tracking toward a target score" data-es="Seguimiento del progreso hacia un puntaje meta">Progress tracking toward a target score</li>
          </ul>
          <div class="app-actions">
            <?php if ($rodiq_url): ?>
              <a class="btn" href="<?= htmlspecialchars($rodiq_url, ENT_QUOTES) ?>" target="_blank" rel="noopener" data-en="Open RodIQ" data-es="Abrir RodIQ">Open RodIQ</a>
            <?php else: ?>
              <span class="btn" aria-disabled="true" data-en="Coming soon" data-es="Próximamente">Coming soon</span>
            <?php endif; ?>
          </div>
        </div>
      </article>
    </div>
  </section>

  <!-- ═══ 2. ENTERTAINMENT & SIMULATION ═══ -->
  <section id="entertainment" class="section cat-interactive">
    <div class="cat-head reveal">
      <div class="cat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/></svg></div>
      <div>
        <p class="cat-eyebrow" data-en="02 · Entertainment &amp; Simulation" data-es="02 · Entretenimiento y Simulación">02 · Entertainment &amp; Simulation</p>
        <h2 data-en="Entertainment &amp; Simulation" data-es="Entretenimiento y Simulación">Entertainment &amp; Simulation</h2>
        <p class="section-lede"><span data-en="Exploring predictive analytics, real-time decision support, and simulation through interactive applications." data-es="Explorando la analítica predictiva, el apoyo a decisiones en tiempo real y la simulación a través de aplicaciones interactivas.">Exploring predictive analytics, real-time decision support, and simulation through interactive applications.</span></p>
      </div>
    </div>
    <p class="under reveal"><span data-en="These are entertainment apps, built for fun. Underneath, they run on the same foundations as our analytics work: real-time data processing, recommendation systems and statistical modeling." data-es="Son apps de entretenimiento, hechas para divertirse. Por dentro, funcionan sobre las mismas bases que nuestro trabajo de analítica: procesamiento de datos en tiempo real, sistemas de recomendación y modelado estadístico.">These are entertainment apps, built for fun. Underneath, they run on the same foundations as our analytics work: real-time data processing, recommendation systems and statistical modeling.</span></p>

    <div class="apps-grid compact">
      <article class="app-card blocky reveal" id="blocky">
        <div class="app-visual" aria-hidden="true">
          <div class="phone b"></div>
          <div class="phone a"></div>
        </div>
        <div class="app-body">
          <span class="app-tag" data-en="Free game · 18+" data-es="Juego gratis · 18+">Free game · 18+</span>
          <h3>Blocky <em>Market</em></h3>
          <p class="pitch"><span data-en="Call where crypto goes next, pick the week's sports winners, back an AI bot in the Arena, and chase a jackpot that follows the price of Bitcoin." data-es="Anticipa hacia dónde va el mercado cripto, elige a los ganadores deportivos de la semana, apoya a un bot de IA en la Arena y persigue un premio mayor que sigue el precio de Bitcoin.">Call where crypto goes next, pick the week's sports winners, back an AI bot in the Arena, and chase a jackpot that follows the price of Bitcoin.</span></p>
          <ul>
            <li data-en="Crypto calls checked live every 15 minutes" data-es="Predicciones cripto verificadas en vivo cada 15 minutos">Crypto calls checked live every 15 minutes</li>
            <li data-en="Weekly sports picks and a Friday Bitcoin close pool" data-es="Selecciones deportivas semanales y el cierre de Bitcoin cada viernes">Weekly sports picks and a Friday Bitcoin close pool</li>
            <li data-en="Six AI bots racing all week in the Arena" data-es="Seis bots de IA compitiendo toda la semana en la Arena">Six AI bots racing all week in the Arena</li>
            <li data-en="Twelve casino games, leaderboards and private leagues" data-es="Doce juegos de casino, clasificaciones y ligas privadas">Twelve casino games, leaderboards and private leagues</li>
          </ul>
          <p class="tech"><b data-en="Under the hood" data-es="Por dentro">Under the hood</b><span data-en="Live market data" data-es="Datos de mercado en vivo">Live market data</span><span data-en="Real-time settlement" data-es="Liquidación en tiempo real">Real-time settlement</span><span data-en="Provably fair odds" data-es="Probabilidades verificables">Provably fair odds</span></p>
          <div class="app-actions">
            <a class="btn btn-gold" href="https://app.blockyaiagent.io" target="_blank" rel="noopener" data-en="Play free" data-es="Jugar gratis">Play free</a>
            <a class="btn btn-outline" href="https://blockyaiagent.io" target="_blank" rel="noopener" data-en="Learn more" data-es="Más información">Learn more</a>
          </div>
          <p class="app-note"><span data-en="Points and chips have no cash value. No real money, ever. Coming soon to iPhone and Android." data-es="Los puntos y fichas no tienen valor en efectivo. Nunca dinero real. Próximamente en iPhone y Android.">Points and chips have no cash value. No real money, ever. Coming soon to iPhone and Android.</span></p>
        </div>
      </article>

      <article class="app-card fcl reveal" id="fantasy-coach-live">
        <div class="app-visual" aria-hidden="true"></div>
        <div class="app-body">
          <span class="app-tag" data-en="Fantasy sports" data-es="Deportes de fantasía">Fantasy sports</span>
          <h3>Fantasy Coach <em>Live</em></h3>
          <p class="pitch"><span data-en="A smarter way to play. Live coaching for fantasy football, so every call you make is a better-informed one." data-es="Una forma más inteligente de jugar. Asesoría en vivo para el fútbol americano de fantasía, para que cada decisión sea mejor informada.">A smarter way to play. Live coaching for fantasy football, so every call you make is a better-informed one.</span></p>
          <ul>
            <li data-en="Lineup help every week" data-es="Ayuda con su alineación cada semana">Lineup help every week</li>
            <li data-en="Waivers and trades" data-es="Agentes libres e intercambios">Waivers and trades</li>
            <li data-en="Strategy, all season long" data-es="Estrategia durante toda la temporada">Strategy, all season long</li>
          </ul>
          <p class="tech"><b data-en="Under the hood" data-es="Por dentro">Under the hood</b><span data-en="Real-time data" data-es="Datos en tiempo real">Real-time data</span><span data-en="Recommendation engine" data-es="Motor de recomendaciones">Recommendation engine</span><span data-en="Statistical analysis" data-es="Análisis estadístico">Statistical analysis</span></p>
          <div class="app-actions">
            <a class="btn" href="https://fcl-app.droscarrodriguez.com/" target="_blank" rel="noopener" data-en="Open Fantasy Coach Live" data-es="Abrir Fantasy Coach Live">Open Fantasy Coach Live</a>
          </div>
        </div>
      </article>
    </div>

    <div class="more-card reveal">
      <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="grow">
        <h3 data-en="More on the way" data-es="Más en camino">More on the way</h3>
        <p data-en="We're building more. New apps will be announced here soon." data-es="Estamos construyendo más. Pronto anunciaremos nuevas apps aquí.">We're building more. New apps will be announced here soon.</p>
      </div>
      <a class="btn btn-outline" href="https://rodrikconsulting.com/#contact" data-en="Have an idea? Talk to us" data-es="¿Tiene una idea? Hablemos">Have an idea? Talk to us</a>
    </div>
  </section>

  <section id="how-we-build" class="section">
    <h2 class="reveal" data-en="How We Build" data-es="Cómo Construimos">How We Build</h2>
    <p class="section-lede reveal"><span data-en="The principles behind our advisory work apply to our products too." data-es="Los principios de nuestra asesoría también guían nuestros productos.">The principles behind our advisory work apply to our products too.</span></p>
    <div class="pillars">
      <article class="pillar reveal"><h3 data-en="Built With Purpose" data-es="Con Propósito">Built With Purpose</h3><p data-en="Every app starts with a clear job to do, whether that's strengthening an organization, raising a test score or making a game worth coming back to." data-es="Cada app nace con un objetivo claro, ya sea fortalecer una organización, mejorar un puntaje o crear un juego al que valga la pena volver.">Every app starts with a clear job to do, whether that's strengthening an organization, raising a test score or making a game worth coming back to.</p></article>
      <article class="pillar reveal"><h3 data-en="Private by Default" data-es="Privacidad Primero">Private by Default</h3><p data-en="We collect only what an app needs to work. No ads and no selling your data." data-es="Solo recopilamos lo que cada app necesita para funcionar. Sin anuncios y sin vender sus datos.">We collect only what an app needs to work. No ads and no selling your data.</p></article>
      <article class="pillar reveal"><h3 data-en="Web and Mobile" data-es="Web y Móvil">Web and Mobile</h3><p data-en="Our apps work in the browser and on your phone, so you can pick up wherever you are." data-es="Nuestras apps funcionan en el navegador y en su teléfono, para que continúe donde esté.">Our apps work in the browser and on your phone, so you can pick up wherever you are.</p></article>
    </div>
    <div class="help-links reveal">
      <a class="btn btn-outline" href="https://app.blockyaiagent.io/support" target="_blank" rel="noopener" data-en="Blocky Market support" data-es="Soporte de Blocky Market">Blocky Market support</a>
      <a class="btn btn-outline" href="https://app.blockyaiagent.io/privacy" target="_blank" rel="noopener" data-en="Blocky Market privacy" data-es="Privacidad de Blocky Market">Blocky Market privacy</a>
      <a class="btn" href="https://rodrikconsulting.com/#contact" data-en="Contact us" data-es="Contáctenos">Contact us</a>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="container footer">
    <div>
      <div class="foot-copy">© <span class="yr"></span> Rodrik Consulting. All rights reserved.</div>
      <div class="foot-tagline" data-en="Leadership. Analytics. Ethics. Impact." data-es="Liderazgo. Analítica. Ética. Impacto.">Leadership. Analytics. Ethics. Impact.</div>
    </div>
    <nav class="foot-links" aria-label="Footer">
      <a href="https://www.amazon.com/dp/B0F4W4V6QK" target="_blank" rel="noopener" data-en="Book" data-es="Libro">Book</a>
      <a href="https://flame.droscarrodriguez.com" target="_blank" rel="noopener" data-en="FLAME Audit" data-es="Auditoría FLAME">FLAME Audit</a>
      <a href="https://apps.rodrikconsulting.com/" data-en="Apps" data-es="Apps">Apps</a>
      <a href="https://www.droscarrodriguez.com" target="_blank" rel="noopener" data-en="Dr. Rodriguez" data-es="Dr. Rodríguez">Dr. Rodriguez</a>
      <a href="https://rodrikconsulting.com/about.php">About</a>
    </nav>
    <div class="foot-social">
      <a href="https://www.linkedin.com/in/droscarrodriguez" target="_blank" rel="noopener" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
        LinkedIn
      </a>
    </div>
  </div>
</footer>

<script>document.querySelectorAll(".yr").forEach(function(e){e.textContent=new Date().getFullYear();});</script>
<script>
  (function(){
    function setHeaderVars(){
      var hdr = document.querySelector('.site-header');
      if(!hdr) return;
      document.documentElement.style.setProperty('--header-h', (hdr.offsetHeight || 72) + 'px');
    }
    window.addEventListener('load', setHeaderVars);
    window.addEventListener('resize', setHeaderVars);
  })();
</script>
<script>
/* Reveal-on-scroll observer (same as the homepage) */
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
</script>
<script src="https://rodrikconsulting.com/assets/script.js?v=<?= $ver('script.js') ?>"></script>
<script src="https://rodrikconsulting.com/assets/lang.js?v=1"></script>
</body>
</html>
