<?php
session_start();
$a = random_int(2,9);
$b = random_int(2,9);
$_SESSION['captcha_answer'] = (string)($a + $b);
$_SESSION['csrf'] = bin2hex(random_bytes(16));
/* MSA Vegas 2026 consultation form: shown only at rodrikconsulting.com/#msarequest */
define('MSA_EMBED', true);
if (is_file(__DIR__ . '/msa2026/index.php')) require_once __DIR__ . '/msa2026/index.php';
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
  <meta name="description" content="Rodrik Consulting helps leaders align strategy, analytics, AI governance, and digital transformation to make clearer decisions and create measurable impact." />
  <title>Rodrik Consulting — Strategic Leadership, Data & AI Advisory</title>
  <!--<link rel="icon" href="/assets/rodrikconsulting.svg" type="image/svg+xml">-->
  <!--<link rel="icon" type="image/png" href="/rodrikconsulting.png">-->
<link rel="icon" href="/favicon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/styles.css?v=<?= filemtime($_SERVER['DOCUMENT_ROOT'].'/assets/styles.css') ?>">




  <style>
    :root{
      --header-h:72px;
      --knicks-blue:#006BB6; --knicks-blue-600:#005A98; --knicks-blue-700:#004C82;
      --knicks-orange:#F58426;
      --ink:#E8EDF2; --muted:#A7B2BF; --stroke:rgba(255,255,255,.10);
      --panel:rgba(20,24,33,.9); --shadow:0 10px 30px rgba(0,0,0,.40);
      --sticky-bg:rgba(8,10,14,.92); --focus:0 0 0 3px rgba(0,107,182,.35);
    }

    html,body{background:#000;color:var(--ink);}
    a{color:var(--knicks-blue);text-decoration:none;}
    a:hover{color:var(--knicks-blue-600);text-decoration:underline;}
    a:focus-visible,.btn:focus-visible{outline:none;box-shadow:var(--focus);border-radius:8px;}

    /* ===========================
       HEADER (STICKY + MOBILE FIX)
       =========================== */
    .site-header{
      position: sticky;      /* stays at the top on scroll */
      top: 0;
      z-index: 10000;
      background: linear-gradient(180deg, rgba(11,15,23,.96), rgba(11,15,23,.78) 60%, rgba(11,15,23,0));
      -webkit-backdrop-filter: saturate(140%) blur(8px);
      backdrop-filter: saturate(140%) blur(8px);
      border-bottom: 1px solid var(--stroke);
    }
    .site-header .container.nav{
      position:relative;
      display:flex; align-items:center; justify-content:space-between;
      min-height:72px; padding:0 20px;
      gap:12px;
    }
    .site-header .brand{
      display:flex; align-items:center; gap:10px;
      flex:0 0 auto;
      z-index:10002; /* above dropdown */
    }
    /* Make dark SVGs readable on dark header. Remove this if your logo is already colored/light. */
    /*.site-header .brand .logo{
      height:36px; width:auto; display:block;
      filter: brightness(0) invert(1) contrast(1.1) saturate(1.05);
    }*/

    /* Burger */
    .nav-toggle{
      display:none;          /* shown on mobile via media query */
      order:2; flex:0 0 auto;
      background:none; border:0; cursor:pointer;
      width:44px; height:40px; padding:0;
      margin-left:auto;
      z-index:10003;
    }
    .nav-toggle .burger{
      display:block;
      width:28px;           /* <- prevents “three dots” issue */
      height:3px;
      background:#fff;      /* bright on dark header */
      border-radius:2px;
      margin:6px 8px;       /* vertical spacing between bars */
    }

    /* Desktop links */
    .nav-links.desktop{display:flex;gap:18px;align-items:center;order:3;margin-left:8px;}
    .nav-links.desktop a{color:var(--ink);opacity:.9;}
    .nav-links.desktop a:hover{color:#fff;opacity:1;text-decoration:none;}
    .nav-links.desktop .btn{margin-left:6px;}

    /* Mobile dropdown */
    .mobile-menu{display:none;}
    .mobile-menu.open{display:block;}

    @media (max-width:840px){
      .nav-links.desktop{display:none;}   /* hide desktop nav */
      .nav-toggle{display:inline-block;}  /* show burger */
      .mobile-menu{
        position:absolute; right:20px; top:calc(100% + 8px);
        width:min(78vw,320px);
        background:var(--panel); border:1px solid var(--stroke);
        border-radius:12px; padding:8px; box-shadow:var(--shadow); z-index:10001;
      }
      .mobile-menu a{display:block; color:var(--ink); padding:12px; border-radius:10px;}
      .mobile-menu a:hover{background:rgba(255,255,255,.06)}
      .mobile-menu .btn{display:block; text-align:center; margin:6px 4px 2px;}
    }

    /* Reveal */
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .45s ease,transform .45s ease;will-change:opacity,transform;}
    .reveal.revealed{opacity:1;transform:none;}
    @media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}

    /* Buttons */
    .btn{display:inline-block;padding:10px 16px;border-radius:10px;font-weight:600;background:var(--knicks-blue);color:#fff;border:1px solid transparent;transition:.2s ease;}
    .btn:hover{background:var(--knicks-blue-600);transform:translateY(-1px);}
    .btn:active{background:var(--knicks-blue-700);transform:none;}
    .btn.btn-outline{background:transparent;border-color:var(--knicks-blue);color:var(--knicks-blue);}
    .btn.btn-outline:hover{background:rgba(0,107,182,.12);color:#fff;border-color:var(--knicks-blue-600);}

    /* Cards */
    .card{
      background:var(--panel);border:1px solid var(--stroke);border-radius:16px;
      box-shadow:var(--shadow);padding:18px;display:block;color:var(--ink);
      transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
    }
    .card:hover{transform:translateY(-2px);border-color:rgba(245,132,38,.38);box-shadow:0 16px 36px rgba(0,0,0,.55);}
    .card .notice{color:var(--muted);}

    /* Sticky section headers (clear header height) */
    .section{position:relative;scroll-margin-top:calc(var(--header-h) + 12px);}
    .section>h2{
      position:sticky; top:calc(var(--header-h) + 0px);
      z-index:5; background:var(--sticky-bg);
      backdrop-filter:saturate(1.2) blur(12px); -webkit-backdrop-filter:saturate(1.2) blur(12px);
      padding:10px 0; margin:0 0 12px 0; border-bottom:1px solid var(--stroke);
    }

    /* Icons centered */
    .card-head{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:10px;text-align:center;}
    .card-icon{
      width:72px;height:72px;display:grid;place-items:center;border-radius:18px;
      background:linear-gradient(180deg,rgba(25,30,40,.9),rgba(18,22,32,.9));
      border:1px solid var(--stroke);box-shadow:var(--shadow);
    }
    .card-icon svg{width:34px;height:34px;stroke:var(--knicks-orange);stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round;}
    .card-head h3{margin:4px 0 0;}

    /* SOLUTIONS grid — exactly 3 × 2 */
    #solutions .grid.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;}
    @media (max-width:1024px){#solutions .grid.cards{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){#solutions .grid.cards{grid-template-columns:1fr;}}

    /* SELECTED WORK grid — featured first row (full-width), then 3 cols */
    #work .grid.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;}
    #work .work-feature{grid-column:1 / -1;}
    @media (max-width:1024px){#work .grid.cards{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){#work .grid.cards{grid-template-columns:1fr;}}

    /* Featured card styling */
    .highlight{
      border-color:rgba(245,132,38,.55);
      background:linear-gradient(180deg, rgba(20,24,33,.96), rgba(16,20,30,.92));
    }

    /* TESTIMONIALS */
    .tcard{background:var(--panel);border:1px solid var(--stroke);border-radius:16px;box-shadow:var(--shadow);padding:20px;}
    .t-head{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:8px;text-align:center;}
    .t-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:12px;
      background:linear-gradient(180deg,rgba(25,30,40,.9),rgba(18,22,32,.9));
      border:1px solid var(--stroke);box-shadow:var(--shadow);position:relative;}
    .t-icon svg{display:block;width:26px;height:26px;}
    .t-icon svg path{fill:var(--knicks-orange);}
    #testimonials .rc-carousel { overflow:hidden; }
    #testimonials .rc-carousel-track { display:flex; transition:transform .5s cubic-bezier(.4,0,.2,1); }
    #testimonials .rc-slide { min-width:100%; }
    #testimonials .rc-tcard {
      max-width:720px; margin:0 auto;
      background:linear-gradient(180deg,rgba(25,30,40,.9),rgba(18,22,32,.9));
      border:1px solid var(--stroke); border-radius:var(--radius);
      box-shadow:var(--shadow); padding:40px 48px; position:relative;
    }
    #testimonials .rc-tcard::before {
      content:""; position:absolute; top:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg,var(--knicks-orange),rgba(245,132,38,0.3));
      border-radius:var(--radius) var(--radius) 0 0;
    }
    #testimonials .rc-quote-mark {
      font-size:72px; line-height:.8; color:var(--knicks-orange);
      opacity:.35; margin-bottom:12px; font-family:Georgia,serif;
    }
    #testimonials .rc-quote-text {
      font-size:16px; font-weight:400; line-height:1.8;
      color:var(--ink); font-style:italic; margin-bottom:24px;
    }
    #testimonials .rc-attr { border-top:1px solid var(--stroke); padding-top:16px; }
    #testimonials .rc-attr-name { font-size:14px; font-weight:600; color:var(--ink); }
    #testimonials .rc-attr-title { font-size:12px; color:var(--knicks-orange); margin-top:3px; letter-spacing:.04em; }
    #testimonials .rc-carousel-controls {
      display:flex; align-items:center; justify-content:center; gap:14px; margin-top:24px;
    }
    #testimonials .rc-carousel-btn {
      background:none; border:1px solid var(--stroke); color:var(--muted);
      width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:14px;
      transition:border-color .18s,color .18s,background .18s;
    }
    #testimonials .rc-carousel-btn:hover { border-color:var(--knicks-orange); color:var(--knicks-orange); }
    #testimonials .rc-carousel-dots { display:flex; gap:8px; }
    #testimonials .rc-dot {
      width:7px; height:7px; border-radius:50%; background:var(--stroke);
      cursor:pointer; border:none; padding:0; transition:background .18s,transform .18s;
    }
    #testimonials .rc-dot.active { background:var(--knicks-orange); transform:scale(1.3); }
    @media(max-width:640px){ #testimonials .rc-tcard { padding:28px 22px; } }

    /* Featured testimonial */
    .rc-featured-testimonial{margin-top:40px;position:relative;border:1px solid var(--stroke);border-left:3px solid var(--knicks-orange);border-radius:var(--radius);padding:36px 44px;background:linear-gradient(180deg,rgba(25,30,40,.7),rgba(18,22,32,.7));}
    .rc-featured-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--knicks-orange);margin-bottom:20px;}
    .rc-featured-inner{display:flex;gap:20px;align-items:flex-start;}
    .rc-featured-quote-mark{font-size:64px;line-height:.8;color:var(--knicks-orange);opacity:.3;font-family:Georgia,serif;flex:0 0 auto;margin-top:4px;}
    .rc-featured-body p{font-size:15px;font-weight:300;line-height:1.85;color:var(--ink);font-style:italic;margin-bottom:14px;}
    .rc-featured-body p:last-child{margin-bottom:0;}
    .rc-featured-attr{margin-top:24px;padding-top:18px;border-top:1px solid var(--stroke);}
    .rc-featured-name{font-size:14px;font-weight:600;color:var(--ink);}
    .rc-featured-title{font-size:12px;color:var(--knicks-orange);margin-top:3px;letter-spacing:.03em;}
    .rc-featured-rel{font-size:11px;color:var(--muted);margin-top:4px;}
    @media(max-width:640px){.rc-featured-testimonial{padding:24px 20px;}.rc-featured-inner{flex-direction:column;gap:8px;}.rc-featured-quote-mark{font-size:40px;}}


    /* ===== Homepage visual rhythm fix: full-width bands + smoother hero transition ===== */
    .main.container{
      max-width:none;
      padding:0;
      overflow:hidden;
      background:
        radial-gradient(circle at 12% 8%, rgba(0,107,182,.10), transparent 28%),
        radial-gradient(circle at 85% 44%, rgba(245,132,38,.06), transparent 24%),
        #000;
    }

    .main > .hero,
    .main > .section{
      padding-left:max(44px, calc((100vw - 1120px) / 2 + 20px));
      padding-right:max(44px, calc((100vw - 1120px) / 2 + 20px));
    }

    .hero{
      min-height:390px;
      padding-top:72px;
      padding-bottom:86px;
      border-bottom:1px solid rgba(255,255,255,.08);
      background:
        linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.64) 46%, rgba(0,0,0,.82) 100%),
        linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.92) 100%),
        url('/assets/photos/banner.png') center/cover no-repeat;
    }
    .hero::before{display:none;}
    .hero > div{max-width:900px;}
    .hero h1{max-width:980px;letter-spacing:-.03em;}
    .hero .lede{max-width:900px;}

    .main > .section{
      margin:0;
      border-top:0;
      padding-top:66px;
      padding-bottom:66px;
      position:relative;
    }
    .main > .section::before{
      content:"";
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      border-top:1px solid rgba(255,255,255,.065);
    }
    .main > .section > *{position:relative;z-index:1;}

    /* Disable sticky section headings on the homepage; they felt jumpy and flattened the design. */
    .main > .section > h2{
      position:relative;
      top:auto;
      z-index:1;
      background:transparent;
      -webkit-backdrop-filter:none;
      backdrop-filter:none;
      border-bottom:0;
      padding:0;
      margin:0 0 12px;
      letter-spacing:-.02em;
    }

    #trusted-experience,
    #approach,
    #testimonials,
    #contact{
      background:
        radial-gradient(circle at 18% 0%, rgba(0,107,182,.10), transparent 34%),
        linear-gradient(180deg, #05080d 0%, #08111d 100%);
    }
    #philosophy,
    #solutions,
    #applications,
    #work,
    #field-slideshow,
    #community{
      background:
        radial-gradient(circle at 82% 20%, rgba(245,132,38,.055), transparent 26%),
        linear-gradient(180deg, #000 0%, #04070b 100%);
    }

    #trusted-experience .grid.cards{
      grid-template-columns:repeat(4,minmax(0,1fr));
    }
    #trusted-experience .card{
      min-height:170px;
      background:linear-gradient(180deg,rgba(19,26,39,.96),rgba(13,19,30,.96));
    }

    .section-lede{max-width:850px;}
    .card,.tcard,.panel{
      background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
      border-color:rgba(255,255,255,.11);
    }

    @media (max-width:1100px){
      #trusted-experience .grid.cards{grid-template-columns:repeat(2,minmax(0,1fr));}
    }
    @media (max-width:640px){
      .main > .hero,
      .main > .section{
        padding-left:20px;
        padding-right:20px;
      }
      .hero{min-height:auto;padding-top:54px;padding-bottom:64px;}
      .hero h1{font-size:36px;}
      #trusted-experience .grid.cards{grid-template-columns:1fr;}
    }


    /* FEATURED IN / MEDIA */
    #featured-in .featured-media-card{
      display:grid;
      grid-template-columns:84px 1fr;
      gap:24px;
      align-items:center;
      background:linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
      border:1px solid var(--stroke);
      border-radius:16px;
      box-shadow:var(--shadow);
      padding:28px;
      max-width:960px;
    }
    #featured-in .featured-media-icon{
      width:72px;
      height:72px;
      border-radius:18px;
      display:grid;
      place-items:center;
      background:linear-gradient(180deg,rgba(25,30,40,.9),rgba(18,22,32,.9));
      border:1px solid var(--stroke);
      box-shadow:var(--shadow);
    }
    #featured-in .featured-media-icon svg{
      width:34px;
      height:34px;
      stroke:var(--knicks-orange);
      stroke-width:1.9;
      fill:none;
      stroke-linecap:round;
      stroke-linejoin:round;
    }
    #featured-in .featured-media-kicker{
      color:var(--knicks-orange);
      font-size:12px;
      font-weight:700;
      letter-spacing:.08em;
      text-transform:uppercase;
      margin-bottom:8px;
    }
    #featured-in .featured-media-card h3{
      margin:0 0 10px;
      font-size:clamp(24px,3vw,36px);
      line-height:1.05;
    }
    #featured-in .featured-media-card p{
      color:var(--muted);
      max-width:760px;
      margin-bottom:18px;
    }
    @media(max-width:700px){
      #featured-in .featured-media-card{
        grid-template-columns:1fr;
        text-align:center;
      }
      #featured-in .featured-media-icon{
        margin:0 auto;
      }
    }

    /* APPLICATIONS (links to apps.rodrikconsulting.com) */
    #applications .apps-showcase{
      display:grid;
      grid-template-columns:200px 1fr;
      gap:36px;
      align-items:center;
      margin-top:22px;
      padding:32px;
      border:1px solid rgba(245,132,38,.38);
      border-radius:16px;
      background:
        radial-gradient(circle at 12% 30%, rgba(0,107,182,.18), transparent 45%),
        linear-gradient(180deg,rgba(18,25,38,.96),rgba(12,18,29,.96));
      box-shadow:var(--shadow);
    }
    #applications .apps-medallion{
      width:170px;height:170px;border-radius:50%;margin:0 auto;
      background:url('https://apps.rodrikconsulting.com/coin.webp') center / 74% no-repeat,
                 radial-gradient(circle at 35% 30%, #ffffff 0%, #eef1f6 70%, #dfe4ec 100%);
      box-shadow:inset 0 0 0 4px rgba(245,132,38,.55), inset 0 0 0 9px #fff, 0 18px 40px rgba(0,0,0,.5);
    }
    #applications .apps-list{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:0 0 22px;
      padding:0;
      list-style:none;
    }
    #applications .apps-list a{
      display:block;height:100%;box-sizing:border-box;
      padding:14px 16px 14px 36px;
      position:relative;
      border:1px solid var(--stroke);
      border-radius:12px;
      background:rgba(255,255,255,.025);
      color:var(--ink);
      transition:border-color .18s ease,background .18s ease;
    }
    #applications .apps-list a:hover{border-color:rgba(245,132,38,.45);background:rgba(255,255,255,.05);text-decoration:none;}
    #applications .apps-list a::before{
      content:"";position:absolute;left:15px;top:20px;
      width:10px;height:10px;border-radius:50%;background:var(--dot,var(--knicks-orange));
    }
    #applications .apps-list strong{display:block;font-size:16px;}
    #applications .apps-list span{display:block;font-size:13px;color:var(--muted);margin-top:2px;}
    #applications .apps-cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center;}
    #applications .apps-cta .btn{padding:12px 20px;}
    #applications .apps-cta .note{font-size:13px;color:var(--muted);}
    @media (max-width:900px){
      #applications .apps-showcase{grid-template-columns:1fr;text-align:center;padding:26px 20px;gap:22px;}
      #applications .apps-medallion{width:120px;height:120px;}
      #applications .apps-list{text-align:left;}
      #applications .apps-cta{justify-content:center;}
    }
    @media (max-width:560px){
      #applications .apps-list{grid-template-columns:1fr;}
      #applications .apps-cta .btn{display:block;width:100%;text-align:center;}
    }

    /* Utility */
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
  </style>
</head>
<body>

<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand">
      <img class="logo" src="/assets/Logo_Transparent.png" alt="Rodrik Consulting">
    </a>

    <button class="nav-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle navigation">
      <span class="sr-only">Toggle menu</span>
      <span class="burger"></span><span class="burger"></span><span class="burger"></span>
    </button>

    <nav class="nav-links desktop" aria-label="Primary">
      <a href="/about.php" data-en="About" data-es="Acerca">About</a>
      <a href="#solutions" data-en="Solutions" data-es="Soluciones">Solutions</a>
      <a href="#work" data-en="Work" data-es="Trabajo">Work</a>
      <a href="#framework" data-en="FLAME" data-es="FLAME">FLAME</a>
      <a href="https://apps.rodrikconsulting.com/" data-en="Apps" data-es="Apps">Apps</a>
        <a href="/team.php" data-en="Team" data-es="Equipo">Team</a>
      <a href="#contact" class="btn">Contact</a>
      <span class="lang-switcher"><button class="lang-en active" aria-label="English">EN</button><span class="lang-divider"></span><button class="lang-es" aria-label="Español">ES</button></span>
    </nav>
  </div>

  <nav id="mobile-menu" class="mobile-menu" aria-label="Primary">
    <a href="/about.php">About</a>
    <a href="#solutions">Solutions</a>
    <a href="#work">Work</a>
    <a href="#framework">FLAME</a>
    <a href="https://apps.rodrikconsulting.com/">Apps</a>
    <a href="/team.php">Team</a>
    <a href="#contact" class="btn">Contact</a>
    <span class="lang-switcher"><button class="lang-en active" aria-label="English">EN</button><span class="lang-divider"></span><button class="lang-es" aria-label="Español">ES</button></span>
  </nav>
</header>

<main class="container main">
<?php if (function_exists('msa_render_section')) msa_render_section(); ?>
 <section class="hero">
  <div>
    <p class="notice" style="margin:0 0 8px;color:var(--knicks-orange);font-weight:700;letter-spacing:.03em;text-transform:uppercase;" data-en="Leadership. Analytics. Ethics. Impact." data-es="Liderazgo. Analítica. Ética. Impacto.">Leadership. Analytics. Ethics. Impact.</p>
    <h1 data-en="Strategic Leadership, Data &amp; AI Advisory" data-es="Liderazgo Estratégico, Datos e Inteligencia Artificial">Strategic Leadership, Data &amp; AI Advisory</h1>

    <p class="lede" style="margin-top:18px;max-width:900px;">
      <span data-en="Most organizations don't struggle for lack of data or talent. They struggle because strategy, analytics, and leadership aren't pulling in the same direction. Rodrik Consulting helps you fix that." data-es="La mayoría de las organizaciones no lucha por falta de datos o talento. Lucha porque la estrategia, la analítica y el liderazgo no están alineados. Rodrik Consulting le ayuda a resolver eso.">Most organizations don't struggle for lack of data or talent. They struggle because strategy, analytics, and leadership aren't pulling in the same direction. Rodrik Consulting helps you fix that.</span>
    </p>

    <p style="margin-top:14px;max-width:900px;">
      <span data-en-html="Led by <strong>Dr. Oscar A. Rodriguez, DSL</strong> — 20+ years across Citigroup, TD Bank, Liberty Mutual, and the insurance sector — we help leaders see clearly, decide wisely, and execute with integrity." data-es-html="Liderado por <strong>Dr. Oscar A. Rodriguez, DSL</strong> — más de 20 años en Citigroup, TD Bank, Liberty Mutual y el sector de seguros — ayudamos a los líderes a ver con claridad, decidir con sabiduría y ejecutar con integridad.">Led by <strong>Dr. Oscar A. Rodriguez, DSL</strong> — 20+ years across Citigroup, TD Bank, Liberty Mutual, and the insurance sector — we help leaders see clearly, decide wisely, and execute with integrity.</span>
    </p>

    <div class="cta" style="margin-top:20px;">
      <a class="btn" href="#contact" data-en="Schedule a Strategy Session" data-es="Agendar una Sesión Estratégica">Schedule a Strategy Session</a>
      <a class="btn btn-outline" href="#work" data-en="View Case Studies" data-es="Ver Casos de Estudio">View Case Studies</a>
    </div>
  </div>
</section>

<section id="trusted-experience" class="section">
  <h2 class="reveal" data-en="Trusted Experience" data-es="Experiencia de Confianza">Trusted Experience</h2>
  <p class="section-lede reveal" style="color:var(--muted)"><span data-en="Executive credibility, technical depth, and leadership research brought together in one advisory practice." data-es="Credibilidad ejecutiva, profundidad técnica e investigación en liderazgo integradas en una práctica consultiva.">Executive credibility, technical depth, and leadership research brought together in one advisory practice.</span></p>

  <div class="grid cards">
    <article class="card reveal">
      <h3 data-en="20+ Years" data-es="Más de 20 Años">20+ Years</h3>
      <p data-en="Data, analytics, technology, operations, and leadership experience across complex organizations." data-es="Experiencia en datos, analítica, tecnología, operaciones y liderazgo en organizaciones complejas.">Data, analytics, technology, operations, and leadership experience across complex organizations.</p>
    </article>
    <article class="card reveal">
      <h3 data-en="Doctor of Strategic Leadership" data-es="Doctor en Liderazgo Estratégico">Doctor of Strategic Leadership</h3>
      <p data-en="Advanced research in leadership, governance, ethical decision-making, and organizational transformation." data-es="Investigación avanzada en liderazgo, gobernanza, toma de decisiones éticas y transformación organizacional.">Advanced research in leadership, governance, ethical decision-making, and organizational transformation.</p>
    </article>
    <article class="card reveal">
      <h3 data-en="Enterprise Background" data-es="Experiencia Empresarial">Enterprise Background</h3>
      <p data-en="Leadership experience connected to banking, insurance, technology, analytics, and digital transformation." data-es="Experiencia de liderazgo en banca, seguros, tecnología, analítica y transformación digital.">Leadership experience connected to banking, insurance, technology, analytics, and digital transformation.</p>
    </article>
    <article class="card reveal">
      <h3 data-en="Global Perspective" data-es="Perspectiva Global">Global Perspective</h3>
      <p data-en="Teaching, speaking, and advisory experience across the United States, Latin America, Europe, and Africa." data-es="Experiencia en docencia, conferencias y consultoría en Estados Unidos, América Latina, Europa y África.">Teaching, speaking, and advisory experience across the United States, Latin America, Europe, and Africa.</p>
    </article>
  </div>
</section>

<section id="philosophy" class="section">
  <h2 class="reveal" data-en="Our Philosophy" data-es="Nuestra Filosofía">Our Philosophy</h2>
  <p class="section-lede reveal" style="color:var(--muted)">
    <span data-en="Organizations do not need more noise. They need clarity, aligned leadership, and decisions that translate into measurable execution." data-es="Las organizaciones no necesitan más ruido. Necesitan claridad, liderazgo alineado y decisiones que se traduzcan en ejecución medible.">Organizations do not need more noise. They need clarity, aligned leadership, and decisions that translate into measurable execution.</span>
  </p>
  <div class="grid cards">
    <article class="card reveal">
      <h3 data-en="Honesty Over Comfort" data-es="Honestidad Sobre Comodidad">Honesty Over Comfort</h3>
      <p data-en="We provide clear, practical counsel rooted in truth, even when the right answer requires difficult decisions." data-es="Brindamos asesoría clara y práctica fundamentada en la verdad, incluso cuando la respuesta correcta requiere decisiones difíciles.">We provide clear, practical counsel rooted in truth, even when the right answer requires difficult decisions.</p>
    </article>
    <article class="card reveal">
      <h3 data-en="Insight Over Information" data-es="Perspectiva Sobre Información">Insight Over Information</h3>
      <p data-en="More data is not always the answer. We help leaders identify what matters, why it matters, and what to do next." data-es="Más datos no siempre es la respuesta. Ayudamos a los líderes a identificar qué importa, por qué importa y qué hacer a continuación.">More data is not always the answer. We help leaders identify what matters, why it matters, and what to do next.</p>
    </article>
    <article class="card reveal">
      <h3 data-en="Partnership Over Prescription" data-es="Colaboración Sobre Prescripción">Partnership Over Prescription</h3>
      <p data-en="Solutions last when leaders and stakeholders understand them, own them, and can sustain them after the engagement." data-es="Las soluciones perduran cuando los líderes y las partes interesadas las comprenden, las adoptan y pueden sostenerlas.">Solutions last when leaders and stakeholders understand them, own them, and can sustain them after the engagement.</p>
    </article>
  </div>
</section>

  <!-- SOLUTIONS -->
  <section id="solutions" class="section">
    <h2 class="reveal" data-en="Solutions" data-es="Soluciones">Solutions</h2>
    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="We help leaders connect strategy, data, governance, and execution so transformation becomes practical and measurable." data-es="Ayudamos a los líderes a conectar estrategia, datos, gobernanza y ejecución para que la transformación sea práctica y medible.">We help leaders connect strategy, data, governance, and execution so transformation becomes practical and measurable.</span></p>

    <div class="grid cards">
      <a class="card reveal" href="/strategic-leadership-consulting.php">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-3 6-3-3 6-3z"/></svg>
          </div>
          <h3 data-en="Leadership &amp; Strategy" data-es="Liderazgo y Estrategia">Leadership &amp; Strategy</h3>
        </div>
        <p data-en="Strategic planning, organizational assessment, change leadership, executive advisory, decision rights, operating cadence, and leadership alignment." data-es="Planificación estratégica, evaluación organizacional, liderazgo del cambio, asesoría ejecutiva, derechos de decisión, cadencia operativa y alineación de liderazgo.">Strategic planning, organizational assessment, change leadership, executive advisory, decision rights, operating cadence, and leadership alignment.</p>
        <div style="text-align:center;margin-top:8px"><span class="btn btn-outline">View Details</span></div>
      </a>

      <a class="card reveal" href="/bi-analytics.php">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
          </div>
          <h3 data-en="Data &amp; AI" data-es="Datos e IA">Data &amp; AI</h3>
        </div>
        <p data-en="Analytics strategy, KPI frameworks, data governance, AI governance, executive dashboards, and decision systems that turn information into action." data-es="Estrategia de analítica, marcos de KPI, gobernanza de datos, gobernanza de IA, tableros ejecutivos y sistemas de decisión que convierten información en acción.">Analytics strategy, KPI frameworks, data governance, AI governance, executive dashboards, and decision systems that turn information into action.</p>
        <div style="text-align:center;margin-top:8px"><span class="btn btn-outline">View Details</span></div>
      </a>

      <a class="card reveal" href="/cloud-data-engineering.php">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M7 10a5 5 0 0 1 9.58-1.65A4 4 0 1 1 19 16H8a4 4 0 1 1-.93-7.88"/><ellipse cx="12" cy="17.5" rx="5" ry="2.5"/></svg>
          </div>
          <h3 data-en="Digital Transformation" data-es="Transformación Digital">Digital Transformation</h3>
        </div>
        <p data-en="Process modernization, cloud data platforms, automation, operating model design, and emerging technology advisory built around business outcomes." data-es="Modernización de procesos, plataformas de datos en la nube, automatización, diseño de modelos operativos y asesoría en tecnología emergente orientada a resultados de negocio.">Process modernization, cloud data platforms, automation, operating model design, and emerging technology advisory built around business outcomes.</p>
        <div style="text-align:center;margin-top:8px"><span class="btn btn-outline">View Details</span></div>
      </a>
    </div>
  </section>

  <section id="approach" class="section">
    <h2 class="reveal" data-en="How We Help" data-es="Cómo Ayudamos">How We Help</h2>
    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="A simple engagement model designed to move from diagnosis to durable execution." data-es="Un modelo de compromiso diseñado para avanzar desde el diagnóstico hasta la ejecución duradera.">A simple engagement model designed to move from diagnosis to durable execution.</span></p>
    <div class="grid cards">
      <article class="card reveal"><h3 data-en="Assess" data-es="Evaluar">Assess</h3><p data-en="Clarify current state, leadership challenges, data maturity, operational gaps, and strategic priorities." data-es="Clarificar el estado actual, desafíos de liderazgo, madurez de datos, brechas operativas y prioridades estratégicas.">Clarify current state, leadership challenges, data maturity, operational gaps, and strategic priorities.</p></article>
      <article class="card reveal"><h3 data-en="Align" data-es="Alinear">Align</h3><p data-en="Connect business goals, stakeholders, decision rights, metrics, governance, and technology direction." data-es="Conectar objetivos de negocio, partes interesadas, derechos de decisión, métricas, gobernanza y dirección tecnológica.">Connect business goals, stakeholders, decision rights, metrics, governance, and technology direction.</p></article>
      <article class="card reveal"><h3 data-en="Execute" data-es="Ejecutar">Execute</h3><p data-en="Deliver practical roadmaps, dashboards, governance models, processes, and training that teams can use." data-es="Entregar hojas de ruta prácticas, tableros, modelos de gobernanza, procesos y capacitación que los equipos puedan utilizar.">Deliver practical roadmaps, dashboards, governance models, processes, and training that teams can use.</p></article>
      <article class="card reveal"><h3 data-en="Sustain" data-es="Sostener">Sustain</h3><p data-en="Build leadership rhythms, accountability structures, and capability so improvements continue after launch." data-es="Construir ritmos de liderazgo, estructuras de responsabilidad y capacidad para que las mejoras continúen después del lanzamiento.">Build leadership rhythms, accountability structures, and capability so improvements continue after launch.</p></article>
    </div>
  </section>

  <!-- APPLICATIONS -->
  <section id="applications" class="section">
    <h2 class="reveal" data-en="Explore What We're Building" data-es="Descubra Lo Que Estamos Construyendo">Explore What We're Building</h2>
    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="From AI-powered tools to innovative digital platforms, we're developing practical applications that bring ideas to life. Explore our projects and see how technology, data, and intelligent automation can create new possibilities." data-es="Desde herramientas impulsadas por IA hasta plataformas digitales innovadoras, desarrollamos aplicaciones prácticas que dan vida a las ideas. Explore nuestros proyectos y descubra cómo la tecnología, los datos y la automatización inteligente pueden crear nuevas posibilidades.">From AI-powered tools to innovative digital platforms, we're developing practical applications that bring ideas to life. Explore our projects and see how technology, data, and intelligent automation can create new possibilities.</span></p>

    <div class="apps-showcase reveal">
      <div class="apps-medallion" aria-hidden="true"></div>
      <div>
        <ul class="apps-list">
          <li><a href="https://apps.rodrikconsulting.com/#rodiq" style="--dot:#8f7bff"><strong>RodIQ</strong><span data-en="Personalized SAT &amp; ACT prep" data-es="Preparación personalizada SAT y ACT">Personalized SAT &amp; ACT prep</span></a></li>
          <li><a href="https://apps.rodrikconsulting.com/#flame" style="--dot:#ff7a3d"><strong>FLAME Decision Audit</strong><span data-en="AI-powered decision audits for leaders" data-es="Auditorías de decisiones con IA para líderes">AI-powered decision audits for leaders</span></a></li>
          <li><a href="https://apps.rodrikconsulting.com/#blocky" style="--dot:#FFC23D"><strong>Blocky Market</strong><span data-en="Call the next move: crypto, sports &amp; AI bots" data-es="Anticipe el próximo movimiento: cripto, deportes y bots de IA">Call the next move: crypto, sports &amp; AI bots</span></a></li>
          <li><a href="https://apps.rodrikconsulting.com/#fantasy-coach-live" style="--dot:#9b5cff"><strong>Fantasy Coach Live</strong><span data-en="Live coaching for fantasy football" data-es="Asesoría en vivo para fútbol americano de fantasía">Live coaching for fantasy football</span></a></li>
        </ul>
        <div class="apps-cta">
          <a class="btn" href="https://apps.rodrikconsulting.com/" data-en="Explore Our Applications" data-es="Explorar Nuestras Aplicaciones">Explore Our Applications</a>
          <span class="note" data-en="More on the way." data-es="Más en camino.">More on the way.</span>
        </div>
      </div>
    </div>
  </section>

  <!-- INTELLECTUAL PROPERTY -->
  <section id="framework" class="section">
    <h2 class="reveal" data-en="Our Framework &amp; Research" data-es="Nuestro Marco de Trabajo e Investigación">Our Framework &amp; Research</h2>
    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="Proprietary thinking tools that make our advisory work more rigorous — and more accountable." data-es="Herramientas de pensamiento propietarias que hacen nuestro trabajo de asesoría más riguroso y responsable.">Proprietary thinking tools that make our advisory work more rigorous — and more accountable.</span></p>

    <div class="grid cards" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <a class="card highlight reveal" href="https://flame.droscarrodriguez.com" target="_blank" rel="noopener">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 4 7 4 10c0 4 2.5 6.5 5 8 .5-2 1-3.5 1-3.5S11.5 16 12 19c.5-3 2-4.5 2-4.5 2.5-1.5 5-4 5-8 0-3-2.5-5-7-5z"/></svg>
          </div>
          <h3 data-en="The FLAME Framework" data-es="El Marco FLAME">The FLAME Framework</h3>
        </div>
        <p>A five-dimension AI governance model — Future, Leadership, Analytics, Morality, Ethics — that gives organizations a scored, auditable view of AI readiness. Not a checklist: a decision system built for executives.</p>
        <div style="text-align:center;margin-top:8px"><span class="btn btn-outline" data-en="Try the AI Audit Tool →" data-es="Probar la Herramienta de Auditoría →">Try the AI Audit Tool →</span></div>
      </a>

      <a class="card reveal" href="https://www.amazon.com/dp/B0F4W4V6QK" target="_blank" rel="noopener">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <h3 data-en="Leading With Machines" data-es="Liderando Con Máquinas">Leading With Machines</h3>
        </div>
        <p><em>How to Stay Human When AI Makes the Decisions</em> — published May 2026. A practical guide for leaders navigating AI adoption without surrendering judgment, accountability, or values. Available on Amazon.</p>
        <div style="text-align:center;margin-top:8px"><span class="btn btn-outline" data-en="Get the Book →" data-es="Obtener el Libro →">Get the Book →</span></div>
      </a>
    </div>
  </section>

  <!-- SELECTED WORK -->
  <section id="work" class="section">
    <h2 class="reveal" data-en="Selected Work" data-es="Trabajo Seleccionado">Selected Work</h2>

    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="Representative outcomes and case snippets." data-es="Resultados representativos y resúmenes de casos.">Representative outcomes and case snippets.</span></p>

    <div class="grid cards">
      <a class="card highlight work-feature reveal" href="/strategic-leadership-consulting.php#leadership-case">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true" title="Strategic Leadership">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-3 6-3-3 6-3z"/></svg>
          </div>
          <h3>Strategic Leadership Transformation</h3>
        </div>
        <p>Most organizations don’t struggle for lack of talent; they stall because vision, culture, and execution aren’t aligned. We establish clarity of purpose, translate it to measurable OKRs, and stand up the operating rhythm (reviews, retros, resets) that sustains progress. Decision rights (RAPID/RACI) and leadership pipelines turn strategy into a system leaders can run.</p>
        <ul class="notice" style="margin-left:18px">
          <li><strong>Before:</strong> siloed priorities, stalled execution after 3–6 months, reactive decision cycles, surprise market shifts.</li>
          <li><strong>After:</strong> OKRs tied to outcomes, clarified ownership across functions, quarterly foresight scans, cadence that protects momentum.</li>
        </ul>
        <p class="notice" style="margin-top:6px">See the full side-by-side case with metrics and method.</p>
        <div style="text-align:center;margin-top:6px"><span class="btn btn-outline">View Details</span></div>
      </a>
<!-- ===== Random Slideshow (excluded photos) ===== -->
<section class="section work-feature" id="field-slideshow" aria-label="From the field">
  <h2 class="reveal">From the Field</h2>
  <p class="section-lede reveal">A rotating snapshot from past sessions and events.</p>

  <figure class="randshot reveal">
    <div class="frame">
      <img id="randslide" alt="">
      <figcaption class="cap" id="randcap"></figcaption>
    </div>
  </figure>
<style>
  /* Scoped styles */
  #field-slideshow .randshot{
    margin:0; border:1px solid var(--stroke);
    border-radius:12px; overflow:hidden; box-shadow:var(--shadow);
  }

  /* Center the whole slideshow at 75% width */
  #field-slideshow .frame{
    position:relative;
    border:1px solid var(--stroke);
    border-radius:12px;
    overflow:hidden;
    box-shadow:var(--shadow);
    width:75%;
    margin:0 auto 16px;   /* centers it */
  }

  /* Image fills the centered frame */
  #field-slideshow img{
    width:100%;
    aspect-ratio:16/9;
    object-fit:cover;
    display:block;
    opacity:0;
    transition:opacity .6s ease;
  }
  #field-slideshow img.on{ opacity:1; }

  /* Caption pinned inside the frame (bottom-left) */
  #field-slideshow .cap{
    position:absolute;
    left:10px;            /* was 'center:10px' (invalid) */
    bottom:10px;
    font-size:12px;
    padding:6px 8px; color:var(--ink);
    background:rgba(11,15,23,.55);
    border:1px solid rgba(255,255,255,.08);
    border-radius:8px;
  }

  /* Phone: let it be full width */
  @media (max-width:900px){
    #field-slideshow .frame{ width:100%; }
  }
</style>

  <script>
    (function(){
      var shots = [
        {src:"/assets/photos/CLF1.jpg", cap:"Speaking session"},
        {src:"/assets/photos/CLF2.jpg", cap:"Speaking session"},
        {src:"/assets/photos/CLF3.jpg", cap:"Speaking session"},
        {src:"/assets/photos/CLF4.jpg", cap:"Speaking session"},
        {src:"/assets/photos/criptolatinfest1a.jpg", cap:"Colombia Speaker Panel"},
        {src:"/assets/photos/criptolatinfest2.jpg", cap:"Colombia Speaker Panel"},
        {src:"/assets/photos/criptolatinfest3.jpg", cap:"Colombia Speaker Panel"},
        {src:"/assets/photos/citi-team.jpg", cap:"BI Analytics"},
        {src:"/assets/photos/el-salvador-officials.jpg", cap:"El Salvador Government Advisory"},
        {src:"/assets/photos/meeting-workshop.jpg", cap:"Meeting Workshop"},
        {src:"/assets/photos/nft-nyc-panel.jpg", cap:"Conference setup"},
        {src:"/assets/photos/nft-nyc-selfie.jpg", cap:"Workshop Session"},
        {src:"/assets/photos/palm-judges.jpg", cap:"University Session"},
        {src:"/assets/photos/palm-speaker-2.jpg", cap:"From the stage"},
        {src:"/assets/photos/palm-speaker-3.jpg", cap:"Palm University of Ghana Students"},
        {src:"/assets/photos/team-stage.jpg", cap:"Speaking session"}
      ];

      var idx = Math.floor(Math.random() * shots.length);
      var img = document.getElementById('randslide');
      var cap = document.getElementById('randcap');

      function show(i){
        var s = shots[i]; if(!s || !img) return;
        img.classList.remove('on');
        var pre = new Image();
        pre.onload = function(){
          img.src = s.src; img.alt = s.cap || ""; if(cap) cap.textContent = s.cap || "";
          requestAnimationFrame(function(){ img.classList.add('on'); });
        };
        pre.onerror = function(){ setTimeout(next, 0); };
        pre.src = s.src;
      }
      function next(){ idx = (idx + 1) % shots.length; show(idx); }
      show(idx);
      setInterval(next, 5000);
    })();
  </script>
</section>
<!-- ===== /Random Slideshow ===== -->
      <a class="card reveal" href="/bi-analytics.php#case-kpi">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><path d="M5 13a7 7 0 0 1 14 0"/></svg>
          </div>
          <h3>Executive KPI Cockpit</h3>
        </div>
        <p>Unified data from seven core systems into a single executive view in Power BI. With weekly operational reviews anchored on a stable KPI set and drill-throughs, leadership reduced decision latency by 40% and cut meeting time by 35%. The cockpit standardized definitions, prevented metric drift, and enabled faster interventions.</p>
        <div style="text-align:center;"><span class="btn btn-outline">View Details</span></div>
      </a>

      <a class="card reveal" href="/digital-assets.php#case-prov">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 15l2 2 4-4"/></svg>
          </div>
          <h3>Digital Document Provenance</h3>
        </div>
        <p>Implemented a compliance-first asset registry with cryptographic hash anchoring for document authenticity and traceability. Audits accelerated by 60% as reviewers verified provenance instantly. The program nearly eliminated fraudulent claims and added chain-of-custody visibility across departments and vendors.</p>
        <div style="text-align:center;"><span class="btn btn-outline">View Details</span></div>
      </a>

      <a class="card reveal" href="/web-design.php#case-redesign">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/></svg>
          </div>
          <h3>Website Redesign for Conversion</h3>
        </div>
        <p>Rebuilt the site around a clear narrative and performance budget. Simplified architecture, strengthened call-to-action paths, and improved Core Web Vitals. Results: bounce rate down 28% and qualified leads up 2.1×, with brand coherence maintained across devices and regions.</p>
        <div style="text-align:center;"><span class="btn btn-outline">View Details</span></div>
      </a>
    </div>
  </section>

  <!-- REPRESENTATIVE OUTCOMES -->
  <section id="outcomes" class="section">
    <h2 class="reveal">Representative Outcomes</h2>
    <p class="section-lede reveal" style="color:var(--muted)">Patterns from across financial services, insurance, technology, and education engagements.</p>
    <div class="grid cards">
      <article class="tcard reveal">
        <div class="t-head"><h3>Executive Clarity</h3></div>
        <p>A leadership team running on competing priorities and reactive decision cycles realigned around a shared OKR structure, clarified decision rights, and a quarterly operating cadence — reducing leadership conflict and accelerating initiative throughput.</p>
      </article>
      <article class="tcard reveal">
        <div class="t-head"><h3>Analytics Modernization</h3></div>
        <p>A financial services organization replaced manual, error-prone reporting with governed Power BI dashboards tied to a stable KPI set. Weekly review time dropped by 35% and data credibility disputes — a chronic leadership distraction — were eliminated.</p>
      </article>
      <article class="tcard reveal">
        <div class="t-head"><h3>AI &amp; Data Governance</h3></div>
        <p>An insurance-sector client used the FLAME framework to audit AI readiness across five dimensions, identify governance gaps before deployment, and establish accountability structures that satisfied both executive and compliance stakeholders.</p>
      </article>
      <article class="tcard reveal">
        <div class="t-head"><h3>Sustainable Execution</h3></div>
        <p>A digital transformation initiative that had stalled twice was restructured with explicit ownership, a phased roadmap, and embedded training — enabling the client team to carry the work forward independently after the engagement closed.</p>
      </article>
    </div>
  </section>


  <!-- COMMUNITY -->
  <section id="community" class="section">
    <h2 class="reveal" data-en="Community Impact" data-es="Impacto Comunitario">Community Impact</h2>
    <div class="grid cards">
      <article class="card reveal">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 10l9-5 9 5-9 5-9-5z"/><path d="M7 12v5a5 5 0 0 0 10 0v-5"/></svg>
          </div>
          <h3 data-en="Palm University of Ghana Partnership" data-es="Asociación con la Universidad Palm de Ghana">Palm University of Ghana Partnership</h3>
        </div>
        <p>We proudly sponsor Palm University of Ghana, delivering blockchain, business, and leadership education through in-person lectures and Zoom workshops.</p>
      </article>

      <article class="card reveal">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M2 12h20"/><path d="M12 3a9 9 0 0 1 0 18c3-3 3-15 0-18z"/></svg>
          </div>
          <h3 data-en="Regent University Partnership" data-es="Asociación con la Universidad Regent">Regent University Partnership</h3>
        </div>
        <p>Dr. Rodriguez's doctoral alma mater, where the research behind the FLAME framework was first developed. An ongoing connection between practice and academic rigor in leadership, governance, and ethics.</p>
      </article>
    </div>
  </section>



  <!-- FEATURED IN -->
  <section id="featured-in" class="section">
    <h2 class="reveal" data-en="Featured In" data-es="Destacado En">Featured In</h2>
    <p class="section-lede reveal" style="color:var(--muted)">
      <span data-en="External recognition for our work at the intersection of AI governance, financial services, leadership, and responsible technology adoption." data-es="Reconocimiento externo por nuestro trabajo en la intersección de gobernanza de IA, servicios financieros, liderazgo y adopción responsable de tecnología.">External recognition for our work at the intersection of AI governance, financial services, leadership, and responsible technology adoption.</span>
    </p>

    <div class="featured-media-card reveal">
      <div class="featured-media-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <path d="M12 19v3"/>
          <path d="M8 22h8"/>
        </svg>
      </div>

      <div>
        <div class="featured-media-kicker">Emerj AI in Business Podcast</div>
        <h3>How Financial Services Leaders Operationalize Safe AI</h3>
        <p>
          Dr. Oscar A. Rodriguez joined the Emerj AI in Business Podcast to discuss how financial services leaders can operationalize responsible AI, establish governance models, and connect technology decisions to leadership accountability.
        </p>
        <a class="btn" href="https://emerj.com/podcast-episodes/how-financial-services-leaders-operationalize-safe-ai-with-dr-oscar-a-rodriguez-of-citi/" target="_blank" rel="noopener">
          Listen to the Episode
        </a>
      </div>
    </div>
  </section>

  <!-- WHAT CLIENTS SAY -->
  <section id="testimonials" class="section">
    <h2 class="reveal" data-en="What Clients Say" data-es="Lo Que Dicen los Clientes">What Clients Say</h2>
    <p class="section-lede reveal" style="color:var(--muted)"><span data-en="From colleagues, clients, and partners across financial services, technology, and global education." data-es="De colegas, clientes y socios en servicios financieros, tecnología y educación global.">From colleagues, clients, and partners across financial services, technology, and global education.</span></p>

    <div class="rc-carousel reveal" id="rc-carousel">
      <div class="rc-carousel-track" id="rc-track">

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">Oscar has a rare ability to translate complex technical challenges into business solutions that executives can act on. He doesn't just build dashboards — he helps leaders make better decisions.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Sarah Renee</div>
              <div class="rc-attr-title">Senior Developer @ SAS</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">Oscar was a pleasure to work with. He learned new systems quickly, communicated blockers with clarity, and always followed up. His engaging warmth put our business partners at ease.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Mary Schneider</div>
              <div class="rc-attr-title">Regulatory Business Data Specialist @ TD Bank</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">I'm honored to recommend Oscar Rodriguez, with whom I've had the opportunity to collaborate closely within our analytics organization. He consistently demonstrated a rare blend of technical depth, business acumen, and collaborative leadership that elevated every project he was involved with. Oscar excels at translating complex data into clear, actionable insights that drive decision-making. His ability to partner with business stakeholders, understand nuanced requirements, and design analytical solutions made him a trusted advisor across teams.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Marilyn Jolly</div>
              <div class="rc-attr-title">Senior Business Analyst @ TD Bank</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">During the short time I worked with Oscar, I found him to be extremely motivated, organized, and willing to go above and beyond. Oscar was able to make significant strides during difficult requests to work with the business partners, understand the requests, and make the effort to meet and exceed the business goals. It was a pleasure working with someone with the passion Oscar has to do a great job.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Al Leitao</div>
              <div class="rc-attr-title">Manager II, Business Analysis — Liberty Mutual Insurance</div>
              <div class="rc-attr-title" style="font-size:11px;opacity:.7;margin-top:3px;">Now: IT Computer Services Manager IV, State of New Hampshire</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">He possesses the rare combination of technical depth, business acumen, and leadership capability required to guide organizations through growth, innovation, and digital transformation.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Dr. Peter Carlos Okantey</div>
              <div class="rc-attr-title">Founder &amp; President, Palm University College — Ghana</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">I highly recommend Oscar for his exceptional leadership, analytical skills, and commitment to delivering meaningful business results. He has a proven ability to solve complex problems, communicate effectively with both technical and business stakeholders, and turn data into actionable insights that drive informed decisions. His professionalism, strategic mindset, and dedication make him a valuable asset to any team or organization.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Phil Hart</div>
              <div class="rc-attr-title">Lead Data Engineer @ TD Bank</div>
            </div>
          </div>
        </div>

        <div class="rc-slide">
          <div class="rc-tcard">
            <div class="rc-quote-mark">"</div>
            <p class="rc-quote-text">Oscar is a results-oriented leader who combines deep analytics knowledge with strong business acumen. Any organization looking to strengthen its data strategy, reporting capabilities, or decision-making processes would benefit from his expertise.</p>
            <div class="rc-attr">
              <div class="rc-attr-name">Vrutty Patel</div>
              <div class="rc-attr-title">Governance and Control Specialist @ TD Bank</div>
            </div>
          </div>
        </div>

      </div>
      <div class="rc-carousel-controls">
        <button class="rc-carousel-btn" id="rc-prev" aria-label="Previous">&#8592;</button>
        <div class="rc-carousel-dots" id="rc-dots"></div>
        <button class="rc-carousel-btn" id="rc-next" aria-label="Next">&#8594;</button>
      </div>
    </div>

    <!-- FEATURED TESTIMONIAL -->
    <div class="rc-featured-testimonial reveal">
      <div class="rc-featured-label" data-en="Featured Recommendation" data-es="Recomendación Destacada">Featured Recommendation</div>
      <div class="rc-featured-inner">
        <div class="rc-featured-quote-mark">"</div>
        <div class="rc-featured-body">
          <p>I have had the privilege of working with Dr. Oscar Rodriguez over several years through Palm University in Ghana, where he taught and mentored our students in the areas of business, leadership, analytics, and technology.</p>
          <p>What has consistently impressed me about Oscar is his ability to bridge the gap between technology and business strategy. Whether teaching in person on our campus or engaging remotely with participants, he has a unique gift for translating complex concepts into practical insights that leaders can immediately apply.</p>
          <p>Beyond his technical expertise, Oscar demonstrates a deep commitment to ethical leadership, professional excellence, and the development of others. His passion for helping people grow, combined with his knowledge of data, analytics, artificial intelligence, and organizational leadership, enables him to make a meaningful impact wherever he serves.</p>
          <p>Our students have benefited greatly from his insight, professionalism, and ability to challenge conventional thinking while preparing leaders for the opportunities and challenges of an increasingly digital world.</p>
          <p>I highly recommend Dr. Rodriguez to organizations seeking an executive advisor, technology strategist, leadership educator, or trusted consultant. He possesses the rare combination of technical depth, business acumen, and leadership capability required to guide organizations through growth, innovation, and digital transformation.</p>
          <p>Oscar is equally comfortable engaging with technical teams, executive leadership, and governing boards, making him a trusted partner for organizations seeking clarity, strategic direction, and lasting results.</p>
        </div>
      </div>
      <div class="rc-featured-attr">
        <div class="rc-featured-name">Dr. Peter Carlos Okantey</div>
        <div class="rc-featured-title">Founder &amp; President, Palm University College — Ghana</div>
        <div class="rc-featured-rel">Client · June 2026</div>
      </div>
    </div>

  </section>


  <!-- CONTACT -->
<section id="contact" class="section form">
  <h2 class="reveal" data-en="Schedule a Strategy Session" data-es="Agendar una Sesión Estratégica">Schedule a Strategy Session</h2>
  <p class="section-lede reveal" style="color:var(--muted)"><span data-en="Tell us what you're working on. We'll respond within one business day to explore whether there's a fit." data-es="Cuéntenos en qué está trabajando. Responderemos dentro de un día hábil para explorar si hay compatibilidad.">Tell us what you're working on. We'll respond within one business day to explore whether there's a fit.</span></p>

    <!-- ===== Signup Desk Banner (centered, shallow) ===== -->
<div id="signup-desk" class="reveal">
  <h2 class="reveal"></h2>
  <p class="section-lede reveal"></p>

  <figure class="randshot reveal" style="margin:0">
    <div class="frame" style="
      position:relative;
      border:1px solid var(--stroke);
      border-radius:12px;
      overflow:hidden;
      box-shadow:var(--shadow);
      max-width:480px;       /* keeps it nicely centered/narrow */
      margin:0 auto 16px;
    ">
      <img id="signupslide" alt="Sign-up desk" style="
        width:100%;
        aspect-ratio:21/9;   /* shallow banner */
        object-fit:cover;
        display:block;
        opacity:0;
        transition:opacity .6s ease;
      ">
      <figcaption id="signupcap" class="cap" style="
        position:absolute;
        left:10px; bottom:10px;
        font-size:12px;
        padding:6px 8px;
        color:var(--ink);
        background:rgba(11,15,23,.55);
        border:1px solid rgba(255,255,255,.08);
        border-radius:8px;
      "></figcaption>
    </div>
  </figure>
</div>

<script>
(function(){
  // Make it occupy a full row if you ever place it inside a grid
  var wrap = document.getElementById('signup-desk');
  if (wrap && wrap.parentElement && wrap.parentElement.classList.contains('grid')) {
    wrap.style.gridColumn = '1 / -1';
  }

  // Start with just the signup desk; add more later if you want it to rotate
  var shots = [
    { src: "/assets/photos/signup-desk.jpg", cap: "Sign-up desk" }
  ];

  var img = document.getElementById('signupslide');
  var cap = document.getElementById('signupcap');
  if (!img || !shots.length) return;

  var idx = 0;

  function show(i){
    var slide = shots[i]; if(!slide) return;
    img.style.opacity = '0';
    var pre = new Image();
    pre.onload = function(){
      img.src = slide.src;
      img.alt = slide.cap || "";
      if (cap) cap.textContent = slide.cap || "";
      requestAnimationFrame(function(){ img.style.opacity = '1'; });
    };
    pre.onerror = function(){ /* fail silently if path is wrong */ };
    pre.src = slide.src;
  }

  function next(){ idx = (idx + 1) % shots.length; show(idx); }

  show(idx);
  if (shots.length > 1) setInterval(next, 5000); // rotates only if you add more
})();
</script>
<!-- ===== /Signup Desk Banner ===== -->


  <form action="/contact.php" method="POST" novalidate class="reveal" autocomplete="on">
    <input type="hidden" name="form_name" value="rodrik-consulting-contact" />
    <input type="hidden" name="csrf" value="<?php echo htmlspecialchars($_SESSION['csrf'], ENT_QUOTES); ?>" />
    <!-- honeypot -->
    <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />

    <div class="fields">
      <label class="reveal">
        <span data-en="Name" data-es="Nombre">Name</span>
        <input type="text" name="name" required>
      </label>

      <label class="reveal">
        <span data-en="Email" data-es="Correo electrónico">Email</span>
        <input type="email" name="email" required>
      </label>

      <label class="full reveal">
        <span data-en="Message" data-es="Mensaje">Message</span>
        <textarea name="message" rows="6" required></textarea>
      </label>

      <label class="full reveal">
        <span>Robot check: <strong><?php echo $a; ?> + <?php echo $b; ?> = ?</strong></span>
        <input type="text" name="captcha" inputmode="numeric" pattern="[0-9]*" required>
      </label>
    </div>

    <button class="btn reveal" type="submit" data-en="Send" data-es="Enviar">Send</button>
    <p class="section-lede reveal" style="font-size:12px;color:var(--muted)">
      <span data-en="We will email you a copy of your message." data-es="Le enviaremos una copia de su mensaje por correo electrónico.">We will email you a copy of your message.</span>
    </p>
  </form>
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
      <a href="/about.php">About</a>
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
    // Keep CSS var in sync with actual header height
    function setHeaderVars(){
      var hdr = document.querySelector('.site-header');
      if(!hdr) return;
      var h = hdr.offsetHeight || 72;
      document.documentElement.style.setProperty('--header-h', h + 'px');
    }
    window.addEventListener('load', setHeaderVars);
    window.addEventListener('resize', setHeaderVars);
  })();
</script>

<script>
/* Reveal-on-scroll observer */
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
      if (entry.isIntersecting){
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function(el){ io.observe(el); });
})();

/* Testimonials carousel */
(function(){
  var track = document.getElementById('rc-track');
  if(!track) return;
  var slides = track.querySelectorAll('.rc-slide');
  var dotsEl = document.getElementById('rc-dots');
  var total = slides.length;
  var current = 0;
  var timer;

  slides.forEach(function(_, i){
    var d = document.createElement('button');
    d.className = 'rc-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Testimonial ' + (i+1));
    d.addEventListener('click', function(){ goTo(i); reset(); });
    dotsEl.appendChild(d);
  });

  function goTo(n){
    current = (n + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dotsEl.querySelectorAll('.rc-dot').forEach(function(d, i){
      d.classList.toggle('active', i === current);
    });
  }

  function reset(){
    clearInterval(timer);
    timer = setInterval(function(){ goTo(current + 1); }, 6000);
  }

  document.getElementById('rc-prev').addEventListener('click', function(){ goTo(current - 1); reset(); });
  document.getElementById('rc-next').addEventListener('click', function(){ goTo(current + 1); reset(); });
  track.addEventListener('mouseenter', function(){ clearInterval(timer); });
  track.addEventListener('mouseleave', reset);
  reset();
})();
</script>

<script src="/assets/script.js?v=<?= filemtime($_SERVER['DOCUMENT_ROOT'] . '/assets/script.js') ?>"></script>
<script src="/assets/lang.js?v=1"></script>
</body>
</html>
