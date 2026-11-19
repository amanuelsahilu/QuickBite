/* ---------- landing page & project status ---------- */
// a pizza slice, drawn here (the bowl illustration read as a face at this size)
const WRAP = '<svg viewBox="0 0 100 100" role="img" aria-label="Wrap"><g transform="rotate(-35 50 50)"><rect x="30" y="14" width="40" height="74" rx="20" fill="#f2d29b"/><rect x="30" y="14" width="40" height="74" rx="20" fill="none" stroke="#d9a85b" stroke-width="3"/><ellipse cx="50" cy="22" rx="17" ry="9" fill="#22c55e"/><circle cx="43" cy="20" r="4" fill="#a16207"/><circle cx="55" cy="21" r="4" fill="#a16207"/><circle cx="50" cy="16" r="3" fill="#ef4444"/><path d="M34 52h32M34 66h32" stroke="#d9a85b" stroke-width="3" stroke-linecap="round"/></g></svg>';
const SOC = {
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v6h4v-6h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z"/></svg>',
  tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.3 1.8 3.8 4 4v3.3c-1.5 0-2.9-.4-4-1.1v6.3a6 6 0 1 1-6-6h.6v3.4a2.7 2.7 0 1 0 2 2.6V3z"/></svg>'
};
function heroPic() {
  // the same 30-minute break, without and with QuickBite
  const bar = parts => '<div class="tl tl2" aria-hidden="true">' + parts.map(p => '<span style="flex:' + p[1] + ';background:' + p[2] + (p[3] ? ';color:' + p[3] : '') + '"' + (p[4] ? ' class="' + p[4] + '"' : '') + '>' + p[0] + '</span>').join('') + '</div>';
  return '<div class="card plan">' +
    '<div class="row between" style="align-items:center;gap:10px;margin-bottom:18px"><div class="food" style="align-items:center"><div class="art pz">' + WRAP + '</div><div><b>Falafel Wrap</b><br><span class="small muted">Campus Café</span></div></div><span class="gp">+5 Green Points</span></div>' +
    '<div class="small plan-l"><b>With QuickBite</b></div>' + bar([['pick up', 3, '#0d9488', '#fff', 'tiny'], ['eat', 12, '#16a34a'], ['pray', 9, '#0f2a43'], ['rest', 6, '#cbd5e1', '#0f2a43']]) +
    '<div style="height:8px"></div>' + bar([['order', 6, '#94a3b8', '#0f2a43'], ['wait in line', 12, '#64748b'], ['eat', 12, '#16a34a']]) +
    '<div class="small muted plan-l" style="margin:5px 0 0">Without QuickBite</div>' +
    '<div class="row between" style="margin-top:16px;gap:8px"><span class="chip">Pickup station · Student Center</span><span class="fits">✓ Fits your break · 6 min to spare</span></div>' +
    '<p class="plan-c"><span>All in 30</span> different minutes</p>' +
    '</div>';
}
function LANDING() {
  if (window.QB_NATIVE) return '<div style="display:flex;justify-content:flex-end;padding:calc(12px + env(safe-area-inset-top)) 16px 0">' + themeBtn() + '</div><div style="min-height:80vh;display:grid;place-items:center;padding:24px"><div style="max-width:420px;text-align:center">' + LOGO.replace('<svg', '<svg style="width:72px;height:72px"') + '<h1 style="margin-top:16px">QuickBite</h1><p class="muted">Order campus meals that fit your break.</p><div class="stack" style="margin-top:24px"><button class="btn p" style="width:100%" data-a="mode" data-m="app" data-u="s1">Continue as student</button><button class="btn" style="width:100%" data-a="mode" data-m="app" data-u="r1">Continue as restaurant</button></div></div></div>';
  const how = [['Check your break', 'QuickBite reads the schedule you enter and works out how long you really have.'], ['Pick a meal that fits', 'See price, queue, prep and walking time together. Allergies and budget are respected.'], ['Order ahead', 'The kitchen starts while you walk. Choose a collection slot at the counter or a pickup station.'], ['Collect and go', 'A one-time code confirms it is your meal. Rate it, earn Green Points.']];
  const eco = [['Ordering', 'Advance ordering with live status for students and kitchens.', 'In this demo'], ['Campus vendors', 'Each outlet manages its own menu, availability and capacity.', 'In this demo'], ['Pickup stations', 'A comfortable spot where your food waits for you, opened with a one-time code.', 'Simulated — no hardware yet'], ['Campus delivery', 'Optional delivery to buildings.', 'Planned — model not decided'], ['Smart picks', 'Meal suggestions that fit your break, budget and diet.', 'In this demo'], ['Green Points', 'Points for verified sustainable actions, redeemable for rewards.', 'In this demo — values not final']];
  return '<div class="land"><div class="lnav"><button class="brand wm hb" style="padding:0" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + WORDMARK + '</button><nav><button class="btn p" data-a="mode" data-m="app" data-u="s1">Student log in</button><button class="btn" data-a="mode" data-m="app" data-u="r1">Restaurant log in</button>' + themeBtn() + '<button class="ib qhelp" data-a="howToggle" aria-expanded="' + !!APP.howOpen + '" aria-controls="how" aria-label="How it works" title="How it works">?</button></nav></div>' +
    '<section class="band lhero"><div class="inner" style="display:contents"><div><span class="chip g">Campus food, planned around your timetable</span><h1 style="margin-top:14px">Short break? Eat well and still make class.</h1><p class="lead">QuickBite lets students order ahead, see exactly when food will be ready and collect it without the queue — and helps campus kitchens plan for the rush.</p>' +
    '<div class="row" style="margin-top:20px"><button class="btn" data-a="mode" data-m="stage">See app + kitchen live</button></div></div>' + heroPic() + '</div></section>' +
    (APP.howOpen ? '<section class="band" id="how"><div class="inner"><h2 style="font-size:28px">How it works</h2><div class="how" style="margin-top:14px">' + how.map((h, i) => '<div class="card"><b>' + (i + 1) + '</b><h3>' + h[0] + '</h3><p class="muted">' + h[1] + '</p></div>').join('') + '</div></div></section>' : '') +
    '<section class="band who"><div class="inner grid g2 panel"><div><h2 style="font-size:28px">For students</h2><ul class="muted"><li>Know before you order whether a meal fits your break.</li><li>Dietary preferences and allergy-aware recommendations; undeclared allergens are never shown as safe.</li><li>Predictable collection at the counter or a pickup station.</li><li>Green Points rewards for sustainable choices.</li></ul></div><div><h2 style="font-size:28px">For restaurants</h2><ul class="muted"><li>Orders arrive grouped by pickup window, so the kitchen can batch.</li><li>Control availability, stock, hours and slot capacity.</li><li>Record food waste and track it against a baseline.</li><li>See your own demand patterns, sales and ratings.</li></ul></div></div></section>' +
    '<section class="band eco-s"><div class="inner"><h2 style="font-size:28px">The campus ecosystem</h2><p class="muted">What each part is, and how far along it is.</p><div class="eco" style="margin-top:14px">' + eco.map(e => '<div class="card"><h3>' + e[0] + '</h3><p class="muted small">' + e[1] + '</p></div>').join('') + '</div></div></section>' +
    '<footer class="band foot"><div class="inner foot-g">' +
    '<div><button class="brand wm foot-wm hb" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + WORDMARK + '</button><p>Campus food that fits your break.</p>' +
    '<div class="soc"><a href="#" aria-label="Instagram" title="Instagram">' + SOC.ig + '</a><a href="#" aria-label="Facebook" title="Facebook">' + SOC.fb + '</a><a href="#" aria-label="TikTok" title="TikTok">' + SOC.tt + '</a></div></div>' +
    '<div><b>Contact</b><p>Email: <a href="mailto:hello@quickbite.ae">hello@quickbite.ae</a><br>Phone: +971 50 284 7316<br>Office: +971 4 389 2150</p></div>' +
    '<div><b>Follow us</b><p>Instagram: @quickbite.campus<br>Facebook: /quickbitecampus<br>TikTok: @quickbite</p></div>' +
    '<div><b>Office</b><p>Student Center, Ground floor<br>Sun–Thu · 8:00–17:00</p></div>' +
    '</div><div class="inner foot-c">© 2026 QuickBite. All rights reserved.</div></footer></div>';
}
ACTIONS.howToggle = () => { APP.howOpen = !APP.howOpen; if (APP.howOpen) ACTIONS.scrollTo(null, { t: 'how' }); };
ACTIONS.scrollTo = (sf, d) => { setTimeout(() => { const el = document.getElementById(d.t); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 0); };

const FEAT = [
  // [area, requirement, status, note]  status: F functional (demo data), S simulated, A awaiting decision, D deferred, P partial
  ['Landing', 'Product message, how it works, benefits, ecosystem, demo access, restaurant path', 'F', 'No partnership or infrastructure claims'],
  ['Accounts', 'Student and restaurant (owner/staff) roles, server-side permission checks', 'P', 'Enforced in the demo backend; real sign-in, recovery, eligibility awaiting decision'],
  ['Accounts', 'Demo role switching isolated from production', 'F', 'Demo-only store and reset; no production exists yet'],
  ['Student', 'Dashboard: greeting, next class, break left, points, break plan, timing, shortcuts, reward progress, activity', 'F', ''],
  ['Student', 'Marketplace: search, categories, favourites, outlet cards, ratings, walk/queue/prep/total, open/closed/busy', 'F', 'Walking times are schematic estimates'],
  ['Student', 'Menus & item details: allergens, ingredients, nutrition only when supplied, stock, availability', 'F', 'Customisations awaiting approval; free-text notes only'],
  ['Student', 'AI Picks: best option, 7 ranking modes, Running Late mode, schedule-fit explanation, no-match state', 'F', 'Transparent rules, not a trained model; buffers/weights awaiting approval'],
  ['Student', 'Class schedule: weekdays, rooms, break detection, overlap warnings, order for break', 'F', 'Manual entry only; import/integration awaiting decision'],
  ['Student', 'Reminders and push notifications', 'A', 'In-app notifications work; push needs native build + channel approval'],
  ['Student', 'Dietary profile: 9 preferences, 9 allergen groups, budget, break length, preview', 'F', 'Hard-filter vs goal rule awaiting approval'],
  ['Student', 'Cart & checkout: edit lines, revalidation, slot capacity, warnings, totals, confirmation', 'F', 'Fees/VAT shown as undecided, not zero'],
  ['Student', 'Multi-restaurant cart', 'A', 'One outlet per order until decided'],
  ['Student', 'Payments, receipts, refunds', 'S', 'Simulated states only; provider, refunds policy, settlement awaiting decision'],
  ['Student', 'Order tracking, history, cancel, reorder, rating', 'F', ''],
  ['Student', 'Smart Queue view with formula and data source label', 'F', 'Simulated baseline, not live'],
  ['Student', 'Pickup stations: counts, layout, utilisation, reserve → place → notify → code → release', 'S', 'No hardware; simulator for failures'],
  ['Student', 'Campus delivery', 'A', 'Delivery model undecided'],
  ['Student', 'Sustainability: metrics, evidence upload, Green Station codes, badges', 'P', 'Verifier for waste actions awaiting decision; demo simulate button'],
  ['Student', 'Rewards: balance, levels, catalogue, redemption, history', 'F', 'Values, funding and fulfilment awaiting decision'],
  ['Student', 'Campus map (schematic)', 'S', 'Real geographic data not supplied'],
  ['Student', 'Profile: favourites, payment info, notification prefs, privacy export, help', 'P', 'Deletion, consent and support channel awaiting decision'],
  ['Restaurant', 'Dashboard: live orders, workload, sales, rating, peak, popular forecast, orders by window', 'F', 'Premium AI status not shown (not approved)'],
  ['Restaurant', 'Live orders: accept/reject, prepare, delay, ready, station placement, code verification, no-show, pause', 'F', ''],
  ['Restaurant', 'Queue & capacity: workload, prep queue, pickup windows, capacity settings', 'F', ''],
  ['Restaurant', 'Menu: create/edit, tags, allergens, nutrition, stock, status, hours, closures', 'F', 'Photo upload needs a storage decision'],
  ['Restaurant', 'Demand forecast: heatmap, weekly/daily, peak, popular items, shortages, capacity comparison', 'S', 'Deterministic mock from demo history'],
  ['Restaurant', 'Sales analytics with gross / refunds / commission / fees / net separated', 'P', 'Commission and fees awaiting decision, so net not computed'],
  ['Restaurant', 'Food waste: kg records, average, baseline reduction', 'F', ''],
  ['Restaurant', 'Customer ratings: summary, history, reply, report (no delete)', 'F', 'Report handling owner awaiting decision'],
  ['Restaurant', 'Sustainability: reusable rate, points issued; recyclable and emissions only with method', 'P', 'Recyclable data and emissions method not defined'],
  ['Platform', 'Responsive website', 'F', 'Published demo'],
  ['Platform', 'Mobile app', 'P', 'Mobile web app layout built and shown in phone frame; native iOS/Android builds not yet produced'],
  ['Platform', 'Shared persistent backend & database', 'P', 'Demo backend runs in the browser per viewer; production API + database not built'],
  ['Platform', 'Automated tests of business rules', 'F', 'See test results below'],
  ['Platform', 'Arabic / right-to-left', 'A', 'Language needs not confirmed'],
  ['Excluded', 'College administrator / institutional dashboards and reports', 'D', 'Excluded by brief — none present'],
];
const DECISIONS = [
  ['Pilot', 'Which campus(es) and buildings are in the pilot? Who is eligible to register (students only, staff)?'],
  ['Partners', 'Which real outlets will take part, with what hours, menus and kitchen capacity?'],
  ['Money', 'Commission rate (earlier report and slides conflict), service/delivery fees, subscriptions, VAT treatment.'],
  ['Payments', 'Payment provider, who collects money, settlement timing, who bears fees and refunds; refund and no-show policy.'],
  ['Collection', 'Are pickup stations in scope for the pilot? Who carries meals to stations? Is delivery in or out?'],
  ['Timing', 'Approve the planning buffers (2-min order lead, 10 min to eat, 3-min running-late buffer) and ranking weights.'],
  ['Diet', 'Which preferences are must-haves vs goals? Should undeclared-allergen items be hidden or only warned for students with allergies?'],
  ['Points', 'Points per action, daily limits, expiry, who verifies waste actions, reward catalogue, funding and fulfilment.'],
  ['Cart', 'Multi-restaurant orders: allowed? Customisations: which kinds?'],
  ['Accounts', 'Sign-in method (email/phone/university SSO), how outlet ownership and staff membership are verified.'],
  ['Mobile', 'iOS, Android or both? Do restaurant staff need the native app, or is the website enough?'],
  ['Language', 'English only, or Arabic with right-to-left too?'],
  ['Budget', 'Monthly budget for hosting, database, SMS/push, payments and app-store accounts.'],
];
const INTEG = [['Payment processing', 'Simulated', 'Provider account, keys, PCI-compliant hosted checkout'], ['University sign-in', 'Not connected', 'Institution approval + SSO details'], ['Timetable import', 'Manual entry', 'Approved file format or authorised API'], ['Lockers / pickup stations', 'Simulator', 'Hardware vendor, device API, installation'], ['Temperature sensors', 'None', 'Hardware + data feed'], ['QR collection', 'One-time text code; visual pattern only', 'Native camera scanning in app build'], ['Electric delivery / solar', 'Concept only', 'Operational decision'], ['Evidence verification', 'Manual review by outlet; demo simulator', 'Verifier role decision'], ['Recommendations', 'Rules-based', 'Approval of rules; ML only after data + budget'], ['Forecasting', 'Deterministic mock', '8–12 weeks of real orders + academic calendar'], ['Environmental calculations', 'Not calculated', 'Documented method'], ['Push notifications', 'In-app only', 'Native build + Apple/Google push setup']];
function PROJECT() {
  const T = window.TEST_RESULTS || { pass: 0, fail: 0, names: [] };
  const lbl = { F: ['Functional (demo data)', 'st-f'], S: ['Simulated', 'st-s'], A: ['Awaiting decision', 'st-a'], D: ['Deferred / excluded', 'st-d'], P: ['Partial', 'st-p'] };
  const counts = {}; FEAT.forEach(f => counts[f[2]] = (counts[f[2]] || 0) + 1);
  return '<div class="proj"><h1>QuickBite — build status</h1><p class="muted" style="max-width:62em">What is in this deployed demo, what is simulated, and what needs your decision. Status as of this build; every requirement from the development brief is tracked.</p>' +
    '<div class="toc"><a class="btn sm" href="#p-cov" data-a="scrollTo" data-t="p-cov">Coverage</a><a class="btn sm" href="#p-dec" data-a="scrollTo" data-t="p-dec">Decisions needed</a><a class="btn sm" href="#p-int" data-a="scrollTo" data-t="p-int">Integrations</a><a class="btn sm" href="#p-arch" data-a="scrollTo" data-t="p-arch">Architecture & costs</a><a class="btn sm" href="#p-test" data-a="scrollTo" data-t="p-test">Tests</a><a class="btn sm" href="#p-inv" data-a="scrollTo" data-t="p-inv">Screen inventory</a></div>' +
    '<section><div class="grid g4 kp">' + Object.keys(lbl).filter(k => counts[k]).map(k => '<div class="card kpi"><div class="l">' + lbl[k][0] + '</div><div class="v num ' + lbl[k][1] + '">' + counts[k] + '</div></div>').join('') + '</div></section>' +
    '<section><div class="warn"><b>Important:</b> the MVP video could not be accessed during this build, so screens follow the written brief. Please compare against the video and flag differences. Each viewer’s demo data lives in their own browser, so two people on different devices will not see each other’s orders. Use “App + kitchen live” to show both sides on one screen.</div></section>' +
    '<section id="p-cov"><h2>Feature coverage</h2><div class="card scroll"><table class="stack"><thead><tr><th>Area</th><th>Requirement</th><th>Status</th><th>Notes</th></tr></thead><tbody>' + FEAT.map(f => '<tr><td>' + f[0] + '</td><td>' + esc(f[1]) + '</td><td class="' + lbl[f[2]][1] + ' nowrap">' + lbl[f[2]][0] + '</td><td class="small muted">' + esc(f[3]) + '</td></tr>').join('') + '</tbody></table></div></section>' +
    '<section id="p-dec"><h2>Decisions we need from you</h2><div class="card"><table class="stack"><thead><tr><th>Topic</th><th>Question</th></tr></thead><tbody>' + DECISIONS.map(d => '<tr><td><b>' + d[0] + '</b></td><td>' + esc(d[1]) + '</td></tr>').join('') + '</tbody></table></div><p class="note">Until answered, these values appear in the product as “awaiting decision” rather than as zero or a hidden default. All prices, points, counts and forecasts are demo values.</p></section>' +
    '<section id="p-int"><h2>Integrations & simulators</h2><div class="card scroll"><table class="stack"><thead><tr><th>Integration</th><th>Status now</th><th>Needed for real use</th></tr></thead><tbody>' + INTEG.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="small muted">' + r[2] + '</td></tr>').join('') + '</tbody></table></div></section>' +
    '<section id="p-arch"><h2>Architecture & cost implications</h2><div class="grid g2"><div class="card"><h3>This demo</h3><p class="small">One self-contained web app. A demo backend module (order state machine, permissions, reservations, ledger) runs in the browser and stores data locally; website and mobile layouts share it. Hosted as a private claude.ai page you can share. No paid services, no real payments, nothing connected to university systems.</p></div>' +
    '<div class="card"><h3>Recommended production path</h3><ul class="small"><li><b>Backend:</b> TypeScript API (Node) + PostgreSQL, reusing this demo’s rules. Managed options (e.g. Supabase, Render, Railway) typically run tens of US dollars a month at pilot scale.</li><li><b>Web:</b> React/Next.js site — the same screens built here.</li><li><b>Mobile:</b> one cross-platform codebase (React Native/Expo or Capacitor) for iOS and Android. Cheaper to maintain than two native apps; true native camera, QR scanning and push.</li><li><b>Store accounts:</b> Apple Developer Program (annual fee) and Google Play (one-time fee); app signing; review time.</li><li><b>Payments:</b> a local card processor with hosted checkout (per-transaction fees; no card data stored by us).</li></ul><p class="note">Prices change; confirm current fees before committing.</p></div></div></section>' +
    '<section id="p-test"><h2>Automated tests</h2><div class="card"><p><b class="st-f">' + T.pass + ' passed</b>, <b' + (T.fail ? ' style="color:var(--red)"' : '') + '>' + T.fail + ' failed</b> — business-rule tests on the demo backend.</p><ul class="small">' + T.names.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></div></section>' +
    '<section id="p-inv"><h2>Screen inventory</h2><div class="grid g2"><div class="card"><h3>Student (12 destinations)</h3><p class="small">' + STU_NAV.map(n => n[1]).join(' · ') + '</p><p class="small muted">Plus landing, cart/checkout, order detail, item detail, schedule fit, notifications.</p></div><div class="card"><h3>Restaurant owner / staff (9 destinations)</h3><p class="small">' + RES_NAV.map(n => n[1]).join(' · ') + '</p><p class="small muted">Plus outlet switcher, item editor, reject/verify dialogs, account.</p></div></div><p class="note">College administrator section: excluded by brief. No institutional dashboards, reports or admin roles exist.</p></section>' +
    '<section><h2>Known limitations</h2><ul class="small"><li>Data is per browser; reset any time with “Reset demo data”.</li><li>Photo evidence stores only the file name and fingerprint, not the image.</li><li>Native app builds, push notifications, real QR scanning and payments are not included.</li><li>Accessibility checked for labels, focus and touch-target size; full audit pending.</li></ul></section></div>';
}
