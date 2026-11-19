/* ---------- shared UI helpers, shell, routing, events ---------- */
const store = (() => { try { const t = '__qb'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; } catch (e) { const m = {}; return { getItem: k => m[k] || null, setItem: (k, v) => { m[k] = v; } }; } })();
const C = createCore(store);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const aed = n => n == null ? '—' : 'AED ' + Number(n).toFixed(2).replace(/\.00$/, '');
const pct = n => n == null ? '—' : n + '%';
const timeOf = ts => C.hm(C.parts(ts).min);
const dayTime = ts => { const p = C.parts(ts); return C.DAYS[p.day] + ' ' + C.hm(p.min); };
const ago = ts => { const m = Math.round((C.now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m <= 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

const I = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  store: '<path d="M4 10h16v10H4zM3 10l2-6h14l2 6M9 20v-5h6v5"/>',
  spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 3v4M17 5h4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  diet: '<path d="M12 21c-5-3-8-7-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4-3 8-8 11z"/>',
  bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  box: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M12 4v16"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-15-1 9-6 15-15 15zM5 19l7-7"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
  map: '<path d="M9 4l6 2 5-2v16l-5 2-6-2-5 2V6zM9 4v16M15 6v16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  cart: '<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
};
const ic = (n, fill) => '<svg viewBox="0 0 24 24" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>';
// QuickBite mark: a bold "Q" with a bite taken out of the top right, crumbs and a teal tail
const LOGO = '<svg class="qm" viewBox="0 0 44 44" aria-hidden="true"><path d="M33.6 18.6A13 13 0 1 1 24.4 9.4" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="34" cy="8.5" r="2.3" fill="#0d9488"/><circle cx="38.8" cy="13.4" r="1.6" fill="#0d9488"/><path d="M26 28l10.5 10.5" stroke="#0d9488" stroke-width="7" stroke-linecap="round"/></svg>';
const WORDMARK = '<span class="sr">QuickBite</span>' + LOGO + '<span aria-hidden="true">uickBite</span>';

// illustrated plates (generic food illustrations, drawn here)
function art(cat, color, big) {
  const c = color || '#0d9488';
  const plate = (big ? '' : '<rect width="100" height="100" fill="' + c + '22"/>') + '<circle cx="50" cy="56" r="34" fill="#fff" opacity=".9"/><circle cx="50" cy="56" r="27" fill="' + c + '18"/>';
  const f = {
    bowl: '<path d="M24 52h52a26 22 0 0 1-52 0z" fill="#f8fafc" stroke="' + c + '" stroke-width="3"/><circle cx="40" cy="48" r="7" fill="#f59e0b"/><circle cx="54" cy="45" r="6" fill="#22c55e"/><circle cx="62" cy="50" r="5" fill="#ef4444"/><path d="M30 50q20-10 40 0" stroke="#fde68a" stroke-width="5" fill="none"/>',
    wrap: '<path d="M28 66l30-34 14 12-30 34z" fill="#fcd9a8" stroke="#d97706" stroke-width="2.5"/><path d="M58 32l14 12-6 3-11-11z" fill="#22c55e"/><circle cx="60" cy="40" r="3" fill="#ef4444"/>',
    salad: '<circle cx="50" cy="56" r="22" fill="#f8fafc" stroke="' + c + '" stroke-width="3"/><circle cx="42" cy="52" r="8" fill="#4ade80"/><circle cx="56" cy="50" r="8" fill="#22c55e"/><circle cx="52" cy="62" r="6" fill="#ef4444"/><circle cx="41" cy="63" r="4" fill="#fde047"/>',
    pizza: '<circle cx="50" cy="56" r="24" fill="#f59e0b"/><circle cx="50" cy="56" r="20" fill="#fbbf24"/><circle cx="42" cy="50" r="4" fill="#dc2626"/><circle cx="57" cy="52" r="4" fill="#dc2626"/><circle cx="50" cy="64" r="4" fill="#dc2626"/><path d="M50 56L50 32M50 56L71 66M50 56L29 66" stroke="#b45309" stroke-width="1.5"/>',
    sandwich: '<path d="M26 58l24-22 24 22z" fill="#fcd34d" stroke="#b45309" stroke-width="2.5"/><path d="M28 60h44v6H28z" fill="#22c55e"/><path d="M28 66h44v7H28z" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>',
    drink: '<path d="M38 34h24l-3 40H41z" fill="#f8fafc" stroke="' + c + '" stroke-width="3"/><path d="M40 46h20l-2 26H42z" fill="#a16207" opacity=".75"/><path d="M52 34l6-12" stroke="' + c + '" stroke-width="3"/>',
    pastry: '<path d="M28 62q22-34 44 0q-22 10-44 0z" fill="#f59e0b" stroke="#b45309" stroke-width="2.5"/><path d="M40 52l4 10M50 47v14M60 52l-4 10" stroke="#b45309" stroke-width="2"/>',
  }[cat] || '';
  return '<div class="art' + (big ? ' lg' : '') + '"' + (big ? ' style="--tint:' + c + '22"' : '') + '><svg viewBox="0 0 100 100" preserveAspectRatio="' + (big ? 'xMidYMid meet' : 'xMidYMid slice') + '" role="img" aria-label="' + esc(cat) + ' illustration">' + plate + f + '</svg></div>';
}
function pseudoQR(token) { // visual only — not a scannable QR code
  let h = 0; for (const ch of token) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; };
  let s = ''; const N = 21;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    let on = f ? ((x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6) || ((x % 14) >= 2 && (x % 14) <= 4 && (y % 14) >= 2 && (y % 14) <= 4)) : r() > .52;
    if (f && ((x > 13 ? x - 14 : x) === 6 || (y > 13 ? y - 14 : y) === 6) && !((x > 13 ? x - 14 : x) === 6 && (y > 13 ? y - 14 : y) <= 6) && false) on = false;
    if (on) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
  }
  return '<svg class="qr" viewBox="0 0 21 21" shape-rendering="crispEdges" role="img" aria-label="Collection code ' + esc(token) + '"><g fill="#0f2a43">' + s + '</g></svg>';
}
const STATUS = { submitted: ['Submitted', 'n'], accepted: ['Accepted', 'g'], preparing: ['Preparing', 'a'], ready: ['Ready', 'g'], collected: ['Collected', 'n'], completed: ['Completed', ''], rejected: ['Rejected', 'r'], cancelled: ['Cancelled', 'r'], no_show: ['Not collected', 'r'] };
const stChip = s => '<span class="chip ' + (STATUS[s] || ['', ''])[1] + '">' + esc((STATUS[s] || [s])[0]) + '</span>';
const payChip = p => '<span class="chip x">' + esc({ sim_authorised: 'Payment held', sim_captured: 'Paid', sim_voided: 'Voided' }[p] || p) + '</span>';
const lvlChip = l => '<span class="chip ' + ({ short: 'g', moderate: 'y', busy: 'r', closed: 'x' }[l]) + '">' + ({ short: 'Not busy', moderate: 'Moderate', busy: 'Busy', closed: 'Closed' }[l]) + '</span>';
function outletRating(id) { const S = C.S; const r = S.reviews.filter(x => x.outletId === id).map(x => x.rating).concat(S.history.filter(h => h.outletId === id && h.rating).map(h => h.rating)); return r.length ? { avg: Math.round(r.reduce((a, b) => a + b, 0) / r.length * 10) / 10, n: r.length } : null; }
const stars = r => r ? '<span class="nowrap">' + '★ ' + r.avg + ' <span class="muted small">(' + r.n + ')</span></span>' : '<span class="muted small">No ratings yet</span>';

/* ---------- theme ---------- */
function curTheme() { const t = document.documentElement.dataset.theme; if (t) return t; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
function applyTheme(t) { document.documentElement.dataset.theme = t; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0c1517' : '#0f2a43'; try { localStorage.setItem('qb-theme', t); } catch (e) { } }
(function () { let t = null; try { t = localStorage.getItem('qb-theme'); } catch (e) { } if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; })();
function themeBtn() { const d = curTheme() === 'dark'; return '<button class="ib" data-a="theme" aria-label="Switch to ' + (d ? 'light' : 'dark') + ' theme" title="' + (d ? 'Light' : 'Dark') + ' theme">' + ic(d ? 'sun' : 'moon') + '</button>'; }

/* ---------- app state ---------- */
const APP = {
  mode: 'landing',
  sf: {
    main: { id: 'main', user: 's1', route: 'dashboard', p: {} },
  },
};
const STU_NAV = [['dashboard', 'Dashboard', 'home'], ['marketplace', 'Marketplace', 'store'], ['ai', 'AI Picks', 'spark'], ['schedule', 'Class Schedule', 'cal'], ['orders', 'Orders', 'bag'], ['sustain', 'Sustainability', 'leaf'], ['rewards', 'Rewards', 'gift'], ['profile', 'Profile', 'user']];
const RES_NAV = [['rdash', 'Dashboard', 'home'], ['rorders', 'Live Orders', 'list'], ['rqueue', 'Queue', 'clock'], ['rmenu', 'Menu', 'store'], ['rforecast', 'Demand Forecast', 'trend'], ['rsales', 'Sales Analytics', 'chart'], ['rwaste', 'Food Waste', 'trash'], ['rratings', 'Customer Ratings', 'star'], ['rsustain', 'Sustainability', 'leaf']];
const STU_TABS = [['dashboard', 'Home', 'home'], ['marketplace', 'Food', 'store'], ['ai', 'Picks', 'spark'], ['orders', 'Orders', 'bag'], ['more', 'More', 'menu']];
const RES_TABS = [['rdash', 'Home', 'home'], ['rorders', 'Orders', 'list'], ['rmenu', 'Menu', 'store'], ['rsales', 'Sales', 'chart'], ['more', 'More', 'menu']];
const isStu = sf => C.user(sf.user).role === 'student';
function curOutlet(sf) { const mine = C.myOutlets(sf.user); if (!sf.outlet || !mine.some(o => o.id === sf.outlet)) sf.outlet = mine[0] && mine[0].id; return sf.outlet; }
function go(sf, route, p) { sf.route = route; sf.p = p || {}; sf.modal = null; sf._nav = true; if (sf.id === 'main' && APP.mode === 'app') { /* keep hash simple */ } }
function toast(sf, msg, isErr) { sf.toast = { msg, e: !!isErr, at: Date.now() }; clearTimeout(sf.tt); sf.tt = setTimeout(() => { sf.toast = null; renderAll(); }, isErr ? 4200 : 2600); }
function run(sf, fn, okMsg) { try { const r = fn(); if (okMsg) toast(sf, typeof okMsg === 'function' ? okMsg(r) : okMsg); return r; } catch (e) { toast(sf, e.message, true); return undefined; } }

function renderSurface(sf) {
  const stu = isStu(sf); const u = C.user(sf.user);
  const nav = stu ? STU_NAV : RES_NAV; const tabs = stu ? STU_TABS : RES_TABS;
  let body = '';
  try { body = (stu ? STU_VIEWS : RES_VIEWS)[sf.route] ? (stu ? STU_VIEWS : RES_VIEWS)[sf.route](sf) : (stu ? STU_VIEWS.dashboard(sf) : RES_VIEWS.rdash(sf)); }
  catch (e) { body = '<div class="bad">Something went wrong: ' + esc(e.message) + '</div>'; console.error(e); }
  const unread = C.notifications(sf.user).filter(n => !n.read).length;
  const cartN = stu ? C.cart(sf.user).lines.reduce((a, l) => a + l.qty, 0) : 0;
  const mine = stu ? [] : C.myOutlets(sf.user);
  const top = '<header class="top">' +
    '<button class="brand hb" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + LOGO + '</button>' +
    '<form data-form="search" role="search">' + ic('search') + '<label class="sr" for="q-' + sf.id + '">Search</label><input type="search" id="q-' + sf.id + '" name="q" placeholder="' + (stu ? 'Search food or vendors' : 'Search your menu') + '" value="' + esc(sf.q || '') + '"></form>' +
    (stu ? '<button class="pts" data-a="go" data-r="rewards" title="Green Points">' + ic('leaf') + '<span class="num">' + C.balance(sf.user) + '</span><span class="sr"> Green Points</span></button>' +
      '<button class="ib" data-a="go" data-r="cart" aria-label="Cart, ' + cartN + ' items">' + ic('cart') + (cartN ? '<span class="dot">' + cartN + '</span>' : '') + '</button>'
      : (mine.length > 1 ? '<label class="sr" for="os-' + sf.id + '">Outlet</label><select class="orsel" id="os-' + sf.id + '" data-ch="outlet">' + mine.map(o => '<option value="' + o.id + '"' + (o.id === curOutlet(sf) ? ' selected' : '') + '>' + esc(o.name) + '</option>').join('') + '</select>' : '<span class="orsel" style="display:inline-flex;align-items:center">' + esc(C.outlet(curOutlet(sf)).name) + '</span>')) +
    themeBtn() +
    '<button class="ib" data-a="notifs" aria-label="Notifications, ' + unread + ' unread">' + ic('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
    '<button class="ib hidem" data-a="' + (stu ? 'go' : 'account') + '" data-r="profile" aria-label="Account">' + ic('user') + '</button>' +
    '</header>';
  const side = '<aside class="side" aria-label="' + (stu ? 'Student' : 'Restaurant') + ' navigation"><button class="brand wm hb" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + WORDMARK + '</button>' +
    nav.map(n => '<button class="nav" data-a="go" data-r="' + n[0] + '"' + (sf.route === n[0] || (n[0] === 'marketplace' && sf.route === 'outlet') || (n[0] === 'orders' && sf.route === 'order') || (n[0] === 'profile' && sf.route === 'diet') ? ' aria-current="page"' : '') + '>' + ic(n[2]) + n[1] + '</button>').join('') +
    '<div class="role"><b>' + esc(u.name) + '</b><br><span class="muted">' + (stu ? 'Student' : esc(mine.map(o => o.name + ' (' + o.role + ')').join(', '))) + '</span></div></aside>';
  const mt = '<nav class="mtabs" aria-label="Primary">' + tabs.map(t => '<button data-a="' + (t[0] === 'more' ? 'more' : 'go') + '" data-r="' + t[0] + '"' + (sf.route === t[0] ? ' aria-current="page"' : '') + '>' + ic(t[2]) + t[1] + '</button>').join('') + '</nav>';
  const modal = sf.modal ? '<div class="modal" data-a="closeBg" role="dialog" aria-modal="true"><div class="mbox">' + renderModal(sf) + '</div></div>' : '';
  const t = sf.toast ? '<div class="toast' + (sf.toast.e ? ' e' : '') + '" role="status">' + esc(sf.toast.msg) + '</div>' : '';
  return '<div class="shell ' + (stu ? 'student' : 'restaurant') + '">' + side + '<div class="main">' + top + '<main class="content" id="content-' + sf.id + '">' + body + '</main>' + mt + '</div></div>' + modal + t;
}
function renderModal(sf) {
  const m = sf.modal; const stu = isStu(sf);
  if (m.type === 'notifs') {
    const ns = C.notifications(sf.user).slice(0, 25);
    return '<div class="row between"><h2>Notifications</h2><button class="btn sm" data-a="close">Close</button></div>' +
      (ns.length ? '<div class="list">' + ns.map(n => '<button class="nav" style="align-items:flex-start" data-a="notif" data-l="' + esc(n.link) + '"><span>' + (n.read ? '' : '<b>● </b>') + esc(n.text) + '<br><span class="small muted">' + ago(n.at) + (n.kind === 'promotional' ? ' · promotional' : '') + '</span></span></button>').join('') + '</div>' : '<div class="empty">No notifications yet</div>');
  }
  if (m.type === 'more') {
    const nav = stu ? STU_NAV : RES_NAV;
    return '<div class="row between"><h2>All sections</h2><button class="btn sm" data-a="close">Close</button></div><div class="grid g2 keep2" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + nav.map(n => '<button class="btn" style="justify-content:flex-start" data-a="go" data-r="' + n[0] + '">' + ic(n[2]) + n[1] + '</button>').join('') + (stu ? '' : '<button class="btn" style="justify-content:flex-start" data-a="account">' + ic('user') + 'Account</button>') + '</div>';
  }
  if (m.type === 'account') {
    const mine = C.myOutlets(sf.user);
    return '<div class="row between"><h2>' + esc(C.user(sf.user).full) + '</h2><button class="btn sm" data-a="close">Close</button></div><h3>Your outlets</h3><div class="list">' + mine.map(o => '<div class="row between"><span>' + esc(o.name) + '</span><span class="chip o">' + o.role + '</span></div>').join('') + '</div><div class="row" style="margin-top:12px"><button class="btn" data-a="signout">Sign out</button><button class="btn" data-a="reset">Reset sample data</button></div>';
  }
  return (STU_MODALS[m.type] || RES_MODALS[m.type] || (() => ''))(sf, m);
}

/* ---------- top-level render ---------- */
function demoBar() {
  const S = C.S; const p = C.parts(C.now());
  const users = S.users.map(u => '<option value="' + u.id + '"' + (APP.sf.main.user === u.id ? ' selected' : '') + '>' + esc(u.full) + '</option>').join('');
  return '<div class="demobar' + (APP.dbOpen ? ' open' : '') + '" role="region" aria-label="Demo controls"><b class="lab">DEMO BUILD · sample data only, no real orders or payments</b><button class="dbt" data-a="dbt" aria-expanded="' + !!APP.dbOpen + '">Demo controls</button><div class="dgrp">' +
    (window.QB_NATIVE ? '<span class="grp"><button data-a="mode" data-m="app"' + (APP.mode === 'app' ? ' class="on"' : '') + '>App</button><button data-a="mode" data-m="project"' + (APP.mode === 'project' ? ' class="on"' : '') + '>Project status</button></span>' : '') +
    (window.QB_NATIVE ? '' : '<span class="grp"><button data-a="mode" data-m="landing"' + (APP.mode === 'landing' ? ' class="on"' : '') + '>Home</button><button data-a="mode" data-m="app"' + (APP.mode === 'app' ? ' class="on"' : '') + '>Website</button><button data-a="mode" data-m="project"' + (APP.mode === 'project' ? ' class="on"' : '') + '>Project status</button></span>') +
    (APP.mode === 'app' ? '<span class="grp"><label for="who">Signed in as</label><select id="who" data-ch="who">' + users + '</select></span>' : '') +
    '<span class="grp">Campus clock <b class="num">' + C.DAYS[p.day] + ' ' + C.hm(p.min) + '</b>' + (S.clock.mode === 'demo' ? '<button data-a="adv" data-n="5">+5 min</button><button data-a="adv" data-n="30">+30</button><button data-a="clock" data-m="real">Use real time</button>' : '<button data-a="clock" data-m="demo">Use demo time</button>') + '</span>' +
    '<span class="grp"><button data-a="reset">Reset demo data</button></span></div></div>';
}
function renderAll() {
  const keep = {}; document.querySelectorAll('[data-sf]').forEach(el => { const c = el.querySelector('.content'); keep[el.dataset.sf] = { s: el.scrollTop, c: c ? c.scrollTop : 0, w: window.scrollY }; });
  const ae = document.activeElement; const fid = ae && ae.id; const sel = ae && ae.selectionStart;
  const root = document.getElementById('root'); let h = '';
  if (APP.mode === 'landing') h += LANDING();
  else if (APP.mode === 'project') h += PROJECT();
  else h += '<div class="surface fixedm" data-sf="main">' + renderSurface(APP.sf.main) + '</div>';
  root.innerHTML = h;
  document.querySelectorAll('[data-sf]').forEach(el => { const s = APP.sf[el.dataset.sf]; const k = keep[el.dataset.sf]; if (s && s._nav) { el.scrollTop = 0; if (el.dataset.sf === 'main') window.scrollTo(0, 0); s._nav = false; } else if (k) { el.scrollTop = k.s; } });
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus(); try { if (sel != null) n.setSelectionRange(sel, sel); } catch (e) { } } }
}
C.on(() => { });
function setHash() { const h = APP.mode === 'landing' ? '' : APP.mode === 'app' ? (isStu(APP.sf.main) ? 'student' : 'restaurant') : APP.mode; try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { } }
function fromHash() { const h = (location.hash || '').slice(1); if (h === 'student') { APP.mode = 'app'; APP.sf.main.user = 's1'; go(APP.sf.main, 'dashboard'); } else if (h === 'restaurant') { APP.mode = 'app'; APP.sf.main.user = 'r1'; go(APP.sf.main, 'rdash'); } else if (h === 'project') APP.mode = h; else APP.mode = 'landing'; }

/* ---------- events ---------- */
const ACTIONS = {}; const FORMS = {}; const CHANGES = {};
function sfOf(el) { const s = el.closest('[data-sf]'); return s ? APP.sf[s.dataset.sf] : APP.sf.main; }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.dataset.a === 'closeBg' && e.target !== el) return;
  const sf = sfOf(el); const f = ACTIONS[el.dataset.a]; if (!f) return;
  e.preventDefault(); f(sf, el.dataset, el); renderAll();
});
document.addEventListener('submit', e => { const el = e.target.closest('[data-form]'); if (!el) return; e.preventDefault(); const sf = sfOf(el); const fd = new FormData(el); const data = {}; for (const [k, v] of fd.entries()) { if (k in data) data[k] = [].concat(data[k], v); else data[k] = v; } const f = FORMS[el.dataset.form]; if (f) { const r = f(sf, data, el); if (r && r.then) r.then(renderAll); else renderAll(); } });
document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (!el) return; const sf = sfOf(el); const f = CHANGES[el.dataset.ch]; if (f) { f(sf, el.value, el); renderAll(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { let any = false; Object.values(APP.sf).forEach(s => { if (s.modal) { s.modal = null; any = true; } }); if (any) renderAll(); } });
window.addEventListener('storage', e => { if (e.key === 'quickbite-demo-v1') { C.reload(); renderAll(); } });
window.addEventListener('hashchange', () => { fromHash(); renderAll(); });
setInterval(() => { if (C.S.clock.mode === 'real') renderAll(); }, 60000);

Object.assign(ACTIONS, {
  go: (sf, d) => { go(sf, d.r, d.id ? { id: d.id } : {}); if (d.r === 'marketplace' && !d.keepq) sf.q = d.q || ''; },
  close: sf => { sf.modal = null; }, closeBg: sf => { sf.modal = null; },
  notifs: sf => { sf.modal = { type: 'notifs' }; C.markRead(sf.user); },
  notif: (sf, d) => { const l = d.l || ''; sf.modal = null; if (l.startsWith('order:')) { go(sf, isStu(sf) ? 'order' : 'rorders', { id: l.slice(6) }); } else if (l) { const map = { orders: 'rorders', menu: 'rmenu', ratings: 'rratings' }; go(sf, map[l] || l); } },
  more: sf => { sf.modal = { type: 'more' }; },
  account: sf => { sf.modal = { type: 'account' }; },
  signout: sf => { sf.modal = null; APP.mode = 'landing'; setHash(); },
  mode: (sf, d) => { APP.mode = d.m; if (d.m === 'app' && d.u) { APP.sf.main.user = d.u; go(APP.sf.main, d.u.startsWith('s') ? 'dashboard' : 'rdash'); } setHash(); window.scrollTo(0, 0); },
  dbt: () => { APP.dbOpen = !APP.dbOpen; },
  theme: () => { applyTheme(curTheme() === 'dark' ? 'light' : 'dark'); },
  adv: (sf, d) => C.advance(Number(d.n)),
  clock: (sf, d) => C.setClock({ mode: d.m }),
  reset: () => { C.reset(); Object.values(APP.sf).forEach(s => { s.modal = null; s.p = {}; }); toast(APP.sf.main, 'Sample data reset'); },
});
Object.assign(FORMS, { search: (sf, d) => { sf.q = (d.q || '').trim(); go(sf, isStu(sf) ? 'marketplace' : 'rmenu'); } });
Object.assign(CHANGES, {
  who: (sf, v) => { APP.sf.main.user = v; go(APP.sf.main, v.startsWith('s') ? 'dashboard' : 'rdash'); APP.sf.main.outlet = null; setHash(); },
  outlet: (sf, v) => { sf.outlet = v; },
});
