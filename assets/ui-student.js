/* ---------- student views ---------- */
const CATS = [['bowl', 'Bowls'], ['wrap', 'Wraps'], ['salad', 'Salads'], ['pizza', 'Pizza'], ['sandwich', 'Sandwiches'], ['drink', 'Drinks'], ['pastry', 'Pastries']];
const SORTS = [['best', 'Best Match', 'Weighted score: fits your break (+50), matches nutrition goals (+12 each), favourites, shorter total time, lower price, popularity and sustainability. Weights are demo values awaiting approval.'], ['fastest', 'Fastest', 'Lowest total time: order lead + max(queue wait + prep, walk to outlet) + eating time + walk to next class.'], ['cheapest', 'Cheapest', 'Lowest current menu price.'], ['healthiest', 'Healthiest', 'Lowest calories — only items whose outlet supplied nutrition. Items without supplied data are not ranked.'], ['protein', 'High Protein', 'Most protein grams — only items with supplied nutrition.'], ['popular', 'Most Popular', 'Most completed orders in demo history.'], ['sustainable', 'Most Sustainable', 'Score: active SmartSave deal (+2), outlet offers reusable packaging (+1), vegan (+1). Engagement score, not measured impact.']];
const bName = id => C.bName(id);

function diningLine(r) {
  return '<span class="small muted">' + esc(r.outlet.name) + ' · ' + aed(r.item.price) + ' · ready ~' + r.ready + ' min</span>';
}
function breakTimeline(r, avail) {
  const cfg = C.S.config.timing; const walkTo = C.walk(r.from || 'stc', r.outlet.building);
  const parts = [['Order', cfg.orderLeadMin, '#64748b'], ['Queue + prep', Math.max(r.queue.wait + r.item.prep, walkTo), '#0d9488'], ['Eat', r.eat, '#16a34a'], ['Walk to class', r.walkBack, '#0f2a43']];
  const total = Math.max(avail || 0, parts.reduce((a, p) => a + p[1], 0));
  const spare = (avail || 0) - parts.reduce((a, p) => a + p[1], 0);
  return '<div class="tl" role="img" aria-label="Break plan timeline">' + parts.filter(p => p[1] > 0).map(p => '<span style="flex:' + p[1] + ';background:' + p[2] + '">' + p[1] + 'm</span>').join('') + (spare > 0 ? '<span style="flex:' + spare + ';background:#cbd5e1;color:#0f2a43">' + spare + 'm spare</span>' : '') + '</div>' +
    '<div class="tlk">' + parts.map(p => '<span><i style="background:' + p[2] + '"></i>' + p[0] + '</span>').join('') + '</div>';
}
function recCard(sf, r, rec, big) {
  const it = r.item; const walkBack = C.walk(r.outlet.building, rec.break.to || r.outlet.building);
  r.walkBack = walkBack; r.eat = rec.sort && sf.late ? 0 : C.S.config.timing.eatBufferMin; r.from = rec.break.from;
  return '<div class="card' + (big ? ' hero' : '') + '"><div class="food">' + art(it.cat, r.outlet.color, false) + '<div style="flex:1"><div class="row between"><h3 style="margin:0">' + esc(it.name) + '</h3><span class="price">' + aed(r.offer ? r.offer.price : it.price) + '</span></div>' +
    '<div class="small muted">' + esc(r.outlet.name) + ' · ' + stars(outletRating(r.outlet.id)) + ' · ready in ~' + r.ready + ' min</div>' +
    '<div class="chips" style="margin:6px 0">' + it.tags.slice(0, 4).map(t => '<span class="chip g">' + esc(t) + '</span>').join('') + (r.offer ? '<span class="chip o">SmartSave deal</span>' : '') + '</div>' +
    (r.reasons.length ? '<div class="small">' + r.reasons.map(x => '✓ ' + esc(x)).join('<br>') + '</div>' : '') + '</div></div>' +
    (big && rec.avail ? '<div style="margin-top:12px">' + breakTimeline(r, rec.avail) + '</div>' : '') +
    '<div class="row" style="margin-top:12px"><button class="btn p" data-a="add" data-id="' + it.id + '">Add to cart</button><button class="btn" data-a="fit" data-id="' + it.id + '">View schedule fit</button><button class="btn" data-a="go" data-r="outlet" data-id="' + r.outlet.id + '">Menu</button></div></div>';
}

const STU_VIEWS = {
  dashboard(sf) {
    const u = C.user(sf.user); const br = C.nextBreak(sf.user); const rec = C.recommend(sf.user, {}); const top = rec.list[0];
    const pts = C.balance(sf.user); const nextR = C.S.rewards.filter(r => r.cost > pts).sort((a, b) => a.cost - b.cost)[0];
    const orders = C.myOrders(sf.user); const active = orders.filter(o => ['submitted', 'accepted', 'preparing', 'ready'].includes(o.status));
    const hr = Math.floor(br.now.min / 60); const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    let nextTxt;
    if (br.inClass) nextTxt = 'In class: <b>' + esc(br.inClass.name) + '</b> until ' + br.inClass.end + (br.next ? '. Then a ' + br.minutesLeft + '-min break before ' + esc(br.next.name) + ' at ' + br.next.start : '');
    else if (br.next) nextTxt = 'Next class: <b>' + esc(br.next.name) + '</b> at ' + br.next.start + ' · ' + esc(bName(br.next.building));
    else nextTxt = esc(br.reason) + (br.reason === 'No schedule saved yet' ? ' — <button class="btn sm" data-a="go" data-r="schedule">Add your classes</button>' : '');
    const notes = C.notifications(sf.user).slice(0, 4);
    return '<h1>' + greet + ', ' + esc(u.name) + '</h1><p class="muted">' + nextTxt + '</p>' +
      '<div class="grid g4 kp" style="margin:14px 0"><div class="card kpi"><div class="l">Break time left</div><div class="v num">' + (rec.avail != null ? rec.avail + ' min' : '—') + '</div><div class="small muted">' + (br.next ? 'until ' + br.next.start : 'no class pending') + '</div></div>' +
      '<div class="card kpi"><div class="l">Green Points</div><div class="v num" style="color:var(--green)">' + pts + '</div><div class="small muted">' + C.level(pts).name + ' level</div></div>' +
      '<div class="card kpi"><div class="l">Active orders</div><div class="v num">' + active.length + '</div><div class="small muted">' + (active[0] ? active[0].id + ' · ' + STATUS[active[0].status][0] : 'none right now') + '</div></div>' +
      '<div class="card kpi"><div class="l">Recommended total time</div><div class="v num">' + (top ? top.need + ' min' : '—') + '</div><div class="small muted">' + (top ? 'queue ' + top.queue.wait + ' + prep ' + top.item.prep + ' + walk/eat' : 'no fitting option') + '</div></div></div>' +
      '<div class="grid g2" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><section><h2>Your break plan</h2>' +
      (top ? recCard(sf, top, rec, true) : '<div class="card"><p><b>No option fits right now.</b></p><p class="muted small">' + (rec.avail == null ? 'Add your class schedule to plan around breaks.' : rec.excluded.length + ' items checked; none fit your time, budget, diet and outlet hours. See why in AI Picks.') + '</p><button class="btn" data-a="go" data-r="ai">See all options</button></div>') +
      '</section>' +
      '<section><h2>Shortcuts</h2><div class="grid g2 keep2" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + [['marketplace', 'Find food', 'store'], ['stations', 'Pickup stations', 'box'], ['sustain', 'Green action', 'leaf'], ['rewards', 'Rewards', 'gift']].map(s => '<button class="btn" style="min-height:64px" data-a="go" data-r="' + s[0] + '">' + ic(s[2]) + s[1] + '</button>').join('') + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>Next reward</h3>' + (nextR ? '<div class="row between small"><span>' + esc(nextR.name) + '</span><span class="num">' + pts + ' / ' + nextR.cost + '</span></div><div class="bar" style="margin-top:6px"><i style="width:' + Math.min(100, pts / nextR.cost * 100) + '%;background:var(--green)"></i></div>' : '<p class="small">You can redeem every reward in the catalogue.</p>') + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>Recent activity</h3>' + (active.length ? active.map(o => '<button class="nav" data-a="go" data-r="order" data-id="' + o.id + '"><span style="flex:1">' + o.id + ' · ' + esc(C.outlet(o.outletId).name) + '</span>' + stChip(o.status) + '</button>').join('') : '') + (notes.length ? '<div class="list small">' + notes.map(n => '<div>' + esc(n.text) + ' <span class="muted">· ' + ago(n.at) + '</span></div>').join('') + '</div>' : '<p class="small muted">No activity yet.</p>') + '</div></section></div>';
  },

  marketplace(sf) {
    const q = (sf.q || '').toLowerCase(); const cat = sf.cat || ''; const fav = sf.favOnly; const prof = C.S.profiles[sf.user];
    const br = C.nextBreak(sf.user); const from = br.from || 'stc';
    let outs = C.S.outlets.filter(o => !fav || prof.favOutlets.includes(o.id)).filter(o => !q || o.name.toLowerCase().includes(q) || o.cuisine.toLowerCase().includes(q) || C.S.items.some(i => i.outletId === o.id && i.name.toLowerCase().includes(q))).filter(o => !cat || C.S.items.some(i => i.outletId === o.id && i.cat === cat));
    const dishes = (q || cat) ? C.S.items.filter(i => (!q || i.name.toLowerCase().includes(q) || i.tags.join(' ').toLowerCase().includes(q)) && (!cat || i.cat === cat)) : [];
    return '<h1>Marketplace</h1>' +
      '<div class="tog" style="margin:8px 0" role="group" aria-label="Category"><button data-a="cat" data-c="" aria-pressed="' + !cat + '">All</button>' + CATS.map(c => '<button data-a="cat" data-c="' + c[0] + '" aria-pressed="' + (cat === c[0]) + '">' + c[1] + '</button>').join('') + '<button data-a="favOnly" aria-pressed="' + !!fav + '">' + ic('heart') + ' Favourites</button></div>' +
      (q ? '<p>Results for “' + esc(sf.q) + '” <button class="btn sm" data-a="clearq">Clear</button></p>' : '') +
      (dishes.length ? '<h2>Dishes</h2><div class="grid gauto" style="margin-bottom:18px">' + dishes.map(i => dishCard(sf, i)).join('') + '</div><h2>Restaurants</h2>' : '') +
      (outs.length ? '<div class="grid gauto">' + outs.map(o => { const qi = C.queueInfo(o.id); const w = C.walk(from, o.building); return '<div class="card">' + art(C.S.items.find(i => i.outletId === o.id).cat, o.color, true) +
        '<div class="row between" style="margin-top:10px"><h3 style="margin:0">' + esc(o.name) + '</h3><button class="ib" style="border:0" data-a="fav" data-k="outlet" data-id="' + o.id + '" aria-label="Favourite ' + esc(o.name) + '" aria-pressed="' + prof.favOutlets.includes(o.id) + '">' + ic('heart', prof.favOutlets.includes(o.id)) + '</button></div>' +
        '<div class="small muted">' + esc(o.cuisine) + ' · ' + esc(bName(o.building)) + ' · ' + stars(outletRating(o.id)) + '</div>' +
        '<div class="row small" style="margin:8px 0">' + lvlChip(qi.level) + '<span>' + (qi.open ? 'Walk ' + w + ' · queue ' + qi.wait + ' · prep ~' + qi.avgPrep + ' · total ~' + (Math.max(w, qi.wait + qi.avgPrep)) + ' min' : esc(qi.label)) + '</span></div>' +
        '<button class="btn p" style="width:100%" data-a="go" data-r="outlet" data-id="' + o.id + '">View menu</button></div>'; }).join('') + '</div>' : '<div class="empty">No restaurants match. ' + (fav ? 'You have no favourite restaurants yet.' : '') + '</div>') +
      '';
  },

  outlet(sf) {
    const o = C.outlet(sf.p.id); const qi = C.queueInfo(o.id); const items = C.S.items.filter(i => i.outletId === o.id);
    return '<div class="crumb"><button data-a="go" data-r="marketplace">← Marketplace</button></div><div class="row between"><div><h1 style="margin:0">' + esc(o.name) + '</h1><p class="muted">' + esc(o.desc) + ' · ' + esc(bName(o.building)) + ' · ' + o.open + '–' + o.close + ' weekdays</p></div>' + lvlChip(qi.level) + '</div>' +
      '<div class="card row small" style="margin-bottom:14px"><span><b>' + esc(qi.label) + '</b></span><span>Queue: ' + qi.count + ' orders · ~' + qi.wait + ' min</span><span>Typical prep ~' + qi.avgPrep + ' min</span><span class="muted">' + esc(qi.source) + '</span></div>' +
      '<div class="grid gauto">' + items.map(i => dishCard(sf, i)).join('') + '</div>';
  },

  ai(sf) {
    const sort = sf.sort || 'best'; const rec = C.recommend(sf.user, { sort, runningLate: !!sf.late }); const top = rec.list[0];
    const def = SORTS.find(s => s[0] === sort);
    return '' +
      '<div class="row" style="margin:8px 0"><div class="tog" role="group" aria-label="Rank by">' + SORTS.map(s => '<button data-a="sort" data-s="' + s[0] + '" aria-pressed="' + (sort === s[0]) + '">' + s[1] + '</button>').join('') + '</div></div>' +
      '<div class="row" style="margin-bottom:10px"><button class="cb" data-a="late" aria-pressed="' + !!sf.late + '" style="' + (sf.late ? 'background:var(--sel);color:var(--selink)' : '') + '">' + ic('clock') + ' Running Late mode: ' + (sf.late ? 'on' : 'off') + '</button><span class="small muted">' + (sf.late ? 'Only options that fit with no eating time and a ' + C.S.config.timing.runningLateBufferMin + '-min safety buffer.' : 'Allows ' + C.S.config.timing.eatBufferMin + ' min to eat.') + '</span></div>' +
      (rec.avail == null ? '' : '<p class="small">You have <b>' + rec.avail + ' min</b> before ' + esc(rec.break.next ? rec.break.next.name + ' at ' + rec.break.next.start + ' in ' + bName(rec.break.next.building) : 'your next class') + '.</p>') +
      (top ? '<h2>Best option for your next break</h2>' + recCard(sf, top, rec, true) + (rec.list.length > 1 ? '<h2 style="margin-top:18px">Alternatives</h2><div class="grid g2">' + rec.list.slice(1, 7).map(r => recCard(sf, r, rec, false)).join('') + '</div>' : '')
        : '<div class="card"><h2>Nothing fits right now</h2><p>No option meets your time, budget, dietary and allergy rules' + ((sort === 'healthiest' || sort === 'protein') ? ' with supplied nutrition data' : '') + '. We will not suggest something that might make you late or that is not confirmed safe for your allergies.</p><button class="btn" data-a="go" data-r="diet">Review dietary profile</button></div>') +
      '<details style="margin-top:14px"><summary>Why ' + rec.excluded.length + ' items were excluded</summary><table class="stack"><thead><tr><th>Item</th><th>Reason</th></tr></thead><tbody>' + rec.excluded.map(r => '<tr><td>' + esc(r.item.name) + ' <span class="muted small">' + esc(r.outlet.name) + '</span></td><td class="small">' + esc(r.excluded.join('; ')) + '</td></tr>').join('') + '</tbody></table></details>';
  },

  schedule(sf) {
    const day = sf.day != null ? sf.day : C.parts(C.now()).day; const list = (C.S.schedules[sf.user] || []).filter(c => c.day === day).sort((a, b) => C.toMin(a.start) - C.toMin(b.start));
    const warn = C.overlaps(C.S.schedules[sf.user] || []); const today = C.parts(C.now()).day === day;
    const rows = []; list.forEach((c, i) => { rows.push(c); const n = list[i + 1]; if (n && C.toMin(n.start) > C.toMin(c.end)) rows.push({ gap: true, from: c, to: n, len: C.toMin(n.start) - C.toMin(c.end) }); });
    const ed = sf.editClass || {};
    return '<h1>Class schedule</h1>' +
      '<div class="tog" role="group" aria-label="Day">' + C.DAYS.slice(0, 5).map((d, i) => '<button data-a="day" data-d="' + i + '" aria-pressed="' + (i === day) + '">' + d + '</button>').join('') + '</div>' +
      (warn.length ? '<div class="warn" style="margin-top:10px">' + warn.map(esc).join('<br>') + '</div>' : '') +
      '<div class="grid g2" style="margin-top:14px;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="card">' + (rows.length ? rows.map(r => r.gap ?
        '<div class="row between" style="padding:10px;border-radius:12px;background:var(--accsoft);margin:6px 0"><span><b>' + r.len + '-min break</b> ' + r.from.end + '–' + r.to.start + '<br><span class="small muted">' + esc(bName(r.from.building)) + ' → ' + esc(bName(r.to.building)) + ' (' + C.walk(r.from.building, r.to.building) + ' min walk)</span>' + (r.len < 20 ? '<br><span class="small" style="color:var(--amber)">Short break — options may be limited</span>' : '') + '</span>' +
        (today && C.toMin(r.to.start) > C.parts(C.now()).min ? '<button class="btn sm p" data-a="go" data-r="ai">Order for this break</button>' : '<span class="small muted">' + (today ? 'Passed' : 'Plan on the day') + '</span>') + '</div>'
        : '<div class="food" style="padding:8px 0"><div style="width:64px" class="num"><b>' + r.start + '</b><br><span class="small muted">' + r.end + '</span></div><div style="flex:1"><b>' + esc(r.name) + '</b><br><span class="small muted">' + esc(bName(r.building)) + '</span></div><button class="btn sm" data-a="editClass" data-id="' + r.id + '">Edit</button><button class="btn sm d" data-a="delClass" data-id="' + r.id + '" aria-label="Delete ' + esc(r.name) + '">' + ic('trash') + '</button></div>').join('') : '<div class="empty">No classes on ' + C.DAYS[day] + '. QuickBite will plan around your free time instead.</div>') + '</div>' +
      '<form class="card" data-form="class"><h3>' + (ed.id ? 'Edit class' : 'Add a class') + '</h3><input type="hidden" name="id" value="' + esc(ed.id || '') + '">' +
      '<label class="f" for="cn-' + sf.id + '">Class name</label><input type="text" id="cn-' + sf.id + '" name="name" required value="' + esc(ed.name || '') + '">' +
      '<label class="f" for="cd-' + sf.id + '">Day</label><select id="cd-' + sf.id + '" name="day">' + C.DAYS.slice(0, 5).map((d, i) => '<option value="' + i + '"' + ((ed.day != null ? ed.day : day) === i ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>' +
      '<div class="grid g2" style="grid-template-columns:1fr 1fr"><div><label class="f" for="cs-' + sf.id + '">Start</label><input type="time" id="cs-' + sf.id + '" name="start" required value="' + esc(ed.start || '') + '"></div><div><label class="f" for="ce-' + sf.id + '">End</label><input type="time" id="ce-' + sf.id + '" name="end" required value="' + esc(ed.end || '') + '"></div></div>' +
      '<label class="f" for="cb-' + sf.id + '">Building</label><select id="cb-' + sf.id + '" name="building">' + C.S.buildings.map(b => '<option value="' + b.id + '"' + (ed.building === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select>' +
      '<div class="row" style="margin-top:12px"><button class="btn p">' + (ed.id ? 'Save changes' : 'Add class') + '</button>' + (ed.id ? '<button type="button" class="btn" data-a="cancelEdit">Cancel</button>' : '') + '</div>' +
      '</form></div>';
  },

  diet(sf) {
    const p = C.S.profiles[sf.user]; const rec = C.recommend(sf.user, {});
    return '<h1>Dietary profile</h1>' +
      '<form data-form="diet" class="grid g2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="card"><h3>Preferences</h3><div class="chips">' + C.PREFS.map(x => '<label class="cb"><input type="checkbox" name="prefs" value="' + x + '"' + (p.prefs.includes(x) ? ' checked' : '') + '>' + x + (C.HARD_PREFS.includes(x) ? '' : '') + '</label>').join('') + '</div>' +
      '' +
      '<h3 style="margin-top:14px">Allergies</h3><div class="chips">' + C.ALLERGENS.map(x => '<label class="cb"><input type="checkbox" name="allergies" value="' + x + '"' + (p.allergies.includes(x) ? ' checked' : '') + '>' + x + '</label>').join('') + '</div>' +
      '<label class="f" for="bud-' + sf.id + '">Meal budget: <output>' + aed(p.budget) + '</output></label><input type="range" id="bud-' + sf.id + '" name="budget" min="10" max="80" step="1" value="' + (p.budget || 35) + '" oninput="this.previousElementSibling.firstElementChild.textContent=\'AED \'+this.value">' +
      '<label class="f" for="brk-' + sf.id + '">Typical break length: <output>' + (p.breakLen || 30) + ' min</output></label><input type="range" id="brk-' + sf.id + '" name="breakLen" min="10" max="90" step="5" value="' + (p.breakLen || 30) + '" oninput="this.previousElementSibling.firstElementChild.textContent=this.value+\' min\'">' +
      '<button class="btn p" style="margin-top:14px">Save profile</button></div>' +
      '<div class="card"><h3>Recommendation preview</h3>' + (rec.list.slice(0, 3).map(r => '<div class="food" style="margin:10px 0">' + art(r.item.cat, r.outlet.color) + '<div><b>' + esc(r.item.name) + '</b><br>' + diningLine(r) + '</div></div>').join('') || '<p class="muted">No item currently fits.</p>') + '<button type="button" class="btn" data-a="go" data-r="ai">See all recommendations</button></div></form>';
  },

  cart(sf) {
    const c = C.cart(sf.user);
    if (!c.lines.length) return '<h1>Cart</h1><div class="card empty">Your cart is empty.<br><br><button class="btn p" data-a="go" data-r="marketplace">Find food</button></div>';
    sf.co = sf.co || { method: 'counter', idem: 'co-' + Date.now() };
    const q = C.quote(sf.user, { method: sf.co.method, stationId: sf.co.stationId, slot: sf.co.slot }); const o = q.outlet;
    return '<h1>Checkout</h1><p class="muted">' + esc(o.name) + '</p>' +
      (q.offer ? '<div class="ok">SmartSave portion held for you. <button class="btn sm" data-a="releaseClaim">Release it</button></div>' : '') +
      '<div class="grid g2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);margin-top:12px"><div class="stack"><div class="card"><h3>Items</h3>' + q.lines.map(l => { const it = C.item(l.itemId); return '<div class="food" style="padding:8px 0;border-bottom:1px solid var(--line)">' + art(it.cat, o.color) + '<div style="flex:1"><div class="row between"><b>' + esc(l.name) + '</b><span class="price">' + aed(l.lineTotal) + '</span></div><div class="small muted">' + aed(l.price) + ' each · ' + (it.allergens ? 'Contains: ' + esc(it.allergens.join(', ') || 'none declared') : '<span style="color:var(--amber)">Allergens not declared</span>') + '</div>' +
        (q.offer ? '' : '<div class="row" style="margin-top:6px"><button class="btn sm" data-a="qty" data-id="' + l.itemId + '" data-n="-1" aria-label="Decrease">−</button><span class="num">' + l.qty + '</span><button class="btn sm" data-a="qty" data-id="' + l.itemId + '" data-n="1" aria-label="Increase">+</button><button class="btn sm d" data-a="qty" data-id="' + l.itemId + '" data-n="-99">Remove</button></div>') +
        '<label class="f small" for="nt-' + sf.id + l.itemId + '">Special instructions</label><input type="text" id="nt-' + sf.id + l.itemId + '" data-ch="note" data-id="' + l.itemId + '" value="' + esc(l.note) + '" maxlength="140" placeholder="e.g. no onions"></div></div>'; }).join('') + '</div>' +
      '<div class="card"><h3>Collection</h3><div class="tog" role="group" aria-label="Collection method"><button data-a="method" data-m="counter" aria-pressed="' + (q.method === 'counter') + '">Counter pickup</button><button data-a="method" data-m="station" aria-pressed="' + (q.method === 'station') + '">Pickup station</button></div>' +
      (q.method === 'station' ? '<label class="f" for="stn-' + sf.id + '">Station</label><select id="stn-' + sf.id + '" data-ch="station"><option value="">Choose…</option>' + C.S.stations.map(s => { const free = C.S.compartments.filter(x => x.stationId === s.id && x.state === 'free').length; return '<option value="' + s.id + '"' + (sf.co.stationId === s.id ? ' selected' : '') + (s.state !== 'operational' || !free ? ' disabled' : '') + '>' + esc(s.name) + ' — ' + (s.state !== 'operational' ? s.state : free + ' free') + '</option>'; }).join('') + '</select>' : '') +
      '<label class="f" for="slot-' + sf.id + '">Collection slot</label><select id="slot-' + sf.id + '" data-ch="slot">' + q.slots.map(s => '<option value="' + s.slot + '"' + (s.slot === q.slot ? ' selected' : '') + (s.full ? ' disabled' : '') + '>' + s.slot + (s.full ? ' — full' : ' — ' + (s.cap - s.used) + ' of ' + s.cap + ' left') + '</option>').join('') + '</select>' +
      (o.reusable ? '<label class="cb" style="margin-top:10px"><input type="checkbox" data-ch="reusable"' + (sf.co.reusable ? ' checked' : '') + '>I’ll bring a reusable container (outlet verifies at pickup)</label>' : '') + '</div></div>' +
      '<div class="card"><h3>Summary</h3><table><tbody><tr><td>Subtotal</td><td class="r num">' + aed(q.subtotal + q.discount) + '</td></tr>' + (q.discount ? '<tr><td>SmartSave discount</td><td class="r num">−' + aed(q.discount) + '</td></tr>' : '') +
      '<tr><th>Total</th><th class="r num" style="font-size:18px;color:var(--ink)">' + aed(q.total) + '</th></tr></tbody></table>' +
      '<p class="small">Ready in about <b>' + q.readyIn + ' min</b> (estimate). Slot ' + esc(q.slot || '—') + '.</p>' +
      (q.problems.length ? '<div class="bad">' + q.problems.map(esc).join('<br>') + '</div>' : '') +
      (q.warnings.length ? '<div class="warn" style="margin-top:8px"><b>Dietary warnings</b><br>' + q.warnings.map(esc).join('<br>') + '<label class="cb" style="margin-top:8px;background:none"><input type="checkbox" data-ch="ack"' + (sf.co.ack ? ' checked' : '') + '>I understand these warnings</label></div>' : '') +
      '' +
      
      '<button class="btn p" style="width:100%;margin-top:8px" data-a="place"' + (q.problems.length ? ' disabled' : '') + '>Place order · ' + aed(q.total) + '</button></div></div>';
  },

  orders(sf) {
    const os = C.myOrders(sf.user); const act = os.filter(o => ['submitted', 'accepted', 'preparing', 'ready'].includes(o.status)); const past = os.filter(o => !act.includes(o));
    const row = o => '<button class="card" style="width:100%;text-align:left;display:block;margin-bottom:10px" data-a="go" data-r="order" data-id="' + o.id + '"><div class="row between"><b>' + o.id + ' · ' + esc(C.outlet(o.outletId).name) + '</b>' + stChip(o.status) + '</div><div class="small muted">' + o.lines.map(l => l.qty + '× ' + esc(l.name)).join(', ') + ' · ' + aed(o.total) + ' · ' + (o.method === 'station' ? 'Station' : 'Counter') + ' ' + o.slot + ' · ' + dayTime(o.createdAt) + '</div></button>';
    return '<h1>Orders</h1>' + (os.length ? '<h2>Active</h2>' + (act.map(row).join('') || '<p class="muted">No active orders.</p>') + '<h2 style="margin-top:16px">History</h2>' + (past.map(row).join('') || '<p class="muted">No past orders yet.</p>') : '<div class="card empty">No orders yet. <br><br><button class="btn p" data-a="go" data-r="ai">Get a recommendation</button></div>');
  },

  order(sf) {
    let o; try { o = C.getOrder(sf.user, sf.p.id); } catch (e) { return '<div class="bad">' + esc(e.message) + '</div>'; }
    const flow = ['submitted', 'accepted', 'preparing', 'ready', 'completed']; const idx = flow.indexOf(o.status === 'collected' ? 'completed' : o.status);
    const st = o.stationId && C.S.stations.find(s => s.id === o.stationId); const comp = o.compartmentId && C.S.compartments.find(c => c.id === o.compartmentId);
    const placed = comp && comp.state === 'occupied' && comp.orderId === o.id;
    return '<div class="crumb"><button data-a="go" data-r="orders">← Orders</button></div><div class="row between"><h1 style="margin:0">' + o.id + '</h1><div class="row">' + stChip(o.status) + payChip(o.payment) + '</div></div><p class="muted">' + esc(C.outlet(o.outletId).name) + ' · placed ' + dayTime(o.createdAt) + '</p>' +
      (idx >= 0 ? '<div class="steps">' + flow.map((s, i) => '<div class="' + (i <= idx ? 'on' : '') + '"><i></i>' + STATUS[s][0] + '</div>').join('') + '</div>' : '<div class="bad">This order was ' + esc(STATUS[o.status][0].toLowerCase()) + '. ' + (o.events[o.events.length - 1].note ? 'Reason: ' + esc(o.events[o.events.length - 1].note) + '. ' : '') + (o.payment === 'sim_voided' ? 'Payment voided — nothing charged.' : '') + ' <button class="btn sm" data-a="reorder" data-id="' + o.id + '">Order again</button></div>') +
      '<div class="grid g2" style="margin-top:12px"><div class="card"><h3>Details</h3><table><tbody>' + o.lines.map(l => '<tr><td>' + l.qty + '× ' + esc(l.name) + (l.note ? '<br><span class="small muted">“' + esc(l.note) + '”</span>' : '') + '</td><td class="r num">' + aed(l.lineTotal) + '</td></tr>').join('') + (o.discount ? '<tr><td>SmartSave discount applied</td><td class="r num">−' + aed(o.discount) + '</td></tr>' : '') + '<tr><th>Total</th><th class="r num">' + aed(o.total) + '</th></tr></tbody></table>' +
      '<p class="small">' + (o.method === 'station' ? 'Pickup station: <b>' + esc(st.name) + '</b>, compartment ' + comp.n : 'Counter pickup at ' + esc(C.outlet(o.outletId).name)) + ' · slot ' + o.slot + '<br>Estimated ready: <b>' + timeOf(o.readyBy) + '</b>' + (o.delay ? ' (delayed ' + o.delay + ' min)' : '') + '</p>' +
      (['submitted', 'accepted'].includes(o.status) ? '<button class="btn d" data-a="cancelOrder" data-id="' + o.id + '">Cancel order</button>' : '') + '</div>' +
      '<div class="card">' + (['submitted', 'accepted', 'preparing', 'ready'].includes(o.status) ? '<h3>Collection code</h3><div class="row">' + pseudoQR(o.token) + '<div><div style="font-size:28px;font-weight:800;letter-spacing:.12em" class="num">' + o.token + '</div><p class="small muted">Show this at the counter' + (o.method === 'station' ? ' or use it at the station' : '') + '. One use only.</p></div></div>' +
        (o.method === 'station' ? (placed ? '<div class="ok" style="margin-top:8px">Your meal is in compartment ' + comp.n + '.</div><button class="btn p" style="margin-top:8px" data-a="stationScan" data-id="' + o.id + '">Open compartment</button>' : '<p class="small muted">The compartment opens after the restaurant places your meal.</p>') : '')
        : o.status === 'completed' ? (o.reviewed ? '<h3>Thanks for your rating</h3>' : '<form data-form="review" data-id="' + o.id + '"><h3>Rate your meal</h3><div class="tog" role="radiogroup" aria-label="Rating">' + [1, 2, 3, 4, 5].map(n => '<label class="cb"><input type="radio" name="rating" value="' + n + '"' + (n === 5 ? ' checked' : '') + '>' + n + '★</label>').join('') + '</div><label class="f" for="rv-' + sf.id + '">Comment (optional)</label><textarea id="rv-' + sf.id + '" name="text" maxlength="300"></textarea><button class="btn p" style="margin-top:8px">Submit rating</button></form>') + '<button class="btn" style="margin-top:10px" data-a="reorder" data-id="' + o.id + '">Order again</button>' : '<h3>Order closed</h3>') + '</div></div>' +
      '<details style="margin-top:14px"><summary>Status history</summary><div class="list small">' + o.events.map(e => '<div>' + dayTime(e.at) + ' · <b>' + esc(e.s) + '</b>' + (e.note ? ' — ' + esc(e.note) : '') + '</div>').join('') + '</div></details>';
  },

  queue(sf) {
    return '<h1>Queue</h1><div class="card scroll"><table class="stack"><thead><tr><th>Outlet</th><th class="r">In queue</th><th class="r">Queue wait</th><th class="r">Prep</th><th class="r">Est. total</th><th>Status</th><th></th></tr></thead><tbody>' +
      C.S.outlets.map(o => { const q = C.queueInfo(o.id); return '<tr><td><b>' + esc(o.name) + '</b><br><span class="small muted">' + esc(q.label) + '</span></td><td class="r num">' + (q.open ? q.count : '—') + '</td><td class="r num">' + (q.open ? q.wait + ' min' : '—') + '</td><td class="r num">' + q.avgPrep + ' min</td><td class="r num">' + (q.open ? q.total + ' min' : '—') + '</td><td>' + lvlChip(q.level) + '</td><td><button class="btn sm" data-a="go" data-r="outlet" data-id="' + o.id + '">Menu</button></td></tr>'; }).join('') + '</tbody></table></div>';
  },

  stations(sf) {
    const S = C.S; const comps = S.compartments; const free = comps.filter(c => c.state === 'free').length;
    return '<h1>Pickup stations</h1>' +
      '<div class="grid g4 kp" style="margin:14px 0">' + [['Stations', S.stations.length], ['Compartments', comps.length], ['Available now', free], ['Operational', S.stations.filter(s => s.state === 'operational').length + ' of ' + S.stations.length]].map(k => '<div class="card kpi"><div class="l">' + k[0] + '</div><div class="v num">' + k[1] + '</div></div>').join('') + '</div>' +
      '<div class="grid g2">' + S.stations.map(s => { const cs = comps.filter(c => c.stationId === s.id); const occ = cs.filter(c => c.state !== 'free').length; return '<div class="card"><div class="row between"><h3 style="margin:0">' + esc(s.name) + '</h3><span class="chip ' + ({ operational: 'g', maintenance: 'a', offline: 'r' }[s.state]) + '">' + s.state + '</span></div><p class="small muted">' + esc(bName(s.building)) + ' · ' + s.hours + '</p>' +
        '<div class="row between small"><span>' + (cs.length - occ) + ' free · ' + occ + ' occupied</span><span>' + Math.round(occ / cs.length * 100) + '% used</span></div><div class="bar" style="margin:6px 0 10px"><i style="width:' + occ / cs.length * 100 + '%"></i></div>' +
        '<div class="comps">' + cs.map(c => '<i class="' + (c.state === 'free' ? 'free' : c.state === 'reserved' ? 'res' : 'occ') + '" title="Compartment ' + c.n + ': ' + c.state + '">' + c.n + '</i>').join('') + '</div>' +
        '</div>'; }).join('') + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>How collection works (concept)</h3><p class="small">1. Choose a station at checkout — a compartment is reserved. 2. The restaurant places your meal and confirms. 3. You get a notification. 4. Your one-time code opens the compartment. 5. Capacity is released.</p></div>' +
      '';
  },

  smartsave(sf) {
    const offers = C.S.offers.filter(f => f.status === 'active'); const live = offers.filter(C.offerLive);
    return '<h1>SmartSave</h1>' +
      '<div class="grid g3" style="margin:14px 0">' + [['Deals live', live.length], ['Meals available', live.reduce((a, f) => a + f.remaining, 0)], ['Points per SmartSave meal', C.GREEN_TYPES.find(g => g.id === 'smartsave').pts]].map(k => '<div class="card kpi"><div class="l">' + k[0] + '</div><div class="v num">' + k[1] + '</div></div>').join('') + '</div>' +
      (offers.length ? '<div class="grid gauto">' + offers.map(f => { const it = C.item(f.itemId); const o = C.outlet(f.outletId); const ok = C.offerLive(f); return '<div class="card">' + art(it.cat, o.color, true) + '<h3 style="margin:10px 0 0">' + esc(it.name) + '</h3><div class="small muted">' + esc(o.name) + '</div><div class="row" style="margin:6px 0"><span class="price" style="font-size:20px">' + aed(f.price) + '</span><span class="strike">' + aed(f.orig) + '</span><span class="chip o">−' + Math.round((1 - f.price / f.orig) * 100) + '%</span></div><div class="chips">' + it.tags.slice(0, 3).map(t => '<span class="chip g">' + t + '</span>').join('') + '</div><p class="small">' + f.remaining + ' of ' + f.qty + ' left · order by ' + f.validUntil + ' · collect by ' + f.collectBy + '</p><button class="btn p" style="width:100%" data-a="claim" data-id="' + f.id + '"' + (ok ? '' : ' disabled') + '>' + (ok ? 'Claim & check out' : f.remaining ? 'Expired' : 'Sold out') + '</button></div>'; }).join('') + '</div>' : '<div class="card empty">No SmartSave deals right now.</div>');
  },

  sustain(sf) {
    const L = C.S.ledger.filter(l => l.userId === sf.user); const ev = C.S.evidence.filter(e => e.userId === sf.user);
    const cnt = t => L.filter(l => l.type === t && l.delta > 0).length; const orders = C.myOrders(sf.user).filter(o => o.status === 'completed');
    return '<h1>Sustainability</h1>' +
      '<div class="grid g4 kp" style="margin:14px 0">' + [['Green actions completed', L.filter(l => l.type && l.delta > 0).length], ['Sustainable orders', orders.filter(o => o.method === 'station' || o.offerId || o.reusable).length], ['Waste actions', cnt('waste') + cnt('lowwaste')], ['Points earned', L.filter(l => l.delta > 0).reduce((a, l) => a + l.delta, 0)]].map(k => '<div class="card kpi"><div class="l">' + k[0] + '</div><div class="v num">' + k[1] + '</div></div>').join('') + '</div>' +
      '<div class="grid g2"><form class="card" data-form="evidence"><h2>Show your green action</h2><label class="f" for="et-' + sf.id + '">Action</label><select id="et-' + sf.id + '" name="type">' + C.GREEN_TYPES.map(g => '<option value="' + g.id + '"' + (g.verifier === 'deferred' || g.verifier === 'auto-order' ? ' disabled' : '') + '>' + g.name + ' · ' + g.pts + ' pts' + (g.verifier === 'auto-order' ? ' (automatic on order)' : '') + '</option>').join('') + '</select>' +
      '<label class="f" for="eo-' + sf.id + '">Where (for reusable container)</label><select id="eo-' + sf.id + '" name="outletId"><option value="">Not at an outlet</option>' + C.S.outlets.filter(o => o.reusable).map(o => '<option value="' + o.id + '">' + esc(o.name) + '</option>').join('') + '</select>' +
      '<label class="f" for="ef-' + sf.id + '">Photo</label><input type="file" id="ef-' + sf.id + '" name="photo" accept="image/*" capture="environment">' +
      '<label class="f" for="ec-' + sf.id + '">or Smart Green Station code</label><input type="text" id="ec-' + sf.id + '" name="code" placeholder="e.g. GS-STC-01">' +
      '<button class="btn p" style="margin-top:12px">Submit for verification</button></form>' +
      '<div class="card"><h2>Your submissions</h2>' + (ev.length ? '<div class="list">' + ev.map(e => '<div><div class="row between"><b>' + esc(C.GREEN_TYPES.find(g => g.id === e.type).name) + '</b><span class="chip ' + ({ pending: 'a', verified: 'g', rejected: 'r' }[e.status]) + '">' + e.status + '</span></div><div class="small muted">' + dayTime(e.at) + (e.file ? ' · ' + esc(e.file) : '') + (e.code ? ' · ' + esc(e.code) : '') + (e.note ? ' · ' + esc(e.note) : '') + '</div>' + '' + '</div>').join('') + '</div>' : '<p class="muted">Nothing submitted yet.</p>') +
      '<h3 style="margin-top:14px">Smart Green Stations</h3>' + C.S.greenStations.map(g => '<p class="small"><b>' + esc(g.name) + '</b><br>Code: <span class="num">' + g.code + '</span> · <button class="btn sm" data-a="go" data-r="map">On map</button></p>').join('') + '</div></div>' +
      '<h2 style="margin-top:18px">Badges</h2><div class="grid gauto">' + C.badges(sf.user).map(b => '<div class="card"><div class="row between"><b>' + b.name + '</b><span class="chip ' + (b.got ? 'g' : 'x') + '">' + (b.got ? 'Earned' : 'Locked') + '</span></div><div class="small muted">' + esc(b.how) + '</div></div>').join('') + '</div>';
  },

  rewards(sf) {
    const pts = C.balance(sf.user); const lv = C.level(pts); const L = C.S.ledger.filter(l => l.userId === sf.user); const red = C.S.redemptions.filter(r => r.userId === sf.user);
    return '<h1>Rewards</h1><div class="card hero"><div class="row between"><div><div class="small muted">Green Points balance</div><div style="font-size:40px;font-weight:800;color:var(--green)" class="num">' + pts + '</div></div><div style="min-width:220px;flex:1;max-width:360px"><div class="row between small"><b>' + lv.name + '</b><span>' + (lv.next ? (lv.need - pts) + ' to ' + lv.next : 'Top level') + '</span></div><div class="bar"><i style="width:' + (lv.next ? (pts - lv.from) / (lv.need - lv.from) * 100 : 100) + '%;background:var(--green)"></i></div></div></div></div>' +
      '<h2 style="margin-top:16px">Available rewards</h2><div class="grid gauto">' + C.S.rewards.map(r => { const can = pts >= r.cost && r.stock > 0; return '<div class="card"><h3>' + esc(r.name) + '</h3><div class="row"><span class="chip ' + (can ? 'g' : 'x') + '">' + r.cost + ' pts</span><span class="small muted">' + r.stock + ' in stock</span></div><p class="small muted">' + esc(r.terms) + '<br>Where: ' + esc(r.outlets) + '</p><button class="btn' + (can ? ' p' : '') + '" data-a="redeemAsk" data-id="' + r.id + '"' + (can ? '' : ' disabled') + '>' + (r.stock <= 0 ? 'Out of stock' : can ? 'Redeem' : 'Locked — ' + (r.cost - pts) + ' more') + '</button></div>'; }).join('') + '</div>' +
      '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Redeemed</h3>' + (red.length ? '<div class="list">' + red.map(r => '<div class="row between"><span>' + esc(r.name) + '<br><span class="small muted">' + dayTime(r.at) + '</span></span><b class="num">' + r.code + '</b></div>').join('') + '</div>' : '<p class="muted small">No redemptions yet.</p>') + '</div>' +
      '<div class="card"><h3>Points history</h3><div class="list">' + L.slice(0, 12).map(l => '<div class="row between small"><span>' + esc(l.reason) + '<br><span class="muted">' + dayTime(l.at) + '</span></span><b class="num" style="color:' + (l.delta > 0 ? 'var(--green)' : 'var(--red)') + '">' + (l.delta > 0 ? '+' : '') + l.delta + '</b></div>').join('') + '</div></div></div>';
  },

  map(sf) {
    const S = C.S; const sel = sf.mapSel;
    const B = id => S.buildings.find(b => b.id === id);
    let marks = S.buildings.map(b => '<g><rect x="' + (b.x - 9) + '" y="' + (b.y - 6) + '" width="18" height="12" rx="2" fill="var(--card)" stroke="var(--line)" stroke-width=".5"/><text x="' + b.x + '" y="' + (b.y + 10) + '" font-size="3" text-anchor="middle" fill="var(--muted)">' + esc(b.name) + '</text></g>').join('');
    const pin = (x, y, c, k, id, label, shape) => '<g style="cursor:pointer" data-a="mapSel" data-k="' + k + '" data-id="' + id + '" role="button" aria-label="' + esc(label) + '">' + (shape === 'sq' ? '<rect x="' + (x - 2.2) + '" y="' + (y - 2.2) + '" width="4.4" height="4.4" rx="1" fill="' + c + '" stroke="#fff" stroke-width=".6"/>' : '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="' + c + '" stroke="#fff" stroke-width=".6"/>') + '</g>';
    S.outlets.forEach((o, i) => { const b = B(o.building); marks += pin(b.x - 5 + i % 2 * 3, b.y - 1, o.color, 'outlet', o.id, o.name); });
    S.stations.forEach(s => { const b = B(s.building); marks += pin(b.x + 5, b.y - 1, '#0f2a43', 'station', s.id, s.name, 'sq'); });
    S.greenStations.forEach(g => { const b = B(g.building); marks += pin(b.x + 5, b.y + 3.5, '#16a34a', 'green', g.id, g.name); });
    let det = '<p class="muted">Select a pin to see details.</p>';
    if (sel) { if (sel.k === 'outlet') { const o = C.outlet(sel.id); const q = C.queueInfo(o.id); det = '<h3>' + esc(o.name) + '</h3><p class="small">' + esc(bName(o.building)) + ' · ' + esc(q.label) + '</p><button class="btn p" data-a="go" data-r="outlet" data-id="' + o.id + '">View menu</button>'; } else if (sel.k === 'station') { const s = S.stations.find(x => x.id === sel.id); det = '<h3>' + esc(s.name) + '</h3><p class="small">' + s.state + ' · ' + s.hours + '</p><button class="btn" data-a="go" data-r="stations">Station details</button>'; } else { const g = S.greenStations.find(x => x.id === sel.id); det = '<h3>' + esc(g.name) + '</h3><p class="small">Record waste-sorting actions with code ' + g.code + '.</p><button class="btn" data-a="go" data-r="sustain">Record action</button>'; } }
    return '<h1>Campus map</h1><div class="grid g2" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="mapw"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path d="M5 50H95M50 5V95M20 20L80 80" stroke="var(--line)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' + marks + '</svg></div><div class="card">' + det + '<div class="tlk" style="margin-top:14px"><span><i style="background:#0d9488;border-radius:50%"></i>Restaurant</span><span><i style="background:#0f2a43"></i>Pickup station</span><span><i style="background:#16a34a;border-radius:50%"></i>Green station</span></div></div></div>';
  },

  profile(sf) {
    const u = C.user(sf.user); const p = C.S.profiles[sf.user]; const np = sf.np || (sf.np = { reminders: true, promo: false });
    return '<h1>Profile</h1><div class="grid g2"><div class="card"><h3>Account</h3><p>' + esc(u.full) + '<br><span class="small muted">Student account</span></p><button class="btn" data-a="signout">Sign out</button></div>' +
      '<div class="card"><h3>Favourites</h3><p class="small"><b>Restaurants:</b> ' + (p.favOutlets.map(id => esc(C.outlet(id).name)).join(', ') || 'none') + '<br><b>Dishes:</b> ' + (p.favItems.map(id => esc(C.item(id).name)).join(', ') || 'none') + '</p></div>' +
      '<div class="card"><h3>Green Points & rewards</h3><p><b class="num" style="color:var(--green)">' + C.balance(sf.user) + '</b> points</p><button class="btn" data-a="go" data-r="rewards">Open rewards</button></div>' +
      '<div class="card"><h3>Planning</h3><div class="row"><button class="btn" data-a="go" data-r="diet">Dietary profile</button><button class="btn" data-a="go" data-r="schedule">Class schedule</button></div></div>' +
      '<div class="card"><h3>Payment</h3><p class="small muted">No saved payment methods.</p></div>' +
      '<div class="card"><h3>Notifications</h3><p class="small">Order updates (transactional): always on</p><label class="cb"><input type="checkbox" data-ch="np" data-k="reminders"' + (np.reminders ? ' checked' : '') + '>Break reminders</label> <label class="cb"><input type="checkbox" data-ch="np" data-k="promo"' + (np.promo ? ' checked' : '') + '>Deals & promotions</label></div>' +
      '<div class="card"><h3>Privacy</h3><p class="small">Restaurants only see your first name, order items and dietary warnings on that order — never your schedule or full profile.</p><div class="row"><button class="btn" data-a="exportMe">Copy my data (JSON)</button><button class="btn" data-a="reset">Reset sample data</button></div></div>' +
      '<div class="card"><h3>Help</h3><p class="small muted">Ask at any participating outlet for help with an order.</p></div></div>';
  },
};
function dishCard(sf, i) {
  const o = C.outlet(i.outletId); const d = C.dietCheck(sf.user, i); const prof = C.S.profiles[sf.user]; const unavailable = i.status !== 'available' || i.stock === 0;
  return '<div class="card"><div class="food">' + art(i.cat, o.color) + '<div style="flex:1"><div class="row between"><b>' + esc(i.name) + '</b><span class="price">' + aed(i.price) + '</span></div><div class="small muted">' + esc(o.name) + ' · prep ~' + i.prep + ' min' + (i.stock != null && i.stock > 0 ? ' · ' + i.stock + ' left' : '') + '</div></div></div>' +
    '<div class="chips" style="margin:8px 0">' + i.tags.map(t => '<span class="chip g">' + esc(t) + '</span>').join('') + '</div>' +
    '<div class="small">' + (i.allergens ? 'Contains: ' + (i.allergens.length ? esc(i.allergens.join(', ')) : 'no major allergens declared') : '<span style="color:var(--amber);font-weight:700">Allergens not declared — ask the outlet</span>') + '</div>' +
    (d.block.length || d.warn.length ? '<div class="warn" style="margin-top:6px;padding:6px 10px">' + d.block.concat(d.warn).map(esc).join('<br>') + '</div>' : '') +
    '<div class="row" style="margin-top:10px">' + (unavailable ? '<span class="chip r">' + (i.status === 'unavailable' ? 'Unavailable' : 'Sold out') + '</span>' : '<button class="btn p sm" data-a="add" data-id="' + i.id + '">Add to cart</button>') + '<button class="btn sm" data-a="itemInfo" data-id="' + i.id + '">Details</button><button class="ib" style="border:0;height:36px" data-a="fav" data-k="item" data-id="' + i.id + '" aria-label="Favourite ' + esc(i.name) + '" aria-pressed="' + prof.favItems.includes(i.id) + '">' + ic('heart', prof.favItems.includes(i.id)) + '</button></div></div>';
}
const STU_MODALS = {
  item(sf, m) {
    const i = C.item(m.id); const o = C.outlet(i.outletId);
    return '<div class="row between"><h2>' + esc(i.name) + '</h2><button class="btn sm" data-a="close">Close</button></div>' + art(i.cat, o.color, true) + '<p>' + esc(i.desc) + '</p><table><tbody><tr><td>Outlet</td><td>' + esc(o.name) + '</td></tr><tr><td>Price</td><td>' + aed(i.price) + '</td></tr><tr><td>Preparation</td><td>~' + i.prep + ' min</td></tr><tr><td>Ingredients</td><td>' + (i.ingredients ? esc(i.ingredients) : '<span class="muted">Not supplied</span>') + '</td></tr><tr><td>Declared allergens</td><td>' + (i.allergens ? esc(i.allergens.join(', ') || 'None declared') : '<b style="color:var(--amber)">Not declared</b>') + '</td></tr><tr><td>Nutrition</td><td>' + (i.nutrition ? i.nutrition.kcal + ' kcal · ' + i.nutrition.protein + ' g protein<br><span class="small muted">' + esc(i.nutrition.supplied) + '</span>' : '<span class="muted">Not supplied by outlet</span>') + '</td></tr><tr><td>Collection</td><td>Counter or pickup station</td></tr></tbody></table>' + (i.status === 'available' && i.stock !== 0 ? '<button class="btn p" data-a="add" data-id="' + i.id + '">Add to cart</button>' : '');
  },
  fit(sf, m) {
    const rec = C.recommend(sf.user, { runningLate: !!sf.late }); const r = rec.list.concat(rec.excluded).find(x => x.item.id === m.id); const cfg = C.S.config.timing; const br = rec.break;
    const walkTo = C.walk(br.from || 'stc', r.outlet.building), walkBack = C.walk(r.outlet.building, br.to || r.outlet.building);
    return '<div class="row between"><h2>Schedule fit</h2><button class="btn sm" data-a="close">Close</button></div><p><b>' + esc(r.item.name) + '</b> from ' + esc(r.outlet.name) + '</p><table><tbody>' +
      '<tr><td>Time available</td><td class="r num">' + (rec.avail != null ? rec.avail + ' min' : 'no class limit') + '</td></tr><tr><td>Order lead</td><td class="r num">' + cfg.orderLeadMin + ' min</td></tr><tr><td>Queue wait</td><td class="r num">' + r.queue.wait + ' min</td></tr><tr><td>Preparation</td><td class="r num">' + r.item.prep + ' min</td></tr><tr><td>Walk ' + esc(bName(br.from || 'stc')) + ' → outlet (in parallel with prep)</td><td class="r num">' + walkTo + ' min</td></tr><tr><td>Time to eat</td><td class="r num">' + (sf.late ? 0 : cfg.eatBufferMin) + ' min</td></tr><tr><td>Walk to ' + esc(bName(br.to || r.outlet.building)) + '</td><td class="r num">' + walkBack + ' min</td></tr>' + (sf.late ? '<tr><td>Running-late buffer</td><td class="r num">' + cfg.runningLateBufferMin + ' min</td></tr>' : '') + '<tr><th>Total needed</th><th class="r num">' + r.need + ' min</th></tr></tbody></table>' +
      (r.fits === false ? '<div class="bad">Does not fit: ' + esc(r.excluded.join('; ')) + '</div>' : r.excluded.length ? '<div class="warn">' + esc(r.excluded.join('; ')) + '</div>' : '<div class="ok">Fits your break.</div>') + '';
  },
  redeem(sf, m) { const r = C.S.rewards.find(x => x.id === m.id); return '<h2>Redeem ' + esc(r.name) + '?</h2><p>This uses <b>' + r.cost + '</b> of your ' + C.balance(sf.user) + ' points.</p><p class="small muted">' + esc(r.terms) + '</p><div class="row"><button class="btn p" data-a="redeem" data-id="' + r.id + '" data-k="' + m.key + '">Confirm</button><button class="btn" data-a="close">Cancel</button></div>'; },
  scan(sf, m) { const o = C.getOrder(sf.user, m.id); return '<h2>Open compartment</h2><p class="small">Enter or confirm your collection code.</p><form data-form="scan" data-id="' + o.id + '"><label class="f" for="sc-' + sf.id + '">Collection code</label><input type="text" id="sc-' + sf.id + '" name="code" value="' + o.token + '" autocomplete="off"><div class="row" style="margin-top:10px"><button class="btn p">Open</button><button type="button" class="btn" data-a="close">Cancel</button></div></form>'; },
  copy(sf, m) { return '<div class="row between"><h2>' + esc(m.title) + '</h2><button class="btn sm" data-a="close">Close</button></div><textarea style="min-height:240px;font-size:12px" readonly id="cp-' + sf.id + '">' + esc(m.text) + '</textarea><button class="btn p" style="margin-top:8px" data-a="copyNow" data-t="cp-' + sf.id + '">Copy to clipboard</button>'; },
};

Object.assign(ACTIONS, {
  cat: (sf, d) => { sf.cat = d.c; }, favOnly: sf => { sf.favOnly = !sf.favOnly; }, clearq: sf => { sf.q = ''; },
  fav: (sf, d) => run(sf, () => C.toggleFav(sf.user, d.k, d.id)),
  add: (sf, d) => { run(sf, () => C.addToCart(sf.user, d.id, 1), () => C.item(d.id).name + ' added to cart'); sf.modal = null; sf.co = null; },
  itemInfo: (sf, d) => { sf.modal = { type: 'item', id: d.id }; },
  fit: (sf, d) => { sf.modal = { type: 'fit', id: d.id }; },
  sort: (sf, d) => { sf.sort = d.s; }, late: sf => { sf.late = !sf.late; },
  day: (sf, d) => { sf.day = Number(d.d); sf.editClass = null; },
  editClass: (sf, d) => { sf.editClass = (C.S.schedules[sf.user] || []).find(c => c.id === d.id); },
  cancelEdit: sf => { sf.editClass = null; },
  delClass: (sf, d) => run(sf, () => C.deleteClass(sf.user, d.id), 'Class removed'),
  qty: (sf, d) => { const l = C.cart(sf.user).lines.find(l => l.itemId === d.id); run(sf, () => C.updateLine(sf.user, d.id, Number(d.n) === -99 ? 0 : l.qty + Number(d.n))); },
  method: (sf, d) => { sf.co.method = d.m; sf.co.slot = null; },
  releaseClaim: sf => run(sf, () => C.releaseClaim(sf.user), 'Deal released'),
  place: sf => { const co = sf.co; const o = run(sf, () => C.placeOrder(sf.user, { method: co.method, stationId: co.stationId, slot: co.slot, idemKey: co.fail ? null : co.idem, ackWarnings: co.ack, reusable: co.reusable, simulatePaymentFail: co.fail })); if (o) { sf.co = null; go(sf, 'order', { id: o.id }); toast(sf, 'Order ' + o.id + ' sent'); } },
  cancelOrder: (sf, d) => run(sf, () => C.transition(sf.user, d.id, 'cancelled', 'Cancelled by student'), 'Order cancelled'),
  reorder: (sf, d) => { const o = C.getOrder(sf.user, d.id); let added = 0; const miss = []; o.lines.forEach(l => { try { C.addToCart(sf.user, l.itemId, l.qty); added++; } catch (e) { miss.push(l.name + ': ' + e.message); } }); sf.co = null; go(sf, 'cart'); if (miss.length) toast(sf, miss.join('; '), true); else toast(sf, 'Added to cart with current prices'); },
  stationScan: (sf, d) => { sf.modal = { type: 'scan', id: d.id }; },
  simStation: (sf, d) => run(sf, () => C.setStation(d.id, d.s), 'Station set to ' + d.s),
  claim: (sf, d) => { if (run(sf, () => C.claimOffer(sf.user, d.id), 'Portion held — complete checkout')) { sf.co = null; go(sf, 'cart'); } },
  simVerify: (sf, d) => run(sf, () => C.reviewEvidence(sf.user, d.id, 'verified', true), 'Verified (simulated)'),
  redeemAsk: (sf, d) => { sf.modal = { type: 'redeem', id: d.id, key: 'rd-' + Date.now() }; },
  redeem: (sf, d) => { const r = run(sf, () => C.redeem(sf.user, d.id, d.k)); if (r) { sf.modal = null; toast(sf, 'Redeemed! Code ' + r.code); } },
  mapSel: (sf, d) => { sf.mapSel = { k: d.k, id: d.id }; },
  exportMe: sf => { const S = C.S; const me = { user: C.user(sf.user), profile: S.profiles[sf.user], schedule: S.schedules[sf.user], orders: C.myOrders(sf.user), points: S.ledger.filter(l => l.userId === sf.user), evidence: S.evidence.filter(e => e.userId === sf.user), redemptions: S.redemptions.filter(r => r.userId === sf.user) }; sf.modal = { type: 'copy', title: 'Your data (demo)', text: JSON.stringify(me, null, 2) }; },
  copyNow: (sf, d) => { const t = document.getElementById(d.t); try { navigator.clipboard.writeText(t.value).then(() => { toast(sf, 'Copied'); renderAll(); }, () => { t.select(); toast(sf, 'Select and copy manually', true); renderAll(); }); } catch (e) { t.select(); } },
});
Object.assign(FORMS, {
  class: (sf, d) => { const r = run(sf, () => C.saveClass(sf.user, d)); if (r) { sf.editClass = null; sf.day = Number(d.day); toast(sf, r.warnings.length ? 'Saved — check overlap warning' : 'Class saved', !!r.warnings.length); } },
  diet: (sf, d) => run(sf, () => C.saveProfile(sf.user, { prefs: [].concat(d.prefs || []), allergies: [].concat(d.allergies || []), budget: d.budget, breakLen: d.breakLen }), 'Profile saved — recommendations updated'),
  review: (sf, d, el) => run(sf, () => C.addReview(sf.user, el.dataset.id, d.rating, d.text), 'Thanks for rating!'),
  scan: (sf, d, el) => { if (run(sf, () => C.stationCollect(sf.user, el.dataset.id, d.code), 'Compartment opened. Enjoy!')) sf.modal = null; },
  evidence: async (sf, d) => {
    const f = d.photo && d.photo.size ? d.photo : null; let hash = null;
    if (f) { try { const buf = await f.arrayBuffer(); const h = await crypto.subtle.digest('SHA-256', buf); hash = Array.from(new Uint8Array(h)).slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { hash = f.name + f.size; } }
    run(sf, () => C.submitEvidence(sf.user, { type: d.type, file: f ? f.name : null, fileHash: hash, code: d.code || null, outletId: d.type === 'reusable' ? d.outletId || null : null }), 'Submitted — pending verification');
  },
});
Object.assign(CHANGES, {
  note: (sf, v, el) => run(sf, () => C.updateLine(sf.user, el.dataset.id, null, v)),
  station: (sf, v) => { sf.co.stationId = v; }, slot: (sf, v) => { sf.co.slot = v; },
  reusable: (sf, v, el) => { sf.co.reusable = el.checked; }, ack: (sf, v, el) => { sf.co.ack = el.checked; }, failpay: (sf, v, el) => { sf.co.fail = el.checked; },
  np: (sf, v, el) => { sf.np[el.dataset.k] = el.checked; },
});
