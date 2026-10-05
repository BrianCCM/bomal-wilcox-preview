/* ============================================================
   BOMAL landing pages: shared behaviour.

   1. Speaker message-match.  ?s=givens swaps the hero portrait,
      name and role to the speaker whose ad was clicked.
   2. Urgency.  One date constant drives the strip; it flips
      itself over once early-bird closes. No edit needed.
   3. UTM passthrough.  Ad tracking survives the handoff to
      register.bomal.org.
   ============================================================ */

/* ---- 1. CONFIGURE THE DEADLINE HERE AND NOWHERE ELSE ---- */
var EARLY_BIRD_END = '2026-10-10T23:59:59-06:00';

var REGISTER_URL = 'https://register.bomal.org/';

/* Portraits supplied by bomal.org. Add a speaker here and the swap
   picks them up on every page at once. `quote` is intentionally
   empty: no words are put in a speaker's mouth until BOMAL supplies
   them. See content-gaps.md. */
var SPEAKERS = {
  givens:  { name: 'Terryl Givens',       role: 'Senior Research Fellow, Neal A. Maxwell Institute', img: 'givens.webp',  quote: '' },
  welch:   { name: 'Rosalynde F. Welch',  role: 'Associate Director, Neal A. Maxwell Institute',     img: 'welch.webp',   quote: '' },
  wilcox:  { name: 'Bradley R. Wilcox',   role: 'Professor of Ancient Scripture, BYU',               img: 'wilcox.webp',  quote: '' },
  rane:    { name: 'Walter Rane',         role: 'Painter, honored Saturday afternoon',               img: 'rane.webp',    quote: '' },
  pelo:    { name: 'Brad Pelo',           role: 'President, The Chosen',                             img: 'pelo.webp',    quote: '' },
  johnson: { name: 'Jane Clayson Johnson',role: 'Journalist and author',                             img: 'johnson.webp', quote: '' }
};

(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var assetBase = document.documentElement.getAttribute('data-asset-base') || 'brand_assets/';

  /* ---------- 1. Speaker message-match ----------
     Two separate questions. Which speaker does the page show, and did the
     visitor actually arrive from that speaker's ad? A page can carry a default
     speaker (data-default-speaker) so it is never generic, but the
     "you followed X here" copy must only appear for a real ad click. */
  var has = function (k) { return !!k && Object.prototype.hasOwnProperty.call(SPEAKERS, k); };

  var urlKey = (params.get('s') || params.get('speaker') || '').toLowerCase().trim();
  var defKey = (document.documentElement.getAttribute('data-default-speaker') || '').toLowerCase().trim();

  /* A dedicated page is the destination of one speaker's ad, so every visitor
     did arrive from that ad whether or not the URL still carries ?s=. On a
     shared page, only an explicit ?s= counts. */
  var dedicated = document.documentElement.hasAttribute('data-speaker-dedicated');

  var key = has(urlKey) ? urlKey : (has(defKey) ? defKey : '');
  var fromAd = has(urlKey) || (dedicated && has(defKey));
  var speaker = key ? SPEAKERS[key] : null;

  if (speaker) {
    document.querySelectorAll('[data-sp="name"]').forEach(function (el) { el.textContent = speaker.name; });
    document.querySelectorAll('[data-sp="role"]').forEach(function (el) { el.textContent = speaker.role; });
    document.querySelectorAll('[data-sp="img"]').forEach(function (el) {
      el.src = assetBase + 'speakers/' + speaker.img;
      el.alt = speaker.name;
    });
    /* Whoever is in the hero must not also appear in the lineup grid below,
       default speaker included. */
    document.querySelectorAll('[data-lineup="' + key + '"]').forEach(function (el) { el.hidden = true; });
  }

  /* Only a real ad click earns the "you followed X here" copy. */
  if (fromAd) {
    document.querySelectorAll('[data-sp-only]').forEach(function (el) { el.hidden = false; });
    document.querySelectorAll('[data-sp-none]').forEach(function (el) { el.hidden = true; });
  }

  /* ---------- 2. Urgency ---------- */
  var deadline = new Date(EARLY_BIRD_END);
  var live = !isNaN(deadline) && deadline.getTime() > Date.now();

  function remaining() {
    var ms = deadline.getTime() - Date.now();
    if (ms <= 0) return null;
    var d = Math.floor(ms / 864e5);
    var h = Math.floor((ms % 864e5) / 36e5);
    if (d >= 1) return d + (d === 1 ? ' day ' : ' days ') + h + (h === 1 ? ' hour' : ' hours');
    var m = Math.floor((ms % 36e5) / 6e4);
    return h + (h === 1 ? ' hour ' : ' hours ') + m + (m === 1 ? ' minute' : ' minutes');
  }

  function paintUrgency() {
    var left = live ? remaining() : null;
    if (left) {
      document.querySelectorAll('[data-urgency]').forEach(function (el) {
        el.innerHTML = 'Early-bird pricing ends in <b>' + left + '</b>. Register now for <b>$25</b> instead of $30.';
      });
      document.querySelectorAll('[data-price-now]').forEach(function (el) { el.textContent = '$25'; });
      document.querySelectorAll('[data-price-was]').forEach(function (el) { el.hidden = false; });
      document.querySelectorAll('[data-price-note]').forEach(function (el) {
        el.textContent = 'Early-bird price, through October 10.';
      });
    } else {
      live = false;
      document.querySelectorAll('[data-urgency]').forEach(function (el) {
        el.innerHTML = '<b>November 6 and 7</b> at the Provo Marriott. The banquet and the box lunch are already sold out.';
      });
      document.querySelectorAll('[data-price-now]').forEach(function (el) { el.textContent = '$30'; });
      document.querySelectorAll('[data-price-was]').forEach(function (el) { el.hidden = true; });
      document.querySelectorAll('[data-price-note]').forEach(function (el) {
        el.textContent = 'Full registration, both days.';
      });
    }
  }
  paintUrgency();
  if (live) setInterval(paintUrgency, 60000);

  /* ---------- 3. UTM passthrough ---------- */
  var carry = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','ttclid'];
  var pass = new URLSearchParams();
  carry.forEach(function (k) { if (params.get(k)) pass.set(k, params.get(k)); });
  if (fromAd && key) pass.set('utm_content', pass.get('utm_content') || key);

  var qs = pass.toString();
  document.querySelectorAll('[data-register]').forEach(function (el) {
    el.setAttribute('href', REGISTER_URL + (qs ? '?' + qs : ''));
  });

  /* ---------- FAQ disclosure, where a page has one ---------- */
  document.querySelectorAll('[data-faq] button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.hidden = open;
    });
  });
})();
