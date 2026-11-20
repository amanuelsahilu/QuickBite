/* ---------- landing page ---------- */
// a falafel wrap, drawn here for the hero card
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
    '<div class="row between" style="margin-top:16px;gap:8px"><span class="chip">Pickup station · SJA Cafeteria</span><span class="fits">✓ Fits your break · 6 min to spare</span></div>' +
    '<p class="plan-c"><span>All in 30</span> different minutes</p>' +
    '</div>';
}
function LANDING() {
  const how = [['Check your break', 'QuickBite reads the schedule you enter and works out how long you really have.'], ['Pick a meal that fits', 'See price, queue, prep and walking time together. Allergies and budget are respected.'], ['Order ahead', 'The kitchen starts while you walk. Choose a collection slot at the counter or a pickup station.'], ['Collect and go', 'A one-time code confirms it is your meal. Rate it, earn Green Points.']];
  const eco = [['Ordering', 'Advance ordering with live status for students and kitchens.'], ['Campus vendors', 'Each outlet manages its own menu, availability and capacity.'], ['Pickup stations', 'A comfortable spot where your food waits for you, opened with a one-time code.'], ['Campus delivery', 'Optional delivery to buildings.'], ['Smart picks', 'Meal suggestions that fit your break, budget and diet.'], ['Green Points', 'Points for verified sustainable actions, redeemable for rewards.']];
  return '<div class="land"><div class="lnav"><button class="brand wm hb" style="padding:0" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + WORDMARK + '</button><nav><button class="btn" data-a="mode" data-m="app" data-u="s1">Student log in</button><button class="btn" data-a="mode" data-m="app" data-u="r1">Restaurant log in</button>' + themeBtn() + '<button class="ib qhelp" data-a="howToggle" aria-expanded="' + !!APP.howOpen + '" aria-controls="how" aria-label="How it works" title="How it works">?</button></nav></div>' +
    '<section class="band lhero"><div class="inner" style="display:contents"><div><span class="chip g">Campus food, planned around your timetable</span><h1 style="margin-top:14px">Short break? Eat well and still make class.</h1><p class="lead">QuickBite lets students order ahead, see exactly when food will be ready and collect it without the queue — and helps campus kitchens plan for the rush.</p>' +
    '</div>' + heroPic() + '</div></section>' +
    (APP.howOpen ? '<section class="band" id="how"><div class="inner"><h2 style="font-size:28px">How it works</h2><div class="how" style="margin-top:14px">' + how.map((h, i) => '<div class="card"><b>' + (i + 1) + '</b><h3>' + h[0] + '</h3><p class="muted">' + h[1] + '</p></div>').join('') + '</div></div></section>' : '') +
    '<section class="band who"><div class="inner grid g2 panel"><div><h2 style="font-size:28px">For students</h2><ul class="muted"><li>Know before you order whether a meal fits your break.</li><li>Dietary preferences and allergy-aware recommendations; undeclared allergens are never shown as safe.</li><li>Predictable collection at the counter or a pickup station.</li><li>Green Points rewards for sustainable choices.</li></ul></div><div><h2 style="font-size:28px">For restaurants</h2><ul class="muted"><li>Orders arrive grouped by pickup window, so the kitchen can batch.</li><li>Control availability, stock, hours and slot capacity.</li><li>Record food waste and track it against a baseline.</li><li>See your own demand patterns, sales and ratings.</li></ul></div></div></section>' +
    '<section class="band eco-s"><div class="inner"><h2 style="font-size:28px">The campus ecosystem</h2><p class="muted">What each part is, and how far along it is.</p><div class="eco" style="margin-top:14px">' + eco.map(e => '<div class="card"><h3>' + e[0] + '</h3><p class="muted small">' + e[1] + '</p></div>').join('') + '</div></div></section>' +
    '<footer class="band foot"><div class="inner foot-g">' +
    '<div><button class="brand wm foot-wm hb" data-a="mode" data-m="landing" aria-label="QuickBite home" title="Back to home">' + WORDMARK + '</button><p>Campus food that fits your break.</p>' +
    '<div class="soc"><a href="#" aria-label="Instagram" title="Instagram">' + SOC.ig + '</a><a href="#" aria-label="Facebook" title="Facebook">' + SOC.fb + '</a><a href="#" aria-label="TikTok" title="TikTok">' + SOC.tt + '</a></div></div>' +
    '<div><b>Contact</b><p>Email: <a href="mailto:hello@quickbite.ae">hello@quickbite.ae</a><br>Phone: +971 50 284 7316<br>Office: +971 4 389 2150</p></div>' +
    '<div><b>Follow us</b><p>Instagram: @quickbite.campus<br>Facebook: /quickbitecampus<br>TikTok: @quickbite</p></div>' +
    '<div><b>Office</b><p>Student Center, Ground floor<br>Mon–Thu · 8:00–17:00<br>Fri · 8:00–12:00</p></div>' +
    '</div><div class="inner foot-c">© 2026 QuickBite. All rights reserved.</div></footer></div>';
}
ACTIONS.howToggle = () => { APP.howOpen = !APP.howOpen; if (APP.howOpen) ACTIONS.scrollTo(null, { t: 'how' }); };
ACTIONS.scrollTo = (sf, d) => { setTimeout(() => { const el = document.getElementById(d.t); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 0); };

