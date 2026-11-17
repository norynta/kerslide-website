/* Kerslide site analytics (PostHog). Cookieless and anonymous: a random id lives in sessionStorage only (gone when the
   tab closes), no cookies, no local storage, no fingerprinting. Honors Do Not Track. Tiny on purpose (no SDK). */
(function () {
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var KEY = 'phc_wEUxRVQa93MbnxvrA78bd2KpZ9RGVqESJ8Xeete9NPTE';
    var URL_ = 'https://us.i.posthog.com/batch/';
    var id;
    try { id = sessionStorage.getItem('ks_id'); if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); sessionStorage.setItem('ks_id', id); } }
    catch (e) { id = String(Math.random()).slice(2) + Date.now(); }
    var start = Date.now(), queue = [], timer = null, errors = 0;
    var q = new URLSearchParams(location.search);
    function base() {
      var p = { app: 'kerslide', surface: 'website', $current_url: location.href, $pathname: location.pathname, $host: location.host,
        $referrer: document.referrer || '', $screen_width: screen.width, $screen_height: screen.height, $lib: 'kerslide-web',
        lang: document.documentElement.lang || '', $process_person_profile: false };
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach(function (k) { if (q.get(k)) p[k] = q.get(k).slice(0, 80); });
      return p;
    }
    function cap(name, props) {
      var p = base(); for (var k in props) p[k] = props[k];
      queue.push({ event: name, distinct_id: id, timestamp: new Date().toISOString(), properties: p });
      if (!timer) timer = setTimeout(flush, 2000);
    }
    function flush() {
      timer = null; if (!queue.length) return;
      var body = JSON.stringify({ api_key: KEY, batch: queue.splice(0, 50) });
      try { if (navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
      try { fetch(URL_, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
    }
    cap('$pageview', {});
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null; if (!a || !a.href) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.pathname.indexOf('/play') === 0 && u.host === location.host) cap('play_click', { from: location.pathname });
      else if (u.host !== location.host) cap('outbound_click', { to: u.host, to_path: u.pathname.slice(0, 80) });
    }, true);
    window.addEventListener('error', function (e) {
      if (errors++ > 5) return;
      cap('$exception', { error_msg: String(e.message || '').slice(0, 200), error_where: String((e.filename || '').split('/').pop()) + ':' + e.lineno });
    });
    window.addEventListener('unhandledrejection', function (e) {
      if (errors++ > 5) return;
      cap('$exception', { error_msg: String((e.reason && e.reason.message) || e.reason || '').slice(0, 200), error_where: 'promise' });
    });
    var maxScroll = 0;
    window.addEventListener('scroll', function () {
      var h = document.documentElement; var s = Math.round(((window.scrollY + innerHeight) / Math.max(h.scrollHeight, 1)) * 100);
      if (s > maxScroll) maxScroll = s;
    }, { passive: true });
    var left = false;
    function leave() { if (left) return; left = true; cap('$pageleave', { seconds: Math.round((Date.now() - start) / 1000), scroll_pct: maxScroll }); flush(); }
    addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { leave(); left = false; start = Date.now(); } });
  } catch (e) {}
})();
