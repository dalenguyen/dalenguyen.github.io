import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

const VIRTUAL_ID = 'virtual:learn-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const NAV_HTML = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>
#learn-app-nav{position:sticky;top:0;z-index:9999;background:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;padding:0 24px;height:64px;gap:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
#learn-app-nav .nav-logo{flex-shrink:0;margin-right:12px;display:flex;align-items:center;}
#learn-app-nav .nav-logo img{width:32px;height:32px;border-radius:50%;}
#learn-app-nav a{display:flex;align-items:center;gap:4px;padding:8px 12px;border-radius:6px;color:#cbd5e1;text-decoration:none;font-size:14px;font-weight:500;transition:background .15s,color .15s;}
#learn-app-nav a:hover{background:#334155;color:#fff;}
#learn-app-nav .material-icons{font-size:18px;}
@media(max-width:640px){#learn-app-nav a .nav-label{display:none;}}
</style>
<nav id="learn-app-nav">
  <a href="/" class="nav-logo"><img src="/assets/images/dale-nguyen-avatar.webp" alt="Dale Nguyen"></a>
  <a href="/blog"><span class="material-icons">edit</span><span class="nav-label">Thoughts</span></a>
  <a href="/learn"><span class="material-icons">menu_book</span><span class="nav-label">Learning</span></a>
  <a href="/#portfolio"><span class="material-icons">grid_view</span><span class="nav-label">Digital Portfolio</span></a>
  <a href="/bucket-list"><span class="material-icons">checklist</span><span class="nav-label">Bucket List</span></a>
  <a href="/#about"><span class="material-icons">person</span><span class="nav-label">Biography</span></a>
  <a href="/#contact"><span class="material-icons">email</span><span class="nav-label">Contact</span></a>
</nav>`

// Keyboard-accessibility enhancement injected into every learn page. The
// generated accordion headers are <div>s (class `section-header` or
// `section-head`), so this gives them button semantics (role + tabindex),
// Enter/Space activation, an aria-expanded state synced to the section's
// open/active class, and a visible focus ring. One place fixes all current and
// future learn pages without editing the generated HTML.
const A11Y_ADDON = `<!-- learn-a11y-start -->
<style>.section-header:focus-visible,.section-head:focus-visible{outline:2px solid #818cf8;outline-offset:2px;border-radius:8px;}</style>
<script>
(function () {
  function isOpen(h) {
    for (var n = h; n && n !== document.body; n = n.parentElement) {
      if (n.classList && (n.classList.contains('open') || n.classList.contains('active'))) return true;
    }
    return false;
  }
  function enhance() {
    document.querySelectorAll('.section-header, .section-head').forEach(function (h) {
      if (h.dataset.a11yEnhanced) return;
      h.dataset.a11yEnhanced = '1';
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-expanded', String(isOpen(h)));
      h.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); h.click(); }
      });
      h.addEventListener('click', function () {
        setTimeout(function () { h.setAttribute('aria-expanded', String(isOpen(h))); }, 0);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
})();
</script>
<!-- learn-a11y-end -->`

// Inline email capture + share row injected near the end of every learn
// page. Mirrors the blog-post footer
// (apps/blog-app/src/app/routes/blog/[slug].ts): the inline email field sits
// above the existing share row, both forms POST to /api/v1/subscribe, and
// the modal (see EMAIL_CAPTURE_HTML below) prompts on first visit. The same
// localStorage flag (`learn-email-capture.dismissed.v1`) suppresses the
// modal after a dismiss so it never reopens for that browser.
//
// Styled with each page's own `:root` custom properties (--surface /
// --surface2, --border, --accent, --text, --muted) so it picks up the
// page's theme instead of introducing new tokens. Same fallbacks as the
// share row for pages that don't define every token.
const EMAIL_INLINE_HTML = `<!-- learn-email-inline-start -->
<style>
#learn-email-inline{max-width:920px;margin:48px auto 0;padding:0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
#learn-email-inline .learn-email-card{border:1px solid var(--border);background:var(--surface, #1e1e26);border-radius:16px;padding:24px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;}
#learn-email-inline h3{margin:0 0 4px;font-size:18px;font-weight:600;color:var(--text, #e5e7eb);}
#learn-email-inline p.learn-email-sub{margin:0;font-size:14px;color:var(--muted, #9696b0);}
#learn-email-inline form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex:1 1 280px;justify-content:flex-end;}
#learn-email-inline input[type="email"]{flex:1 1 220px;min-width:0;padding:9px 13px;border-radius:8px;border:1px solid var(--border);background:var(--surface2, #22222e);color:var(--text, #e5e7eb);font-size:14px;font-family:inherit;}
#learn-email-inline input[type="email"]:focus{outline:2px solid var(--accent);outline-offset:2px;border-color:var(--accent);}
#learn-email-inline input[type="email"]::placeholder{color:var(--muted, #9696b0);}
#learn-email-inline button{padding:9px 18px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:filter .15s,transform .05s;}
#learn-email-inline button:hover:not(:disabled){filter:brightness(0.92);}
#learn-email-inline button:active:not(:disabled){transform:translateY(1px);}
#learn-email-inline button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
#learn-email-inline button:disabled{opacity:.6;cursor:not-allowed;}
#learn-email-inline .learn-email-status{margin-top:12px;font-size:13px;color:var(--muted, #9696b0);}
#learn-email-inline .learn-email-status.is-success{color:var(--accent);}
#learn-email-inline .learn-email-status.is-error{color:#f87171;}
@media(max-width:640px){#learn-email-inline .learn-email-card{flex-direction:column;align-items:stretch;}#learn-email-inline form{justify-content:stretch;}}
</style>
<section id="learn-email-inline" aria-label="Subscribe for updates" data-email-capture-source="inline">
  <div class="learn-email-card">
    <div style="flex:1 1 220px;min-width:0;">
      <h3>Get new posts in your inbox</h3>
      <p class="learn-email-sub">No spam — just new posts and learning pages when they ship.</p>
    </div>
    <form data-email-form>
      <label class="sr-only" for="learn-email-inline-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">Email address</label>
      <input id="learn-email-inline-input" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" />
      <button type="submit" data-submit-label>Subscribe</button>
    </form>
  </div>
  <p class="learn-email-status" data-email-status role="status" aria-live="polite" hidden></p>
</section>
<!-- learn-email-inline-end -->`

// Email capture modal — opens on first visit, suppresses itself on dismiss
// via localStorage. Browser-only (learn pages aren't SSR'd, so no platform
// guard is needed).
const EMAIL_MODAL_HTML = `<!-- learn-email-modal-start -->
<style>
#learn-email-modal-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;}
#learn-email-modal-panel{position:relative;width:100%;max-width:440px;background:var(--surface, #1e1e26);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text, #e5e7eb);}
#learn-email-modal-panel h2{margin:0 0 8px;font-size:20px;font-weight:700;color:var(--text, #e5e7eb);}
#learn-email-modal-panel p.learn-email-sub{margin:0 0 20px;font-size:14px;color:var(--muted, #9696b0);}
#learn-email-modal-panel input[type="email"]{width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface2, #22222e);color:var(--text, #e5e7eb);font-size:14px;font-family:inherit;box-sizing:border-box;}
#learn-email-modal-panel input[type="email"]:focus{outline:2px solid var(--accent);outline-offset:2px;border-color:var(--accent);}
#learn-email-modal-panel input[type="email"]::placeholder{color:var(--muted, #9696b0);}
#learn-email-modal-panel button.primary{padding:10px 18px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;width:100%;margin-top:12px;transition:filter .15s;}
#learn-email-modal-panel button.primary:hover:not(:disabled){filter:brightness(0.92);}
#learn-email-modal-panel button.primary:disabled{opacity:.6;cursor:not-allowed;}
#learn-email-modal-panel .learn-email-status{font-size:13px;color:#f87171;margin-top:8px;}
#learn-email-modal-panel .learn-email-status.is-success{color:var(--accent);}
#learn-email-modal-panel .learn-email-fineprint{margin-top:12px;font-size:12px;color:var(--muted, #9696b0);}
#learn-email-modal-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:transparent;color:var(--muted, #9696b0);cursor:pointer;border-radius:8px;display:flex;align-items:center;justify-content:center;}
#learn-email-modal-close:hover{background:var(--surface2, #22222e);color:var(--text, #e5e7eb);}
#learn-email-modal-close:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
#learn-email-modal-panel[data-state="success"] .learn-email-form{display:none;}
#learn-email-modal-panel .learn-email-success{display:none;color:var(--text, #e5e7eb);font-size:14px;}
#learn-email-modal-panel[data-state="success"] .learn-email-success{display:block;}
#learn-email-modal-panel[data-state="success"] .learn-email-fineprint{display:none;}
</style>
<div id="learn-email-modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="learn-email-modal-title">
  <div id="learn-email-modal-panel" data-state="idle">
    <button type="button" id="learn-email-modal-close" aria-label="Close subscribe dialog">
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <h2 id="learn-email-modal-title">Stay in the loop?</h2>
    <p class="learn-email-sub">Drop your email and I will send new posts and learning pages your way.</p>
    <form class="learn-email-form" data-email-form>
      <label class="sr-only" for="learn-email-modal-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">Email address</label>
      <input id="learn-email-modal-input" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" />
      <button type="submit" class="primary" data-submit-label>Subscribe</button>
      <p class="learn-email-status" data-email-status role="alert" aria-live="assertive"></p>
    </form>
    <div class="learn-email-success" role="status" aria-live="polite">
      <p style="margin:0 0 12px;color:var(--accent);font-weight:600;">Thanks — you are subscribed.</p>
      <p style="margin:0;color:var(--muted, #9696b0);font-size:14px;">You can close this dialog now.</p>
      <button type="button" class="primary" data-modal-close>Close</button>
    </div>
    <p class="learn-email-fineprint">We will only email you when there is something new. Unsubscribe any time.</p>
  </div>
</div>
<!-- learn-email-modal-end -->`

// Shared client-side wiring for the inline email field and the modal. Both
// submit to /api/v1/subscribe, share the same DOM helpers, and the modal
// persists a dismissal flag in localStorage so it never reopens for the same
// browser. Kept inline (rather than a separate .js asset) so the plugin can
// inject a self-contained block per page with no extra HTTP request.
const EMAIL_CAPTURE_JS = `<script>
(function () {
  var DISMISS_KEY = 'learn-email-capture.dismissed.v1';
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  function setStatus(node, message, kind) {
    if (!node) return;
    if (!message) { node.hidden = true; node.textContent = ''; node.className = 'learn-email-status'; return; }
    node.hidden = false;
    node.textContent = message;
    node.className = 'learn-email-status' + (kind ? ' is-' + kind : '');
  }

  function submitForm(form, source) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('[data-submit-label]');
    var status = form.parentNode.querySelector('[data-email-status]') || form.querySelector('[data-email-status]');
    if (!input || !button) return Promise.resolve({ ok: false });
    var email = (input.value || '').trim();
    if (!email) {
      setStatus(status, 'Please enter your email address.', 'error');
      input.focus();
      return Promise.resolve({ ok: false });
    }
    button.disabled = true;
    var originalLabel = button.textContent;
    button.textContent = 'Subscribing…';
    setStatus(status, '', null);
    return fetch('/api/v1/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, source: source })
    }).then(function (res) {
      return res.json().catch(function () { return {}); }).then(function (body) {
        if (res.ok && body && body.ok) {
          setStatus(status, 'Thanks — you are subscribed.', 'success');
          input.value = '';
          if (form.classList.contains('learn-email-form')) {
            // Modal form — flip the panel to success state.
            var panel = document.getElementById('learn-email-modal-panel');
            if (panel) panel.setAttribute('data-state', 'success');
          }
          return { ok: true };
        }
        setStatus(status, (body && body.error) || 'Something went wrong. Please try again.', 'error');
        return { ok: false };
      });
    }).catch(function () {
      setStatus(status, 'Something went wrong. Please try again.', 'error');
      return { ok: false };
    }).then(function (result) {
      button.disabled = false;
      button.textContent = originalLabel;
      return result;
    });
  }

  function init() {
    // Wire up every [data-email-form] on the page (inline + modal).
    document.querySelectorAll('[data-email-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var source = form.closest('[data-email-capture-source]')?.getAttribute('data-email-capture-source') || 'learn';
        submitForm(form, source);
      });
    });

    // Modal open/close wiring. Open once unless the reader already
    // dismissed in a previous visit.
    var backdrop = document.getElementById('learn-email-modal-backdrop');
    if (backdrop) {
      var closeBtn = document.getElementById('learn-email-modal-close');
      var dismiss = function () {
        backdrop.hidden = true;
        backdrop.setAttribute('aria-hidden', 'true');
        safeSet(DISMISS_KEY, '1');
      };
      if (closeBtn) closeBtn.addEventListener('click', dismiss);
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) dismiss();
      });
      document.addEventListener('keydown', function (e) {
        if (!backdrop.hidden && (e.key === 'Escape' || e.key === 'Esc')) dismiss();
      });
      // The success state's "Close" button is rendered after data flips, so
      // delegate clicks on [data-modal-close].
      backdrop.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.matches && t.matches('[data-modal-close]')) dismiss();
      });
      if (!safeGet(DISMISS_KEY)) {
        // Defer one frame so the page paints first.
        requestAnimationFrame(function () {
          backdrop.hidden = false;
          backdrop.removeAttribute('aria-hidden');
          var input = document.getElementById('learn-email-modal-input');
          if (input) input.focus();
        });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>`

// Share row injected near the end of every learn page. Mirrors the blog-post
// share row (apps/blog-app/src/app/routes/blog/[slug].ts): four intent links
// (X / LinkedIn / Reddit / Hacker News) + a copy-link button. Reads title and
// canonical URL directly from `document.title` and `window.location.href` at
// click time — learn pages aren't SSR'd, so no platform guard is needed.
// Styled with each page's own `:root` custom properties (--surface/--surface2,
// --border, --accent, --text, --muted) so it picks up the page's theme instead
// of introducing new tokens. --muted/--surface2 carry a literal fallback (the
// values used by most pages) since one outlier
// (turboquant-vector-quantization.html) names its tokens differently
// (--text-secondary/--bg-tertiary) and doesn't define them at all. Wrapped in
// `<!-- learn-share-start/end -->` so the same regex cleanup used for nav/a11y
// strips any previous injection on dev re-requests.
const SHARE_HTML = `<!-- learn-share-start -->
<style>
#learn-share-row{max-width:920px;margin:48px auto 0;padding:24px 24px 8px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
#learn-share-row .learn-share-label{font-size:13px;font-weight:600;color:var(--muted, #9696b0);margin-right:4px;letter-spacing:.04em;text-transform:uppercase;}
#learn-share-row .learn-share-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;border:1px solid var(--border);background:var(--surface2, #22222e);color:var(--muted, #9696b0);font-size:13px;font-weight:500;font-family:inherit;text-decoration:none;cursor:pointer;transition:color .15s,border-color .15s,background .15s,transform .05s;}
#learn-share-row .learn-share-btn:hover{color:var(--accent);border-color:var(--accent);background:rgba(94,106,210,.08);}
#learn-share-row .learn-share-btn:active{transform:translateY(1px);}
#learn-share-row .learn-share-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
#learn-share-row .learn-share-btn svg{width:14px;height:14px;flex-shrink:0;}
</style>
<div id="learn-share-row" aria-label="Share this learning page">
  <span class="learn-share-label">Share</span>
  <a class="learn-share-btn" data-share="x" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.244 2H21l-6.52 7.453L22 22h-6.797l-5.32-6.957L3.8 22H1l7.02-8.025L1.5 2h6.957l4.81 6.36L18.244 2Zm-2.39 18.4h1.884L7.236 3.5H5.215L15.854 20.4Z"/></svg>
    <span>X</span>
  </a>
  <a class="learn-share-btn" data-share="linkedin" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4V9Z"/></svg>
    <span>LinkedIn</span>
  </a>
  <a class="learn-share-btn" data-share="reddit" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M22 12.07a2.2 2.2 0 0 0-3.73-1.57c-1.4-.95-3.27-1.55-5.32-1.62l1.02-4.8 3.33.7a1.55 1.55 0 1 0 .16-1.04l-3.74-.79a.5.5 0 0 0-.59.38l-1.14 5.36c-2.08.06-3.97.66-5.39 1.62A2.2 2.2 0 1 0 4.2 14.5c-.04.22-.06.45-.06.69 0 3.1 3.52 5.6 7.86 5.6 4.34 0 7.86-2.5 7.86-5.6 0-.24-.02-.47-.06-.7A2.2 2.2 0 0 0 22 12.07Zm-13.4 2.43a1.55 1.55 0 1 1 3.1 0 1.55 1.55 0 0 1-3.1 0Zm7.76 3.66c-.95.95-2.78 1.02-3.36 1.02s-2.41-.07-3.36-1.02a.43.43 0 0 1 .6-.6c.56.55 1.75.76 2.76.76s2.2-.2 2.76-.76a.43.43 0 0 1 .6.6Zm-.26-2.11a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1Z"/></svg>
    <span>Reddit</span>
  </a>
  <a class="learn-share-btn" data-share="hn" target="_blank" rel="noopener noreferrer" aria-label="Share on Hacker News">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 3h18v18H3V3Zm10.2 12.4 3.05-4.93h-1.86l-1.66 2.97-1.57-2.97h-1.94l3.05 4.93v3.38h.93v-3.38Zm-5.95-6.84h-1.07l4.36 6.53v3.69h.93v-3.69l4.36-6.53h-1.07l-3.75 5.77-3.76-5.77Z"/></svg>
    <span>Hacker News</span>
  </a>
  <button type="button" class="learn-share-btn" data-share="copy" aria-label="Copy link to clipboard">
    <svg data-share-icon="default" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>
    <svg data-share-icon="copied" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M20 6 9 17l-5-5"/></svg>
    <span data-share-label>Copy link</span>
  </button>
</div>
<script>
(function () {
  function shareUrl(network, url, title) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);
    switch (network) {
      case 'x':       return 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
      case 'linkedin':return 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;
      case 'reddit':  return 'https://www.reddit.com/submit?url=' + u + '&title=' + t;
      case 'hn':      return 'https://news.ycombinator.com/submitlink?u=' + u + '&t=' + t;
    }
    return '';
  }
  function init() {
    var row = document.getElementById('learn-share-row');
    if (!row) return;
    var currentUrl = window.location.href;
    var currentTitle = document.title;

    row.querySelectorAll('[data-share]').forEach(function (el) {
      var network = el.getAttribute('data-share');
      if (network === 'copy') {
        el.addEventListener('click', function () {
          var labelEl = el.querySelector('[data-share-label]');
          var defaultIcon = el.querySelector('[data-share-icon="default"]');
          var copiedIcon = el.querySelector('[data-share-icon="copied"]');
          function fallbackCopy(text) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
          }
          var done = function () {
            if (labelEl) labelEl.textContent = 'Copied!';
            if (defaultIcon) defaultIcon.style.display = 'none';
            if (copiedIcon) copiedIcon.style.display = '';
            el.setAttribute('aria-label', 'Link copied to clipboard');
            setTimeout(function () {
              if (labelEl) labelEl.textContent = 'Copy link';
              if (defaultIcon) defaultIcon.style.display = '';
              if (copiedIcon) copiedIcon.style.display = 'none';
              el.setAttribute('aria-label', 'Copy link to clipboard');
            }, 2000);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentUrl).then(done, function () {
              fallbackCopy(currentUrl);
              done();
            });
          } else {
            fallbackCopy(currentUrl);
            done();
          }
        });
      } else {
        el.setAttribute('href', shareUrl(network, currentUrl, currentTitle));
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
<!-- learn-share-end -->`

function injectNav(html: string): string {
  // Remove any previously injected nav/a11y/share/email blocks to avoid
  // duplicates (dev re-injection / repeated closeBundle runs).
  const cleaned = html
    .replace(/<link[^>]+Material\+Icons[^>]*>\s*<style>\s*#learn-app-nav[\s\S]*?<\/nav>/m, '')
    .replace(/<!-- learn-a11y-start -->[\s\S]*?<!-- learn-a11y-end -->/m, '')
    .replace(/<!-- learn-share-start -->[\s\S]*?<!-- learn-share-end -->/m, '')
    .replace(/<!-- learn-email-inline-start -->[\s\S]*?<!-- learn-email-inline-end -->/m, '')
    .replace(/<!-- learn-email-modal-start -->[\s\S]*?<!-- learn-email-modal-end -->/m, '')
  // Order at end of body (top-down):
  //   1. Inline email capture field (above the share row)
  //   2. Share row (existing)
  //   3. Modal HTML (rendered hidden until JS opens it on first visit)
  //   4. Email capture JS (wired last so it can find the above nodes)
  //   5. Share row JS (existing)
  const footer = `${EMAIL_INLINE_HTML}\n${SHARE_HTML}\n${EMAIL_MODAL_HTML}\n${EMAIL_CAPTURE_JS}`
  // Nav + a11y go right after <body> (top of page). Footer (inline + share +
  // modal + scripts) goes right before </body> — learn pages have no
  // comments section, so bottom-of-page is the equivalent slot to "after
  // the post, before comments" on the blog.
  return cleaned
    .replace('<body>', `<body>\n${NAV_HTML}\n${A11Y_ADDON}`)
    .replace('</body>', `${footer}\n</body>`)
}

function scanLearnDir(dir: string) {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.html'))
  } catch {
    return []
  }
  return files.map((file) => {
    const html = readFileSync(join(dir, file), 'utf-8')
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? file
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content="([^"]+)"/i)?.[1]?.trim() ??
      html.match(/<meta[^>]+name=["']description["'][^>]+content='([^']+)'/i)?.[1]?.trim() ?? ''
    const date =
      html.match(/<meta[^>]+name=["']date["'][^>]+content="([^"]+)"/i)?.[1]?.trim() ??
      html.match(/<meta[^>]+name=["']date["'][^>]+content='([^']+)'/i)?.[1]?.trim() ?? ''
    const timestamp =
      html.match(/<meta[^>]+name=["']timestamp["'][^>]+content="([^"]+)"/i)?.[1]?.trim() ??
      html.match(/<meta[^>]+name=["']timestamp["'][^>]+content='([^']+)'/i)?.[1]?.trim() ?? ''
    return { title, description, date, timestamp, url: `/learn/${file}` }
  })
}

export function learnManifestPlugin(learnDir: string): Plugin {
  let config: ResolvedConfig

  return {
    name: 'learn-manifest',

    configResolved(resolved) {
      config = resolved
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      return `export const learnPages = ${JSON.stringify(scanLearnDir(learnDir))};`
    },

    // Dev: intercept /learn/*.html requests and inject nav
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/learn\/([^?#]+\.html)$/)
        if (!match) return next()
        const filePath = join(learnDir, match[1])
        if (!existsSync(filePath)) return next()
        const html = readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(injectNav(html))
      })
    },

    // Build: transform the copied HTML files in the output directory
    closeBundle() {
      if (config?.command !== 'build') return
      const outLearnDir = join(config.root, config.build.outDir, 'learn')
      if (!existsSync(outLearnDir)) return
      for (const file of readdirSync(outLearnDir).filter((f) => f.endsWith('.html'))) {
        const filePath = join(outLearnDir, file)
        writeFileSync(filePath, injectNav(readFileSync(filePath, 'utf-8')))
      }
    },
  }
}