/* anyways. site script. Source: brands/anyways/website/builder/assets/site.js. Plain JS, no libraries. */
(function () {
  'use strict';
  /* ---------- attribution: first touch (utm / click ids / landing page) kept for the session's forms ---------- */
  var ATTR_KEY = 'aw_attr';
  var attr = (function () {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(ATTR_KEY) || 'null'); } catch (x) {}
    var q = new URLSearchParams(location.search), now = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach(function (k) { if (q.get(k)) now[k] = q.get(k).slice(0, 150); });
    var paid = !!(now.utm_source || now.fbclid || now.gclid);
    var fresh = saved && saved.t && Date.now() - saved.t < 30 * 864e5;
    if (fresh && !paid) return saved;            // keep the first touch for 30 days, unless a new ad click comes in
    var ext = document.referrer && document.referrer.indexOf(location.host) < 0;
    now.landing = location.pathname; now.ref = ext ? document.referrer.slice(0, 200) : ''; now.t = Date.now();
    try { localStorage.setItem(ATTR_KEY, JSON.stringify(now)); } catch (x) {}
    return now;
  })();
  var attrFields = function () {
    var a = attr || {};
    return { utm_source: a.utm_source || '', utm_medium: a.utm_medium || '', utm_campaign: a.utm_campaign || '',
      utm_content: a.utm_content || '', utm_term: a.utm_term || '', click: a.fbclid ? 'fbclid' : a.gclid ? 'gclid' : '',
      clid: a.fbclid || a.gclid || '', landing: a.landing || '', ref: a.ref || '' };
  };
  var newEventId = function () { return 'aw' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  /* fire the same event to the Meta Pixel and GA4 when they're on the page (ids set in builder/build.py) */
  var track = function (name, eventId, extra) {
    try { if (window.fbq) window.fbq('track', name, extra || {}, { eventID: eventId }); } catch (x) {}
    try { if (window.gtag) window.gtag('event', name === 'Lead' ? 'generate_lead' : name === 'Schedule' ? 'book_call' : name, extra || {}); } catch (x) {}
  };
  var post = function (endpoint, fields) {
    var body = new URLSearchParams(fields), a = attrFields();
    for (var k in a) body.set(k, a[k]);
    try { fetch(endpoint, { method: 'POST', mode: 'no-cors', body: body }); } catch (x) {}
  };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var nav = document.querySelector('.nav'), mb = document.querySelector('.menu-btn');
  if (nav && mb) {
    mb.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-links a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- hero: dot field + glow that follows the pointer (drifts on its own when idle) ---------- */
  var hero = document.querySelector('.hero'), cv = hero && hero.querySelector('canvas'), word = hero && hero.querySelector('.wordmark');
  if (hero && cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, dots = [], tgt = null, last = -1e9, cur = null, running = true;
    var layout = function () {
      var r = hero.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var g = W < 700 ? 24 : 30; dots = [];
      for (var y = g / 2; y < H; y += g) for (var x = g / 2; x < W; x += g) dots.push({ x: x, y: y, ox: 0, oy: 0 });
    };
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); tgt = { x: e.clientX - r.left, y: e.clientY - r.top }; last = performance.now();
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { running = es[0].isIntersecting; }).observe(hero);
    var frame = function (t) {
      requestAnimationFrame(frame);
      if (!running || !dots.length) return;
      var auto = { x: W * (0.5 + 0.28 * Math.sin(t / 2300)), y: H * (0.42 + 0.14 * Math.sin(t / 1700)) };
      var g = (!tgt || t - last > 2500 || reduce) ? auto : tgt;
      if (!cur) cur = { x: g.x, y: g.y };
      var k = reduce ? 1 : 0.09; cur.x += (g.x - cur.x) * k; cur.y += (g.y - cur.y) * k;
      hero.style.setProperty('--fx', cur.x + 'px'); hero.style.setProperty('--fy', cur.y + 'px');
      if (word) {
        var hr = hero.getBoundingClientRect(), wr = word.getBoundingClientRect();
        word.style.setProperty('--tx', (cur.x - (wr.left - hr.left)) + 'px');
        word.style.setProperty('--ty', (cur.y - (wr.top - hr.top)) + 'px');
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var R = Math.min(240, W * 0.35);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i], dx = d.x - cur.x, dy = d.y - cur.y, dist = Math.sqrt(dx * dx + dy * dy);
        var tx = 0, ty = 0, a = 0.12, rad = 1.1, red = 0;
        if (dist < R) { var f = 1 - dist / R, e2 = f * f, push = e2 * 24; tx = dist ? dx / dist * push : 0; ty = dist ? dy / dist * push : 0; a = 0.12 + e2 * 0.7; rad = 1.1 + e2 * 1.7; red = e2; }
        d.ox += (tx - d.ox) * 0.14; d.oy += (ty - d.oy) * 0.14;
        ctx.fillStyle = 'rgba(' + Math.round(250 - 18 * red) + ',' + Math.round(250 - 200 * red) + ',' + Math.round(249 - 206 * red) + ',' + a + ')';
        ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, rad, 0, 6.2832); ctx.fill();
      }
    };
    layout(); window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    requestAnimationFrame(frame);
  }

  /* ---------- audit form: 3 questions + details, posts to the same Apps Script as before ---------- */
  var form = document.getElementById('audit-form');
  if (form) {
    var QS = JSON.parse(form.getAttribute('data-qs')), ENDPOINT = form.getAttribute('data-endpoint');
    var step = 0, ans = {}, total = QS.length + 1;
    var bar = form.querySelector('.bar i'), inner = form.querySelector('.inner');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var render = function (focus) {
      bar.style.width = Math.min(100, (step / total) * 100 + (step < total ? 100 / total / 2 : 0)) + '%';
      var h = '';
      if (step < QS.length) {
        var q = QS[step];
        h += '<p class="label step-label">Step ' + (step + 1) + ' of ' + total + ' · ' + esc(q.label) + '</p><h3>' + esc(q.q) + '</h3><div class="opts">';
        q.opts.forEach(function (o) { h += '<button type="button" class="opt" aria-pressed="' + (ans[q.key] === o) + '" data-v="' + esc(o) + '">' + esc(o) + '</button>'; });
        h += '</div>';
        if (step > 0) h += '<div class="nav-row"><button type="button" class="back">← Back</button></div>';
      } else if (step === QS.length) {
        h += '<p class="label step-label">Step ' + total + ' of ' + total + ' · Your details</p><h3>Where should we send your audit?</h3>' +
          '<div class="fields"><label>Your name<input name="name" autocomplete="name" required></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
          '<label>Website or Instagram (optional)<input name="site" autocomplete="url"></label>' +
          '<label class="hp" aria-hidden="true">Company URL<input name="company_url" tabindex="-1" autocomplete="off"></label></div>' +
          '<p class="err" hidden>Please add an email we can reply to.</p>' +
          '<div class="nav-row"><button type="button" class="back">← Back</button><button type="submit" class="btn btn-red">Send me the audit →</button></div>';
      } else {
        h += '<div class="done"><p class="label step-label">Done</p><h3>Got it. Anyways<span class="dot">.</span></h3><p>You\'ll hear from Wessel within 24 hours with a straight answer and a first plan.</p><p style="margin-top:18px"><a class="btn btn-ink" href="#talk">Skip the wait: book a 30-minute call →</a></p></div>';
      }
      inner.innerHTML = h;
      if (focus) { var f = inner.querySelector('h3'); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } }
    };
    inner.addEventListener('click', function (e) {
      var o = e.target.closest('.opt');
      if (o) { ans[QS[step].key] = o.getAttribute('data-v'); render(); setTimeout(function () { step++; render(true); }, 180); return; }
      if (e.target.closest('.back')) { step = Math.max(0, step - 1); render(true); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { var i = form.querySelector('[name=' + n + ']'); return i ? i.value.trim() : ''; };
      var email = v('email');
      if (!/^\S+@\S+\.\S+$/.test(email)) { form.querySelector('.err').hidden = false; return; }
      var eid = newEventId();
      post(ENDPOINT, { name: v('name'), email: email, site: v('site'), problem: ans.problem || '', biz: ans.biz || '', budget: ans.budget || '',
        page: location.href, form: 'audit', event_id: eid, company_url: v('company_url') });
      if (!v('company_url')) track('Lead', eid, { content_name: 'Free audit' });
      step = QS.length + 1; render(true);
    });
    render();
  }

  /* ---------- Cal.com: inline calendar. Home loads it after the first scroll/tap, once the box is near ---------- */
  var calStarted = false;
  var mountCal = function (el) {
    var link = el.getAttribute('data-cal');
    if (!calStarted) {
      calStarted = true;
      (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      window.Cal('init', 'aw', { origin: 'https://cal.com' });
      window.Cal.ns.aw('ui', { theme: 'dark', layout: 'month_view', cssVarsPerTheme: { dark: { 'cal-brand': '#E8322B' } } });
      window.Cal.ns.aw('on', { action: 'bookingSuccessful', callback: function () { track('Schedule', newEventId(), { content_name: '30-minute call' }); } });
    }
    el.innerHTML = '';
    window.Cal.ns.aw('inline', { elementOrSelector: '#' + el.id, calLink: link, config: { layout: 'month_view', theme: 'dark' } });
  };
  var cal = document.getElementById('aw-cal');
  if (cal) {
    var evs = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'wheel'];
    var go = function () {
      evs.forEach(function (e) { window.removeEventListener(e, go); });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); mountCal(cal); } }, { rootMargin: '600px 0px' });
        io.observe(cal);
      } else mountCal(cal);
    };
    evs.forEach(function (e) { window.addEventListener(e, go, { passive: true }); });
  }

  /* ---------- funnel check: 10 questions -> score out of 100, areas, top leaks; email is optional ---------- */
  var fc = document.getElementById('funnel-check');
  if (fc) {
    var D = JSON.parse(fc.getAttribute('data-fc')), FQ = D.qs, FEND = fc.getAttribute('data-endpoint');
    var fi = 0, fa = [], fbar = fc.querySelector('.bar i'), fin = fc.querySelector('.inner'), sent = false;
    var e2 = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var score = function () { return fa.reduce(function (t, x) { return t + x; }, 0); };
    var grade = function (n) {
      if (n >= 80) return ['Strong', 'A few leaks to plug, but the machine works. Small fixes here pay back fast.'];
      if (n >= 50) return ['Leaking', "Customers are getting in and slipping out. You're paying for people you lose."];
      return ['Broken', 'Money goes in and too little comes out. The upside: these are the easiest fixes to make.'];
    };
    var leaks = function () {
      return FQ.map(function (q, i) { return { i: i, lost: 10 - fa[i] }; }).filter(function (x) { return x.lost > 0; })
        .sort(function (a, b) { return b.lost - a.lost || a.i - b.i; }).slice(0, 3);
    };
    var focusH = function () { var f = fin.querySelector('h3,h2'); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } };
    var top = function () { var r = fc.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - 90, behavior: reduce ? 'auto' : 'smooth' }); };
    var draw = function (focus) {
      var h = '';
      if (fi < FQ.length) {
        var q = FQ[fi];
        fbar.style.width = ((fi + 0.5) / FQ.length * 100) + '%';
        h += '<p class="label step-label">Question ' + (fi + 1) + ' of ' + FQ.length + ' · ' + e2(q.a) + '</p><h3>' + e2(q.q) + '</h3><div class="opts">';
        q.o.forEach(function (o, k) { h += '<button type="button" class="opt" data-k="' + k + '" aria-pressed="' + (fa[fi] === o[1] && fa.length > fi) + '">' + e2(o[0]) + '</button>'; });
        h += '</div>';
        if (fi > 0) h += '<div class="nav-row"><button type="button" class="back">← Back</button></div>';
      } else {
        fbar.style.width = '100%';
        var n = score(), g = grade(n), by = {};
        D.areas.forEach(function (a) { by[a] = [0, 0]; });
        FQ.forEach(function (q, i) { by[q.a][0] += fa[i]; by[q.a][1] += 10; });
        h += '<div class="fc-result"><div class="fc-score"><span class="num">' + n + '</span><span class="of">/100</span></div>' +
          '<div><p class="label step-label">Your funnel score</p><h3>' + g[0] + '<span class="dot">.</span></h3><p>' + g[1] + '</p></div></div>';
        h += '<ul class="fc-bars">';
        D.areas.forEach(function (a) { var pc = Math.round(by[a][0] / by[a][1] * 100); h += '<li><span>' + e2(a) + '</span><i><b style="width:' + pc + '%"></b></i><em>' + pc + '%</em></li>'; });
        h += '</ul>';
        var L = leaks();
        if (L.length) {
          h += '<div class="fc-leaks"><p class="label step-label">Your biggest leaks, in order</p><ol>';
          L.forEach(function (x) { h += '<li><b>' + e2(FQ[x.i].a) + '.</b> ' + e2(FQ[x.i].fix) + '</li>'; });
          h += '</ol></div>';
        }
        if (!sent) {
          h += '<form class="fc-get" novalidate><p class="label step-label">Want a person to check it?</p><h3>Get your 3 fixes from Wessel, free.</h3>' +
            '<p>He looks at your actual website, ads and tracking, and sends the three fixes that would make you the most money, within 24 hours.</p>' +
            '<div class="fields"><label>Your name<input name="name" autocomplete="name" required></label>' +
            '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
            '<label>Website<input name="site" autocomplete="url" placeholder="yourbrand.co.za"></label>' +
            '<label class="hp" aria-hidden="true">Company URL<input name="company_url" tabindex="-1" autocomplete="off"></label></div>' +
            '<p class="err" hidden>Please add an email we can reply to.</p>' +
            '<div class="nav-row"><button type="button" class="back redo">Start again</button><button type="submit" class="btn btn-red">Send me my 3 fixes →</button></div></form>';
        } else {
          h += '<div class="fc-booked"><p class="label step-label">Sent</p><h3>Got it. Anyways<span class="dot">.</span></h3>' +
            '<p>Your 3 fixes are on the way within 24 hours. Want to go through them live? Pick a time for a free 30-minute call.</p>' +
            '<div class="cal-box" id="fc-cal" data-cal="' + e2(fc.getAttribute('data-cal')) + '"></div></div>';
        }
      }
      fin.innerHTML = h;
      if (sent && fi >= FQ.length) { var cb = document.getElementById('fc-cal'); if (cb) mountCal(cb); }
      if (focus) focusH();
    };
    fin.addEventListener('click', function (e) {
      var o = e.target.closest('.opt');
      if (o) { fa[fi] = FQ[fi].o[+o.getAttribute('data-k')][1]; fa.length = fi + 1; [].forEach.call(fin.querySelectorAll('.opt'), function (b) { b.setAttribute('aria-pressed', b === o); }); setTimeout(function () { fi++; draw(true); if (fi >= FQ.length) top(); }, 180); return; }
      if (e.target.closest('.redo')) { fi = 0; fa = []; draw(true); top(); return; }
      if (e.target.closest('.back')) { fi = Math.max(0, fi - 1); draw(true); }
    });
    fin.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, v = function (n) { var i = f.querySelector('[name=' + n + ']'); return i ? i.value.trim() : ''; };
      if (!/^\S+@\S+\.\S+$/.test(v('email'))) { f.querySelector('.err').hidden = false; return; }
      var n = score(), L = leaks().map(function (x) { return FQ[x.i].a; });
      var detail = FQ.map(function (q, i) { return q.a + ' ' + fa[i]; }).join(', ');
      var eid = newEventId();
      post(FEND, { name: v('name'), email: v('email'), site: v('site'),
        problem: 'Funnel check ' + n + '/100 (' + grade(n)[0] + '). Leaks: ' + L.join(', ') + '. Answers: ' + detail,
        biz: 'Funnel check', budget: '', page: location.href, form: 'funnel-check', score: String(n), event_id: eid, company_url: v('company_url') });
      if (!v('company_url')) track('Lead', eid, { content_name: 'Funnel check', value: n });
      sent = true; draw(true); top();
    });
    draw();
  }

  /* ---------- sticky mobile button: shows after the hero, hides at the form ---------- */
  var mbar = document.querySelector('.mbar'), audit = document.getElementById('audit');
  if (mbar && hero && 'IntersectionObserver' in window) {
    var heroOn = true, auditOn = false;
    var upd = function () { mbar.classList.toggle('on', !heroOn && !auditOn); };
    new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; upd(); }).observe(hero);
    if (audit) new IntersectionObserver(function (es) { auditOn = es[0].isIntersecting; upd(); }).observe(audit);
  }
})();
