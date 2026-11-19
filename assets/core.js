/* QuickBite demo backend (in-browser simulator).
   One source of truth for website and app surfaces. All records are DEMO records.
   Every public function takes an actor (user id) and enforces permissions itself. */
function createCore(store) {
  const KEY = 'quickbite-demo-v1';
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TZ_OFFSET = 4 * 60; // campus-local time (Asia/Dubai, UTC+4)
  const BASE = Date.UTC(2026, 10, 16); // Monday 16 Nov 2026 00:00 UTC — demo week anchor

  const PREFS = ['Halal', 'Vegetarian', 'Vegan', 'High Protein', 'Low Calorie', 'Low Sugar', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
  const HARD_PREFS = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
  const ALLERGENS = ['Peanuts', 'Tree nuts', 'Milk/dairy', 'Eggs', 'Gluten/wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'];
  const ACTIVE = ['submitted', 'accepted', 'preparing', 'ready'];
  // order-state model: from -> {to: who}
  const TRANSITIONS = {
    submitted: { accepted: 'outlet', rejected: 'outlet', cancelled: 'student' },
    accepted: { preparing: 'outlet', cancelled: 'student', rejected: 'outlet' },
    preparing: { ready: 'outlet' },
    ready: { collected: 'outlet|student', no_show: 'outlet' },
    collected: { completed: 'system' },
  };
  const GREEN_TYPES = [
    { id: 'waste', name: 'Proper Waste Disposal', pts: 5, verifier: 'tbd' },
    { id: 'reusable', name: 'Reusable Container', pts: 10, verifier: 'outlet' },
    { id: 'sustainable_pickup', name: 'Sustainable Pickup', pts: 5, verifier: 'auto-order' },
    { id: 'green_delivery', name: 'Green Delivery', pts: 5, verifier: 'deferred' },
    { id: 'lowwaste', name: 'Low-Waste Meal', pts: 5, verifier: 'tbd' },
  ];

  let S = null;
  let listeners = [];

  // ---------- utilities ----------
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function uid(p) { S.seq = (S.seq || 0) + 1; return p + S.seq.toString(36).padStart(4, '0'); }
  function err(code, msg) { const e = new Error(msg); e.code = code; throw e; }
  function money(n) { return Math.round(n * 100) / 100; }
  function now() {
    if (S.clock.mode === 'real') return Date.now();
    return BASE + (S.clock.day * 1440 + S.clock.min - TZ_OFFSET) * 60000;
  }
  function parts(ts) { const m = Math.floor((ts - BASE) / 60000) + TZ_OFFSET; const dm = ((m % 10080) + 10080) % 10080; return { day: Math.floor(dm / 1440), min: dm % 1440 }; }
  function hm(min) { min = ((min % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
  function toMin(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }
  function user(id) { const u = S.users.find(u => u.id === id); if (!u) err('auth', 'Not signed in'); return u; }
  function isStudent(id) { return user(id).role === 'student'; }
  function membership(actor, outletId) { return S.memberships.find(m => m.userId === actor && m.outletId === outletId); }
  function requireStudent(actor) { if (!isStudent(actor)) err('forbidden', 'Student account required'); return user(actor); }
  function requireOutlet(actor, outletId, ownerOnly) {
    const m = membership(actor, outletId);
    if (!m) err('forbidden', 'You are not authorised for this outlet');
    if (ownerOnly && m.role !== 'owner') err('forbidden', 'Owner permission required');
    return m;
  }
  function outlet(id) { const o = S.outlets.find(o => o.id === id); if (!o) err('not_found', 'Outlet not found'); return o; }
  function item(id) { const i = S.items.find(i => i.id === id); if (!i) err('not_found', 'Item not found'); return i; }
  function audit(actor, action, ref) { S.audit.push({ at: now(), actor, action, ref }); if (S.audit.length > 400) S.audit.shift(); }
  function notify(userId, text, link, kind) {
    const dupe = S.notifications.find(n => n.userId === userId && n.text === text && n.link === link && now() - n.at < 60000);
    if (dupe) return;
    S.notifications.unshift({ id: uid('n'), userId, text, link: link || '', at: now(), read: false, kind: kind || 'transactional' });
  }
  function notifyOutlet(outletId, text, link) { S.memberships.filter(m => m.outletId === outletId).forEach(m => notify(m.userId, text, link, 'operational')); }
  function save() { try { store && store.setItem(KEY, JSON.stringify(S)); } catch (e) { } listeners.forEach(f => f()); }
  function tx(fn) { // all-or-nothing mutation
    const snap = JSON.stringify(S);
    try { const r = fn(); save(); return r; } catch (e) { S = JSON.parse(snap); throw e; }
  }

  // ---------- seed (demo data only) ----------
  function seed() {
    const s = {
      demo: true, version: 6, seq: 0,
      clock: { mode: 'demo', day: 0, min: 11 * 60 + 35 },
      campus: { id: 'campus-demo', name: 'Campus', currency: 'AED', tz: 'Asia/Dubai' },
      config: {
        timing: { eatBufferMin: 10, orderLeadMin: 2, runningLateBufferMin: 3, status: 'demo value — awaiting approval' },
        pointsPerOrder: { value: 5, status: 'demo value — awaiting approval' },
        slotMinutes: 15,
      },
      buildings: [
        { id: 'eng', name: 'Engineering Building', x: 12, y: 18 },
        { id: 'lib', name: 'Library', x: 50, y: 12 },
        { id: 'stc', name: 'Student Center', x: 48, y: 52 },
        { id: 'caf', name: 'Main Cafeteria', x: 80, y: 46 },
        { id: 'bus', name: 'Business Building', x: 16, y: 74 },
        { id: 'sci', name: 'Science Building', x: 82, y: 82 },
      ],
      users: [
        { id: 's1', role: 'student', name: 'Aisha', full: 'Aisha Rahman' },
        { id: 's2', role: 'student', name: 'Omar', full: 'Omar Haddad' },
        { id: 'r1', role: 'restaurant', name: 'Layla', full: 'Layla — owner, Campus Café & Coffee Station' },
        { id: 'r2', role: 'restaurant', name: 'Karim', full: 'Karim — staff, Pizza Corner' },
        { id: 'r3', role: 'restaurant', name: 'Noor', full: 'Noor — owner, Fresh Bites, Pizza Corner, Sandwich Hub' },
      ],
      memberships: [
        { userId: 'r1', outletId: 'cafe', role: 'owner' }, { userId: 'r1', outletId: 'coffee', role: 'owner' },
        { userId: 'r2', outletId: 'pizza', role: 'staff' },
        { userId: 'r3', outletId: 'fresh', role: 'owner' }, { userId: 'r3', outletId: 'pizza', role: 'owner' }, { userId: 'r3', outletId: 'sand', role: 'owner' },
      ],
      outlets: [
        { id: 'cafe', name: 'Campus Café', cuisine: 'Café & bowls', building: 'stc', open: '07:30', close: '18:00', status: 'open', parallel: 3, capacityPerSlot: 8, baseline: 2, desc: 'Rice bowls, wraps and breakfast all day.', color: '#0d9488', reusable: true },
        { id: 'fresh', name: 'Fresh Bites', cuisine: 'Salads & healthy', building: 'lib', open: '08:00', close: '17:00', status: 'open', parallel: 2, capacityPerSlot: 6, baseline: 1, desc: 'Salads, grain bowls and smoothies.', color: '#16a34a', reusable: true },
        { id: 'pizza', name: 'Pizza Corner', cuisine: 'Pizza & pasta', building: 'caf', open: '11:00', close: '20:00', status: 'open', parallel: 2, capacityPerSlot: 6, baseline: 4, desc: 'Stone-baked personal pizzas and pasta.', color: '#ea580c', reusable: false },
        { id: 'sand', name: 'Sandwich Hub', cuisine: 'Sandwiches & wraps', building: 'eng', open: '07:00', close: '16:00', status: 'open', parallel: 2, capacityPerSlot: 6, baseline: 2, desc: 'Toasted sandwiches and wraps, made fast.', color: '#ca8a04', reusable: false },
        { id: 'coffee', name: 'Coffee Station', cuisine: 'Coffee & pastries', building: 'bus', open: '07:00', close: '19:00', status: 'open', parallel: 2, capacityPerSlot: 10, baseline: 3, desc: 'Coffee, tea and baked goods.', color: '#7c3aed', reusable: true },
      ],
      items: [],
      stations: [
        { id: 'st-eng', name: 'Engineering Building station', building: 'eng', hours: '07:00–18:00', state: 'operational', comps: 8 },
        { id: 'st-stc', name: 'Student Center station', building: 'stc', hours: '07:00–20:00', state: 'operational', comps: 12 },
        { id: 'st-lib', name: 'Library station', building: 'lib', hours: '08:00–18:00', state: 'operational', comps: 8 },
        { id: 'st-caf', name: 'Main Cafeteria station', building: 'caf', hours: '07:00–20:00', state: 'maintenance', comps: 8 },
      ],
      compartments: [],
      greenStations: [{ id: 'gs1', name: 'Smart Green Station — Student Center', building: 'stc', code: 'GS-STC-01' }, { id: 'gs2', name: 'Smart Green Station — Library', building: 'lib', code: 'GS-LIB-01' }],
      profiles: {
        s1: { prefs: ['Halal', 'High Protein'], allergies: ['Tree nuts'], budget: 35, breakLen: 30, favOutlets: ['cafe'], favItems: ['i-cafe-1'] },
        s2: { prefs: ['Vegetarian'], allergies: [], budget: 25, breakLen: 20, favOutlets: [], favItems: [] },
      },
      schedules: {
        s1: [
          { id: 'c1', day: 0, name: 'Business Statistics', start: '08:30', end: '10:00', building: 'bus' },
          { id: 'c2', day: 0, name: 'BUS 2403', start: '12:00', end: '13:30', building: 'bus' },
          { id: 'c3', day: 0, name: 'Academic Writing', start: '14:00', end: '15:15', building: 'lib' },
          { id: 'c4', day: 1, name: 'Accounting I', start: '09:00', end: '10:30', building: 'bus' },
          { id: 'c5', day: 1, name: 'IT Fundamentals', start: '11:00', end: '12:30', building: 'eng' },
          { id: 'c6', day: 2, name: 'Business Statistics', start: '08:30', end: '10:00', building: 'bus' },
          { id: 'c7', day: 2, name: 'Marketing Principles', start: '10:45', end: '12:15', building: 'eng' },
        ],
        s2: [{ id: 'c8', day: 0, name: 'Engineering Maths', start: '09:00', end: '10:30', building: 'eng' }, { id: 'c9', day: 0, name: 'Physics Lab', start: '11:00', end: '12:30', building: 'sci' }],
      },
      carts: {}, orders: [], history: [], evidence: [], ledger: [], rewards: [], redemptions: [], reviews: [], notifications: [], waste: [], audit: [], idem: {},
    };
    const I = (outletId, n, name, cat, price, prep, tags, allergens, extra) => s.items.push(Object.assign({
      id: 'i-' + outletId + '-' + n, outletId, name, cat, price, prep, tags, allergens, ingredients: null, nutrition: null, stock: null, status: 'available', desc: '',
    }, extra || {}));
    I('cafe', 1, 'Grilled Chicken Rice Bowl', 'bowl', 24, 8, ['Halal', 'High Protein', 'Dairy-Free'], ['Soy', 'Sesame'], { desc: 'Grilled chicken, rice, greens, sesame-soy dressing.', ingredients: 'Chicken, rice, lettuce, cucumber, sesame, soy sauce', nutrition: { kcal: 610, protein: 42, supplied: 'Supplied by outlet' }, stock: 14 });
    I('cafe', 2, 'Falafel Wrap', 'wrap', 16, 5, ['Halal', 'Vegetarian', 'Vegan', 'Dairy-Free'], ['Gluten/wheat', 'Sesame'], { desc: 'Falafel, tahini, pickles, salad in a wrap.' });
    I('cafe', 3, 'Shakshuka & Toast', 'bowl', 18, 10, ['Halal', 'Vegetarian'], ['Eggs', 'Gluten/wheat'], { desc: 'Eggs in spiced tomato sauce with toast.' });
    I('cafe', 4, 'Chicken Caesar Wrap', 'wrap', 19, 5, ['Halal', 'High Protein'], null, { desc: 'Allergen information not yet declared by outlet.' });
    I('fresh', 1, 'Quinoa Power Salad', 'salad', 26, 6, ['Halal', 'Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Low Calorie', 'High Protein'], ['Sesame'], { desc: 'Quinoa, chickpeas, roasted veg, lemon-tahini.', nutrition: { kcal: 430, protein: 18, supplied: 'Supplied by outlet' }, stock: 10 });
    I('fresh', 2, 'Greek Salad', 'salad', 21, 4, ['Halal', 'Vegetarian', 'Gluten-Free', 'Low Calorie'], ['Milk/dairy'], { desc: 'Tomato, cucumber, olives, feta.', nutrition: { kcal: 320, protein: 9, supplied: 'Supplied by outlet' } });
    I('fresh', 3, 'Berry Smoothie', 'drink', 15, 3, ['Vegetarian', 'Gluten-Free', 'Low Sugar'], ['Milk/dairy'], { desc: 'Mixed berries, yogurt. No added sugar.' });
    I('fresh', 4, 'Almond Granola Pot', 'pastry', 14, 2, ['Vegetarian'], ['Tree nuts', 'Milk/dairy', 'Gluten/wheat'], { desc: 'Yogurt, almond granola, honey.' });
    I('pizza', 1, 'Margherita Pizza', 'pizza', 28, 12, ['Halal', 'Vegetarian'], ['Gluten/wheat', 'Milk/dairy'], { desc: 'Tomato, mozzarella, basil.', stock: 20 });
    I('pizza', 2, 'Chicken Tikka Pizza', 'pizza', 34, 14, ['Halal', 'High Protein'], ['Gluten/wheat', 'Milk/dairy'], { desc: 'Spiced chicken, peppers, onion.' });
    I('pizza', 3, 'Penne Arrabbiata', 'bowl', 25, 10, ['Halal', 'Vegan', 'Vegetarian', 'Dairy-Free'], ['Gluten/wheat'], { desc: 'Penne in spicy tomato sauce.' });
    I('sand', 1, 'Halloumi Toastie', 'sandwich', 17, 5, ['Halal', 'Vegetarian'], ['Milk/dairy', 'Gluten/wheat'], { desc: 'Grilled halloumi, tomato, mint.' });
    I('sand', 2, 'Turkey Club', 'sandwich', 22, 6, ['Halal', 'High Protein'], ['Gluten/wheat', 'Eggs'], { desc: 'Turkey, egg, lettuce, tomato.', stock: 8 });
    I('sand', 3, 'Tuna Melt', 'sandwich', 19, 6, ['Halal', 'High Protein'], ['Fish', 'Milk/dairy', 'Gluten/wheat'], { desc: 'Tuna, cheese, sourdough.' });
    I('coffee', 1, 'Flat White', 'drink', 14, 3, ['Vegetarian', 'Gluten-Free', 'Halal'], ['Milk/dairy'], { desc: 'Double shot, steamed milk.' });
    I('coffee', 2, 'Oat Latte', 'drink', 16, 3, ['Vegan', 'Vegetarian', 'Dairy-Free', 'Halal'], ['Gluten/wheat'], { desc: 'Oat milk (may contain gluten).' });
    I('coffee', 3, 'Zaatar Croissant', 'pastry', 9, 2, ['Vegetarian', 'Halal'], ['Gluten/wheat', 'Milk/dairy', 'Sesame'], { desc: 'Butter croissant with zaatar.', stock: 12 });
    I('coffee', 4, 'Date Muffin', 'pastry', 10, 1, ['Vegetarian', 'Halal'], null, { desc: 'Allergen information not yet declared by outlet.', stock: 0, status: 'soldout' });

    s.stations.forEach(st => { for (let i = 1; i <= st.comps; i++) s.compartments.push({ id: st.id + '-' + i, stationId: st.id, n: i, state: (i % 5 === 0) ? 'occupied-demo' : 'free', orderId: null, tempC: st.state === 'operational' ? null : null }); });

    s.rewards = [
      { id: 'rw1', name: 'AED 5 food voucher', cost: 100, stock: 50, terms: 'Valid at participating outlets for 30 days.', outlets: 'All participating outlets' },
      { id: 'rw2', name: 'Free coffee at Coffee Station', cost: 150, stock: 20, terms: 'One regular coffee. Valid for 30 days.', outlets: 'Coffee Station' },
      { id: 'rw3', name: 'Reusable campus cup', cost: 300, stock: 10, terms: 'Collect from the Student Center.', outlets: 'Student Center' },
      { id: 'rw4', name: 'Sustainability tote bag', cost: 500, stock: 5, terms: 'Collect from the Student Center.', outlets: 'Student Center' },
    ];
    // Demo history: 21 days of completed orders for analytics/forecast (deterministic).
    const r = rng(42);
    const hourW = [0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 5, 4, 8, 9, 5, 3, 2, 1, 1, 0, 0, 0, 0, 0];
    s.outlets.forEach((o, oi) => {
      const its = s.items.filter(i => i.outletId === o.id);
      for (let d = -21; d < 0; d++) {
        const dow = ((d % 7) + 7) % 7; const weekend = dow >= 5;
        const n = Math.round((weekend ? 3 : 14 + oi * 2) * (0.8 + r() * 0.4));
        for (let k = 0; k < n; k++) {
          let h; do { h = Math.floor(r() * 24); } while (r() * 9 > hourW[h]);
          const it = its[Math.floor(r() * its.length)]; const qty = r() < 0.2 ? 2 : 1;
          const refunded = r() < 0.02;
          s.history.push({ outletId: o.id, itemId: it.id, name: it.name, qty, total: it.price * qty, at: BASE + (d * 1440 + h * 60 + Math.floor(r() * 60) - TZ_OFFSET) * 60000, refunded, reusable: o.reusable && r() < 0.25, rating: r() < 0.15 ? (r() < 0.75 ? 5 : r() < 0.6 ? 4 : 3) : null });
        }
        s.waste.push({ id: 'w' + o.id + d, outletId: o.id, date: d, kg: Math.round((1.2 + r() * 1.8 - (d > -8 ? 0.4 : 0)) * 10) / 10, note: '' });
      }
    });
    s.reviews = [
      { id: 'rv1', outletId: 'cafe', studentName: 'Sara', rating: 5, text: 'Bowl was ready exactly when I arrived.', at: BASE - 2 * 86400000, verified: true, reply: '', reported: false },
      { id: 'rv2', outletId: 'cafe', studentName: 'Yousef', rating: 3, text: 'Good food but the pickup shelf was confusing.', at: BASE - 4 * 86400000, verified: true, reply: '', reported: false },
      { id: 'rv3', outletId: 'pizza', studentName: 'Mariam', rating: 4, text: 'Tasty, took a bit longer than estimated.', at: BASE - 86400000, verified: true, reply: 'Thanks — we have added an oven slot at lunch.', reported: false },
      { id: 'rv4', outletId: 'fresh', studentName: 'Hamdan', rating: 5, text: 'Love the fresh salads, always ready on time.', at: BASE - 3 * 86400000, verified: true, reply: '', reported: false },
    ];
    s.ledger = [
      { id: 'l1', userId: 's1', delta: 40, reason: 'Welcome bonus', ref: 'demo', at: BASE - 5 * 86400000 },
      { id: 'l2', userId: 's1', delta: 10, reason: 'Reusable Container (verified)', ref: 'demo', at: BASE - 3 * 86400000, type: 'reusable' },
      { id: 'l4', userId: 's1', delta: 5, reason: 'Proper Waste Disposal (verified)', ref: 'demo', at: BASE - 86400000, type: 'waste' },
      { id: 'l5', userId: 's2', delta: 20, reason: 'Welcome bonus', ref: 'demo', at: BASE - 86400000 },
    ];
    s.notifications = [{ id: 'n0', userId: 's1', text: 'Checked out 10 times', link: 'orders', at: BASE + (11 * 60 + 35 - TZ_OFFSET) * 60000 - 86400000, read: false, kind: 'transactional' }];
    return s;
  }

  function load() {
    try { const raw = store && store.getItem(KEY); if (raw) { const p = JSON.parse(raw); if (p && p.demo && p.version === 6) { S = p; return; } } } catch (e) { }
    S = seed();
  }

  // ---------- timing & queue ----------
  function walk(a, b) {
    if (!a || !b || a === b) return a === b ? 2 : 5;
    const A = S.buildings.find(x => x.id === a), B = S.buildings.find(x => x.id === b);
    if (!A || !B) return 5;
    return Math.max(2, Math.round(Math.hypot(A.x - B.x, A.y - B.y) / 9)); // schematic estimate, not a measured route
  }
  function outletOpen(o, ts) {
    const p = parts(ts || now());
    if (o.status === 'closed') return { open: false, label: 'Closed today', state: 'closed' };
    if (o.status === 'paused') return { open: false, label: 'Paused — not taking orders', state: 'closed' };
    if (p.min < toMin(o.open) || p.min >= toMin(o.close) || p.day >= 5) return { open: false, label: p.day >= 5 ? 'Closed (weekend)' : 'Closed · opens ' + o.open, state: 'closed' };
    return { open: true, label: 'Open until ' + o.close, state: 'open' };
  }
  function activeOrders(outletId) { return S.orders.filter(x => x.outletId === outletId && ['submitted', 'accepted', 'preparing'].includes(x.status)); }
  function queueInfo(outletId) {
    const o = outlet(outletId); const st = outletOpen(o);
    const live = activeOrders(outletId);
    const count = live.length + (st.open ? o.baseline : 0);
    const avgPrep = Math.round(S.items.filter(i => i.outletId === outletId).reduce((a, i) => a + i.prep, 0) / Math.max(1, S.items.filter(i => i.outletId === outletId).length));
    const work = live.reduce((a, x) => a + x.prepMin, 0) + (st.open ? o.baseline * avgPrep : 0);
    const wait = Math.ceil(work / o.parallel);
    const level = !st.open ? 'closed' : wait < 8 ? 'short' : wait < 16 ? 'moderate' : 'busy';
    return { count, liveCount: live.length, baseline: st.open ? o.baseline : 0, wait, avgPrep, total: wait + avgPrep, level, open: st.open, label: st.label, source: 'Calculated from demo orders + simulated baseline of ' + o.baseline + ' (not live)' };
  }
  function nextBreak(actor) {
    requireStudent(actor);
    const p = parts(now()); const cls = (S.schedules[actor] || []).filter(c => c.day === p.day).sort((a, b) => toMin(a.start) - toMin(b.start));
    const prof = S.profiles[actor] || {};
    if (!cls.length) return { none: true, reason: (S.schedules[actor] || []).length ? 'No classes today' : 'No schedule saved yet', now: p, free: prof.breakLen || null };
    const cur = cls.find(c => toMin(c.start) <= p.min && p.min < toMin(c.end));
    const next = cls.find(c => toMin(c.start) > p.min);
    const prev = [...cls].reverse().find(c => toMin(c.end) <= p.min);
    if (cur) return { inClass: cur, next, now: p, minutesLeft: next ? toMin(next.start) - toMin(cur.end) : null, startsIn: toMin(cur.end) - p.min, from: cur.building, to: next && next.building };
    if (!next) return { none: true, reason: 'No more classes today', now: p, from: prev && prev.building };
    return { next, now: p, minutesLeft: toMin(next.start) - p.min, from: prev ? prev.building : 'stc', to: next.building, prev };
  }
  function overlaps(classes) {
    const w = [];
    for (let i = 0; i < classes.length; i++) for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i], b = classes[j];
      if (a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) w.push(a.name + ' overlaps ' + b.name + ' on ' + DAYS[a.day]);
    }
    return w;
  }

  // ---------- dietary ----------
  function dietCheck(actor, it) {
    const prof = S.profiles[actor] || { prefs: [], allergies: [] };
    const res = { ok: true, warn: [], block: [], unknown: false, goals: [] };
    if (prof.allergies.length) {
      if (!it.allergens) { res.unknown = true; res.ok = false; res.warn.push('Allergen information not declared — cannot be treated as safe'); }
      else { const hit = it.allergens.filter(a => prof.allergies.includes(a)); if (hit.length) { res.ok = false; res.block.push('Contains ' + hit.join(', ') + ' (your allergy)'); } }
    }
    prof.prefs.filter(p => HARD_PREFS.includes(p)).forEach(p => { if (!it.tags.includes(p)) { res.ok = false; res.block.push('Not tagged ' + p); } });
    prof.prefs.filter(p => !HARD_PREFS.includes(p)).forEach(p => { if (it.tags.includes(p)) res.goals.push(p); });
    return res;
  }

  // ---------- recommendations (transparent rules, not a trained model) ----------
  function popularity(itemId) { return S.history.filter(h => h.itemId === itemId).length + S.orders.filter(o => o.status === 'completed' && o.lines.some(l => l.itemId === itemId)).length; }
  function recommend(actor, opts) {
    requireStudent(actor); opts = opts || {};
    const prof = S.profiles[actor]; const br = nextBreak(actor); const cfg = S.config.timing;
    const from = br.from || 'stc'; const to = br.to || from;
    let avail = br.minutesLeft != null ? br.minutesLeft - (br.startsIn || 0) * 0 : (prof.breakLen || null);
    const startDelay = br.inClass ? br.startsIn : 0;
    const out = [];
    S.items.forEach(it => {
      const o = outlet(it.outletId); const st = outletOpen(o, now() + startDelay * 60000);
      const q = queueInfo(o.id);
      const d = dietCheck(actor, it);
      const reasons = [], excluded = [];
      if (!st.open) excluded.push(o.name + ' ' + st.label.toLowerCase());
      if (it.status !== 'available' || it.stock === 0) excluded.push('Sold out / unavailable');
      if (prof.budget && it.price > prof.budget) excluded.push('Over your AED ' + prof.budget + ' budget');
      d.block.forEach(b => excluded.push(b)); if (d.unknown) excluded.push('Allergen info not declared');
      const walkTo = walk(from, o.building), walkBack = walk(o.building, to);
      const ready = Math.max(q.wait + it.prep, walkTo) + cfg.orderLeadMin; // food is prepared while walking
      const eat = opts.runningLate ? 0 : cfg.eatBufferMin;
      const need = ready + eat + walkBack + (opts.runningLate ? cfg.runningLateBufferMin : 0);
      const fits = avail == null ? null : need <= avail;
      if (fits === false) excluded.push('Needs ' + need + ' min, you have ' + avail);
      if (fits) reasons.push('Fits your break: ~' + need + ' of ' + avail + ' min incl. ' + (eat ? eat + ' min to eat' : 'no eating time') + ' and ' + walkBack + ' min walk to ' + bName(to));
      if (d.goals.length) reasons.push('Matches ' + d.goals.join(', '));
      if (prof.favItems.includes(it.id)) reasons.push('One of your favourites');
      const sust = (o.reusable ? 1 : 0) + (it.tags.includes('Vegan') ? 1 : 0);
      const pop = popularity(it.id);
      const score = (fits ? 50 : 0) + d.goals.length * 12 + (prof.favItems.includes(it.id) ? 8 : 0) + (prof.favOutlets.includes(o.id) ? 5 : 0) - need * 0.6 - it.price * 0.3 + Math.min(10, pop / 8) + sust * 2;
      out.push({ item: it, outlet: o, queue: q, ready, need, avail, fits, excluded, reasons, diet: d, score, pop, sust, eligible: excluded.length === 0 });
    });
    const sorters = {
      best: (a, b) => b.score - a.score,
      fastest: (a, b) => a.need - b.need,
      cheapest: (a, b) => a.item.price - b.item.price,
      healthiest: (a, b) => (a.item.nutrition ? a.item.nutrition.kcal : 1e9) - (b.item.nutrition ? b.item.nutrition.kcal : 1e9),
      protein: (a, b) => (b.item.nutrition ? b.item.nutrition.protein : -1) - (a.item.nutrition ? a.item.nutrition.protein : -1),
      popular: (a, b) => b.pop - a.pop,
      sustainable: (a, b) => b.sust - a.sust || b.score - a.score,
    };
    let list = out.filter(r => r.eligible);
    if (opts.sort === 'healthiest' || opts.sort === 'protein') list = list.filter(r => r.item.nutrition);
    list.sort(sorters[opts.sort || 'best']);
    return { break: br, avail, list, excluded: out.filter(r => !r.eligible), sort: opts.sort || 'best' };
  }
  function bName(id) { const b = S.buildings.find(b => b.id === id); return b ? b.name : 'your class'; }

  // ---------- cart & checkout ----------
  function cart(actor) { requireStudent(actor); return S.carts[actor] || (S.carts[actor] = { outletId: null, lines: [] }); }
  function addToCart(actor, itemId, qty) {
    return tx(() => {
      const c = cart(actor); const it = item(itemId);
      if (c.outletId && c.outletId !== it.outletId && c.lines.length) err('cart_outlet', 'Your cart has items from ' + outlet(c.outletId).name + '. Place that order first or clear your cart.');
      if (it.status !== 'available' || it.stock === 0) err('unavailable', it.name + ' is not available');
      c.outletId = it.outletId;
      const l = c.lines.find(l => l.itemId === itemId);
      if (l) l.qty += qty || 1; else c.lines.push({ itemId, qty: qty || 1, note: '' });
      return c;
    });
  }
  function updateLine(actor, itemId, qty, note) {
    return tx(() => {
      const c = cart(actor); const l = c.lines.find(l => l.itemId === itemId); if (!l) err('not_found', 'Not in cart');
      if (qty != null) l.qty = Math.max(0, Math.min(10, qty));
      if (note != null) l.note = String(note).slice(0, 140);
      c.lines = c.lines.filter(l => l.qty > 0); if (!c.lines.length) { c.outletId = null; }
      return c;
    });
  }
  function clearCart(actor) { return tx(() => { S.carts[actor] = { outletId: null, lines: [] }; }); }
  function slotLoad(outletId, slot) { return S.orders.filter(o => o.outletId === outletId && o.slot === slot && ACTIVE.includes(o.status)).length; }
  function quote(actor, opts) {
    const c = cart(actor); opts = opts || {};
    const problems = [], warnings = [];
    if (!c.lines.length) return { empty: true, problems: ['Your cart is empty'], warnings, lines: [] };
    const o = outlet(c.outletId); const st = outletOpen(o);
    if (!st.open) problems.push(o.name + ' is ' + st.label.toLowerCase());
    const lines = c.lines.map(l => {
      const it = item(l.itemId); const price = it.price;
      if (it.status !== 'available') problems.push(it.name + ' is now ' + it.status);
      if (it.stock != null && it.stock < l.qty) problems.push('Only ' + it.stock + ' ' + it.name + ' left');
      const d = dietCheck(actor, it); d.block.forEach(b => warnings.push(it.name + ': ' + b)); d.warn.forEach(b => warnings.push(it.name + ': ' + b));
      return { itemId: it.id, name: it.name, price, qty: l.qty, note: l.note, lineTotal: money(price * l.qty), allergens: it.allergens, prep: it.prep };
    });
    const subtotal = money(lines.reduce((a, l) => a + l.lineTotal, 0));
    const q = queueInfo(o.id); const prepMin = Math.max(...lines.map(l => l.prep)) + Math.max(0, lines.reduce((a, l) => a + l.qty, 0) - 1);
    const readyIn = q.wait + prepMin;
    const slotLen = S.config.slotMinutes; const p = parts(now());
    const first = Math.ceil((p.min + readyIn) / slotLen) * slotLen;
    const slots = [];
    for (let m = first; m < Math.min(toMin(o.close), first + slotLen * 8); m += slotLen) { const used = slotLoad(o.id, hm(m)); slots.push({ slot: hm(m), used, cap: o.capacityPerSlot, full: used >= o.capacityPerSlot }); }
    const method = opts.method || 'counter';
    let station = null;
    if (method === 'station') {
      station = S.stations.find(s => s.id === opts.stationId);
      if (!station) problems.push('Choose a pickup station');
      else if (station.state !== 'operational') problems.push(station.name + ' is ' + station.state);
      else if (!S.compartments.some(x => x.stationId === station.id && x.state === 'free')) problems.push(station.name + ' is full');
    }
    if (method === 'delivery') problems.push('Campus delivery is not available yet');
    const slot = opts.slot || (slots.find(s => !s.full) || {}).slot;
    const sl = slots.find(s => s.slot === slot);
    if (!sl) problems.push('No collection slot available today');
    else if (sl.full) problems.push('Slot ' + slot + ' is full');
    return { outlet: o, lines, subtotal, discount: 0, fees: null, tax: null, total: subtotal, prepMin, readyIn, slots, slot, method, station, problems, warnings };
  }
  function placeOrder(actor, opts) {
    opts = opts || {};
    if (opts.idemKey && S.idem[opts.idemKey]) return S.orders.find(o => o.id === S.idem[opts.idemKey]);
    return tx(() => {
      const st = user(actor); requireStudent(actor);
      const q = quote(actor, opts);
      if (q.empty) err('cart', 'Cart is empty');
      if (q.problems.length) err('invalid', q.problems.join('; '));
      if (q.warnings.length && !opts.ackWarnings) err('warnings', 'Please confirm the dietary warnings first');
      const c = cart(actor);
      if (opts.simulatePaymentFail) { audit(actor, 'payment_failed_sim', c.outletId); err('payment', 'Payment failed — no order created, nothing charged. Try again.'); }
      // reserve stock
      q.lines.forEach(l => { const it = item(l.itemId); if (it.stock != null) { it.stock -= l.qty; if (it.stock <= 0) { it.stock = 0; it.status = 'soldout'; notifyOutlet(it.outletId, it.name + ' sold out', 'menu'); } else if (it.stock <= 3) notifyOutlet(it.outletId, it.name + ': only ' + it.stock + ' left', 'menu'); } });
      let comp = null;
      if (q.method === 'station') { comp = S.compartments.find(x => x.stationId === q.station.id && x.state === 'free'); comp.state = 'reserved'; }
      const id = 'QB-' + (1000 + S.orders.length + 1); if (comp) comp.orderId = id;
      const order = {
        id, studentId: actor, studentName: st.name, outletId: q.outlet.id, lines: q.lines, subtotal: q.subtotal, discount: q.discount, total: q.total,
        method: q.method, stationId: q.station && q.station.id, compartmentId: comp && comp.id, slot: q.slot, prepMin: q.prepMin,
        status: 'submitted', payment: 'sim_authorised', events: [{ s: 'submitted', at: now(), by: actor }], createdAt: now(),
        readyBy: now() + q.readyIn * 60000, token: Math.random().toString(36).slice(2, 8).toUpperCase(), tokenUsed: false,
        reusable: !!opts.reusable, allergyNote: q.warnings.length ? q.warnings : [], delay: 0, reviewed: false,
      };
      S.orders.unshift(order);
      if (opts.idemKey) S.idem[opts.idemKey] = id;
      S.carts[actor] = { outletId: null, lines: [] };
      notify(actor, 'Order ' + id + ' sent to ' + q.outlet.name, 'order:' + id);
      notifyOutlet(q.outlet.id, 'New order ' + id + ' for ' + q.slot, 'orders');
      audit(actor, 'order_submitted', id);
      return order;
    });
  }
  function myOrders(actor) { requireStudent(actor); return S.orders.filter(o => o.studentId === actor); }
  function getOrder(actor, id) {
    const o = S.orders.find(o => o.id === id); if (!o) err('not_found', 'Order not found');
    if (o.studentId === actor) return o;
    if (membership(actor, o.outletId)) return redact(o);
    err('forbidden', 'You cannot view this order');
  }
  function redact(o) { const c = Object.assign({}, o); delete c.token; c.studentName = o.studentName; return c; }
  function outletOrders(actor, outletId) { requireOutlet(actor, outletId); return S.orders.filter(o => o.outletId === outletId).map(redact); }

  function releaseCompartment(o) { if (o.compartmentId) { const c = S.compartments.find(c => c.id === o.compartmentId); if (c && c.orderId === o.id) { c.state = 'free'; c.orderId = null; } } }
  function restock(o) { o.lines.forEach(l => { const it = S.items.find(i => i.id === l.itemId); if (it && it.stock != null) { it.stock += l.qty; if (it.status === 'soldout') it.status = 'available'; } }); }
  function transition(actor, orderId, to, note) {
    return tx(() => {
      const o = S.orders.find(o => o.id === orderId); if (!o) err('not_found', 'Order not found');
      const allowed = TRANSITIONS[o.status] && TRANSITIONS[o.status][to];
      if (!allowed) err('state', 'Cannot move order from ' + o.status + ' to ' + to);
      const asStudent = o.studentId === actor; const asOutlet = !!membership(actor, o.outletId);
      if (allowed === 'outlet' && !asOutlet) err('forbidden', 'Only the restaurant can do this');
      if (allowed === 'student' && !asStudent) err('forbidden', 'Only the student can cancel');
      if (allowed === 'outlet|student' && !asOutlet && !asStudent) err('forbidden', 'Not allowed');
      if (to === 'collected' && o.method === 'station' && asStudent) err('state', 'Use the station QR to collect');
      o.status = to; o.events.push({ s: to, at: now(), by: actor, note: note || '' });
      const on = outlet(o.outletId).name;
      if (to === 'accepted') notify(o.studentId, on + ' accepted ' + o.id, 'order:' + o.id);
      if (to === 'preparing') notify(o.studentId, on + ' is preparing ' + o.id, 'order:' + o.id);
      if (to === 'ready') notify(o.studentId, o.id + ' is ready' + (o.method === 'station' ? ' in ' + S.stations.find(s => s.id === o.stationId).name + ', compartment ' + S.compartments.find(c => c.id === o.compartmentId).n : ' for counter pickup at ' + on), 'order:' + o.id);
      if (to === 'rejected' || to === 'cancelled') {
        o.payment = 'sim_voided'; restock(o); releaseCompartment(o);
        notify(o.studentId, o.id + ' was ' + to + (note ? ': ' + note : '') + '. Payment voided.', 'order:' + o.id);
        if (to === 'cancelled') notifyOutlet(o.outletId, o.id + ' cancelled by student', 'orders');
      }
      if (to === 'no_show') { o.payment = 'sim_captured'; releaseCompartment(o); notify(o.studentId, o.id + ' was not collected.', 'order:' + o.id); }
      if (to === 'collected') complete(o, actor);
      audit(actor, 'order_' + to, o.id);
      return o;
    });
  }
  function complete(o, actor) {
    o.status = 'completed'; o.payment = 'sim_captured'; o.events.push({ s: 'completed', at: now(), by: 'system' }); o.tokenUsed = true;
    releaseCompartment(o);
    const pts = S.config.pointsPerOrder.value;
    award(o.studentId, pts, 'Completed order ' + o.id, 'order:' + o.id, null);
    if (o.method === 'station') award(o.studentId, GREEN_TYPES.find(g => g.id === 'sustainable_pickup').pts, 'Sustainable Pickup (' + o.id + ')', 'sp:' + o.id, 'sustainable_pickup');
    if (o.reusable) S.evidence.unshift({ id: uid('ev'), userId: o.studentId, type: 'reusable', orderId: o.id, outletId: o.outletId, status: 'pending', at: now(), file: null, note: 'Declared at checkout — outlet to verify' });
    notify(o.studentId, o.id + ' collected. Enjoy! Rate your meal?', 'order:' + o.id);
  }
  function delayOrder(actor, orderId, minutes) {
    return tx(() => { const o = S.orders.find(o => o.id === orderId); if (!o) err('not_found', 'Order not found'); requireOutlet(actor, o.outletId); if (!['accepted', 'preparing'].includes(o.status)) err('state', 'Only accepted or preparing orders can be delayed'); o.delay += minutes; o.readyBy += minutes * 60000; o.events.push({ s: 'delayed', at: now(), by: actor, note: '+' + minutes + ' min' }); notify(o.studentId, o.id + ' delayed by ' + minutes + ' min. New estimate ' + hm(parts(o.readyBy).min), 'order:' + o.id); return o; });
  }
  function placeInCompartment(actor, orderId) {
    return tx(() => {
      const o = S.orders.find(o => o.id === orderId); requireOutlet(actor, o.outletId);
      if (o.method !== 'station') err('state', 'Not a station order'); if (o.status !== 'ready') err('state', 'Mark ready first');
      const c = S.compartments.find(c => c.id === o.compartmentId); const st = S.stations.find(s => s.id === o.stationId);
      if (st.state !== 'operational') err('station', st.name + ' is ' + st.state + '. Switch the order to counter pickup.');
      c.state = 'occupied'; c.orderId = o.id; o.placedAt = now(); o.events.push({ s: 'placed', at: now(), by: actor, note: 'Compartment ' + c.n });
      notify(o.studentId, 'Your meal is in ' + st.name + ', compartment ' + c.n + '. Use your code to open it.', 'order:' + o.id);
      return o;
    });
  }
  function switchToCounter(actor, orderId) {
    return tx(() => { const o = S.orders.find(o => o.id === orderId); requireOutlet(actor, o.outletId); releaseCompartment(o); o.method = 'counter'; o.stationId = null; o.compartmentId = null; o.events.push({ s: 'switched', at: now(), by: actor, note: 'Station unavailable → counter pickup' }); notify(o.studentId, o.id + ': pickup station unavailable, please collect at the ' + outlet(o.outletId).name + ' counter.', 'order:' + o.id); return o; });
  }
  function verifyCollection(actor, orderId, token) { // outlet verifies at counter
    const o = S.orders.find(o => o.id === orderId); if (!o) err('not_found', 'Order not found'); requireOutlet(actor, o.outletId);
    if (o.tokenUsed) err('token', 'This collection code has already been used');
    if (String(token).trim().toUpperCase() !== o.token) err('token', 'Code does not match this order');
    return transition(actor, orderId, 'collected', 'Code verified at counter');
  }
  function stationCollect(actor, orderId, token) { // student scans at station (simulated)
    return tx(() => {
      const o = S.orders.find(o => o.id === orderId); if (!o) err('not_found', 'Order not found');
      if (o.studentId !== actor) err('forbidden', 'This code belongs to another student');
      if (o.tokenUsed) err('token', 'Code already used');
      if (String(token).trim().toUpperCase() !== o.token) err('token', 'Invalid code');
      const c = S.compartments.find(c => c.id === o.compartmentId);
      if (!c || c.state !== 'occupied' || c.orderId !== o.id) err('state', 'Meal not placed yet');
      o.events.push({ s: 'collected', at: now(), by: actor, note: 'Station compartment ' + c.n + ' opened' });
      o.status = 'collected'; complete(o, actor); audit(actor, 'station_collect', o.id); return o;
    });
  }

  // ---------- restaurant menu ops ----------
  function setOutlet(actor, outletId, patch) {
    return tx(() => { requireOutlet(actor, outletId, !('status' in patch && Object.keys(patch).length === 1)); const o = outlet(outletId); ['status', 'open', 'close', 'capacityPerSlot', 'parallel'].forEach(k => { if (k in patch) o[k] = patch[k]; }); audit(actor, 'outlet_update', outletId); return o; });
  }
  function upsertItem(actor, outletId, data) {
    return tx(() => {
      requireOutlet(actor, outletId);
      if (!data.name || !String(data.name).trim()) err('validation', 'Name is required');
      const price = Number(data.price); if (!(price > 0)) err('validation', 'Price must be more than 0');
      let it = data.id ? S.items.find(i => i.id === data.id) : null;
      if (it && it.outletId !== outletId) err('forbidden', 'Item belongs to another outlet');
      if (!it) { it = { id: uid('i-'), outletId, nutrition: null, ingredients: null, allergens: null, tags: [], status: 'available', stock: null, cat: 'bowl', prep: 5, desc: '' }; S.items.push(it); }
      Object.assign(it, { name: String(data.name).trim(), price: money(price), cat: data.cat || it.cat, prep: Math.max(1, Number(data.prep) || it.prep), desc: data.desc != null ? data.desc : it.desc, tags: data.tags || it.tags, allergens: data.allergensDeclared ? (data.allergens || []) : (data.allergensDeclared === false ? null : it.allergens), ingredients: data.ingredients != null ? (data.ingredients || null) : it.ingredients, stock: !('stock' in data) ? it.stock : (data.stock === '' || data.stock == null ? null : Math.max(0, Number(data.stock))), status: data.status || it.status });
      if (data.kcal !== undefined) it.nutrition = data.kcal === '' || data.kcal == null ? null : { kcal: Number(data.kcal), protein: Number(data.protein) || 0, supplied: 'Supplied by outlet' };
      if (it.stock === 0 && it.status === 'available') it.status = 'soldout';
      if (it.stock > 0 && it.status === 'soldout') it.status = 'available';
      audit(actor, 'item_upsert', it.id); return it;
    });
  }

  // ---------- points, evidence, rewards ----------
  function balance(userId) { return S.ledger.filter(l => l.userId === userId).reduce((a, l) => a + l.delta, 0); }
  function award(userId, pts, reason, ref, type) { if (S.ledger.some(l => l.ref === ref && l.userId === userId && l.delta > 0 && ref !== 'demo')) return; S.ledger.unshift({ id: uid('l'), userId, delta: pts, reason, ref, at: now(), type }); notify(userId, '+' + pts + ' Green Points: ' + reason, 'rewards'); }
  function submitEvidence(actor, data) {
    return tx(() => {
      requireStudent(actor); const t = GREEN_TYPES.find(g => g.id === data.type); if (!t) err('validation', 'Choose an action type');
      if (t.verifier === 'deferred') err('deferred', t.name + ' is not available yet');
      if (t.verifier === 'auto-order') err('validation', t.name + ' points are added automatically when the order completes');
      if (!data.file && !data.code) err('validation', 'Add a photo or a Green Station code');
      if (data.code && !S.greenStations.some(g => g.code === String(data.code).trim().toUpperCase())) err('validation', 'Unknown Green Station code');
      if (data.fileHash && S.evidence.some(e => e.fileHash === data.fileHash)) err('duplicate', 'This photo was already submitted');
      const today = S.evidence.filter(e => e.userId === actor && e.type === t.id && now() - e.at < 86400000).length;
      if (today >= 2) err('limit', 'Daily limit for ' + t.name + ' reached');
      const ev = { id: uid('ev'), userId: actor, type: t.id, status: 'pending', at: now(), file: data.file || null, fileHash: data.fileHash || null, code: data.code || null, outletId: data.outletId || null, note: '' };
      S.evidence.unshift(ev); audit(actor, 'evidence_submit', ev.id); return ev;
    });
  }
  function reviewEvidence(actor, evId, decision, demoOverride) {
    return tx(() => {
      const ev = S.evidence.find(e => e.id === evId); if (!ev) err('not_found', 'Not found');
      if (ev.status !== 'pending') err('state', 'Already ' + ev.status);
      if (!demoOverride) { if (!ev.outletId) err('forbidden', 'No verifier is defined for this action yet'); requireOutlet(actor, ev.outletId); }
      ev.status = decision; ev.decidedAt = now(); ev.decidedBy = demoOverride ? 'demo-simulator' : actor;
      const t = GREEN_TYPES.find(g => g.id === ev.type);
      if (decision === 'verified') award(ev.userId, t.pts, t.name + ' (verified)', 'ev:' + ev.id, t.id);
      notify(ev.userId, t.name + ' evidence ' + decision, 'sustainability'); return ev;
    });
  }
  function reversePoints(actor, ledgerRef, reason) { return tx(() => { const e = S.ledger.find(l => l.ref === ledgerRef && l.delta > 0); if (!e) err('not_found', 'Nothing to reverse'); if (S.ledger.some(l => l.ref === 'rev:' + ledgerRef)) err('duplicate', 'Already reversed'); const amt = Math.min(e.delta, balance(e.userId)); S.ledger.unshift({ id: uid('l'), userId: e.userId, delta: -amt, reason: 'Reversal: ' + reason, ref: 'rev:' + ledgerRef, at: now() }); return amt; }); }
  function redeem(actor, rewardId, idemKey) {
    if (idemKey && S.idem[idemKey]) return S.redemptions.find(r => r.id === S.idem[idemKey]);
    return tx(() => {
      requireStudent(actor); const r = S.rewards.find(r => r.id === rewardId); if (!r) err('not_found', 'Reward not found');
      if (r.stock <= 0) err('stock', 'Out of stock');
      const bal = balance(actor); if (bal < r.cost) err('balance', 'You need ' + (r.cost - bal) + ' more points');
      r.stock -= 1; const red = { id: uid('rd'), userId: actor, rewardId, name: r.name, cost: r.cost, code: 'RW-' + Math.random().toString(36).slice(2, 7).toUpperCase(), at: now(), status: 'issued' };
      S.redemptions.unshift(red); S.ledger.unshift({ id: uid('l'), userId: actor, delta: -r.cost, reason: 'Redeemed ' + r.name, ref: 'rd:' + red.id, at: now() });
      if (idemKey) S.idem[idemKey] = red.id; notify(actor, 'Reward redeemed: ' + r.name + ' (code ' + red.code + ')', 'rewards'); return red;
    });
  }
  function badges(userId) {
    const L = S.ledger.filter(l => l.userId === userId && l.delta > 0); const cnt = t => L.filter(l => l.type === t).length;
    const orders = S.orders.filter(o => o.studentId === userId && o.status === 'completed');
    return [
      { name: 'First Green Action', got: L.some(l => l.type), how: 'Complete any verified green action' },
      { name: 'Waste Warrior', got: cnt('waste') + cnt('lowwaste') >= 5, how: '5 verified waste actions (' + (cnt('waste') + cnt('lowwaste')) + '/5)' },
      { name: 'Green Traveler', got: cnt('sustainable_pickup') >= 3, how: '3 sustainable pickups (' + cnt('sustainable_pickup') + '/3)' },
      { name: 'Reusable Champion', got: cnt('reusable') >= 5, how: '5 verified reusable containers (' + cnt('reusable') + '/5)' },
      { name: 'Time Saver', got: orders.length >= 3, how: '3 pre-ordered meals collected (' + orders.length + '/3)' },
    ];
  }
  function level(points) { const lv = [['Seedling', 0], ['Sprout', 100], ['Sapling', 250], ['Evergreen', 500]]; let i = 0; lv.forEach((l, k) => { if (points >= l[1]) i = k; }); const next = lv[i + 1]; return { name: lv[i][0], next: next && next[0], need: next ? next[1] : null, from: lv[i][1] }; }

  // ---------- reviews ----------
  function addReview(actor, orderId, rating, text) { return tx(() => { const o = S.orders.find(o => o.id === orderId); if (!o || o.studentId !== actor) err('forbidden', 'Not your order'); if (o.status !== 'completed') err('state', 'Rate after collection'); if (o.reviewed) err('duplicate', 'Already rated'); rating = Math.max(1, Math.min(5, Number(rating))); o.reviewed = true; S.reviews.unshift({ id: uid('rv'), outletId: o.outletId, orderId, studentName: user(actor).name, rating, text: String(text || '').slice(0, 300), at: now(), verified: true, reply: '', reported: false }); notifyOutlet(o.outletId, 'New ' + rating + '★ review on ' + o.id, 'ratings'); }); }
  function replyReview(actor, id, text) { return tx(() => { const r = S.reviews.find(r => r.id === id); requireOutlet(actor, r.outletId); r.reply = String(text).slice(0, 300); }); }
  function reportReview(actor, id) { return tx(() => { const r = S.reviews.find(r => r.id === id); requireOutlet(actor, r.outletId); r.reported = true; }); }

  // ---------- analytics (owner/staff scoped) ----------
  function completedRecords(outletId, fromDay, toDay) {
    const lo = BASE + fromDay * 86400000 - TZ_OFFSET * 60000, hi = BASE + toDay * 86400000 - TZ_OFFSET * 60000;
    const h = S.history.filter(x => x.outletId === outletId && x.at >= lo && x.at < hi);
    const live = S.orders.filter(o => o.outletId === outletId && ['completed', 'no_show'].includes(o.status) && o.createdAt >= lo && o.createdAt < hi).map(o => ({ outletId, itemId: o.lines[0].itemId, name: o.lines.map(l => l.name).join(', '), qty: o.lines.reduce((a, l) => a + l.qty, 0), total: o.total, at: o.createdAt, refunded: false, reusable: o.reusable, lines: o.lines, live: true }));
    return h.concat(live);
  }
  function sales(actor, outletId, days) {
    requireOutlet(actor, outletId); days = days || 7; const today = parts(now()).day + Math.floor((now() - BASE) / 86400000) - parts(now()).day;
    const recs = completedRecords(outletId, today - days + 1, today + 1);
    const daily = []; for (let d = today - days + 1; d <= today; d++) { const lo = BASE + d * 86400000 - TZ_OFFSET * 60000; const r = recs.filter(x => x.at >= lo && x.at < lo + 86400000); daily.push({ d, label: DAYS[((d % 7) + 7) % 7], gross: money(r.reduce((a, x) => a + x.total, 0)), orders: r.length }); }
    const gross = money(recs.reduce((a, x) => a + x.total, 0)); const refunds = money(recs.filter(x => x.refunded).reduce((a, x) => a + x.total, 0));
    const dish = {}; recs.forEach(x => { (x.lines || [{ name: x.name, qty: x.qty, lineTotal: x.total }]).forEach(l => { dish[l.name] = dish[l.name] || { name: l.name, qty: 0, gross: 0 }; dish[l.name].qty += l.qty; dish[l.name].gross += l.lineTotal || x.total; }); });
    const best = daily.reduce((a, b) => b.gross > a.gross ? b : a, daily[0]);
    return { days, daily, gross, refunds, orders: recs.length, aov: recs.length ? money(gross / recs.length) : null, best, dishes: Object.values(dish).sort((a, b) => b.qty - a.qty).slice(0, 6), commission: null, fees: null, net: null };
  }
  function forecast(actor, outletId, opts) {
    requireOutlet(actor, outletId); opts = opts || {}; const o = outlet(outletId);
    const adjust = 1 + (Number(opts.adjust) || 0) / 100;       // owner-entered expected change vs a normal week
    const buffer = 1 + (opts.buffer == null ? 10 : Number(opts.buffer)) / 100; // safety stock on prep quantities
    const H0 = 7, NH = 12, W = 3;                               // 07:00–19:00, 3 weeks of history
    const recs = S.history.filter(x => x.outletId === outletId);
    const dayIdx = at => Math.floor((at - BASE + TZ_OFFSET * 60000) / 86400000); // days relative to demo Monday
    // per-week counts [week][weekday][hour]
    const wk = Array.from({ length: W }, () => Array.from({ length: 7 }, () => Array(NH).fill(0)));
    const items = {}; const itemsBlock = {};
    const block = h => h < 11 ? 0 : h < 14 ? 1 : 2;             // breakfast / lunch / afternoon
    recs.forEach(x => {
      const d = dayIdx(x.at); const w = Math.floor((d + 21) / 7); if (w < 0 || w >= W) return;
      const p = parts(x.at); const h = Math.floor(p.min / 60);
      if (h >= H0 && h < H0 + NH) wk[w][p.day][h - H0] += 1;
      items[x.name] = (items[x.name] || 0) + x.qty;
      const k = x.itemId; itemsBlock[k] = itemsBlock[k] || Array.from({ length: 7 }, () => [0, 0, 0]);
      if (h >= H0) itemsBlock[k][p.day][block(h)] += x.qty;
    });
    const r1 = v => Math.round(v * 10) / 10;
    const grid = [], lo = [], hi = [];
    for (let d = 0; d < 7; d++) { grid.push([]); lo.push([]); hi.push([]); for (let h = 0; h < NH; h++) { const v = wk.map(w => w[d][h]); grid[d].push(r1(v.reduce((a, b) => a + b, 0) / W * adjust)); lo[d].push(r1(Math.min(...v) * adjust)); hi[d].push(r1(Math.max(...v) * adjust)); } }
    const avgPrice = recs.length ? recs.reduce((a, x) => a + x.total, 0) / recs.reduce((a, x) => a + x.qty, 0) : 0;
    const days = grid.map((r, d) => { const tot = r.reduce((a, b) => a + b, 0); let pk = 0; r.forEach((v, h) => { if (v > r[pk]) pk = h; });
      return { day: DAYS[d], orders: Math.round(tot), low: Math.round(lo[d].reduce((a, b) => a + b, 0)), high: Math.round(hi[d].reduce((a, b) => a + b, 0)), revenue: money(tot * avgPrice * (recs.length ? recs.reduce((a, x) => a + x.qty, 0) / recs.length : 1)), peak: hm((pk + H0) * 60) + '–' + hm((pk + H0 + 1) * 60), peakV: r[pk] }; });
    const weekly = days.reduce((a, d) => a + d.orders, 0);
    let peak = { d: 0, h: 0, v: 0 }; grid.forEach((r, d) => r.forEach((v, h) => { if (v > peak.v) peak = { d, h, v }; }));
    const pop = Object.entries(items).map(([name, q]) => ({ name, perWeek: Math.round(q / W * adjust) })).sort((a, b) => b.perWeek - a.perWeek);
    const capHour = o.capacityPerSlot * (60 / S.config.slotMinutes);
    // prep plan for a chosen weekday
    const pd = opts.day != null ? Number(opts.day) : (parts(now()).day < 5 ? parts(now()).day : 0);
    const prep = S.items.filter(i => i.outletId === outletId).map(i => {
      const b = itemsBlock[i.id] ? itemsBlock[i.id][pd] : [0, 0, 0]; const f = b.map(v => v / W * adjust);
      const total = f.reduce((a, c) => a + c, 0); const make = Math.ceil(total * buffer);
      return { id: i.id, name: i.name, breakfast: Math.round(f[0]), lunch: Math.round(f[1]), afternoon: Math.round(f[2]), expected: Math.round(total), make, stock: i.stock, short: i.stock != null ? Math.max(0, make - i.stock) : null };
    }).filter(x => x.expected > 0 || x.stock != null).sort((a, b) => b.expected - a.expected);
    // accuracy: predict last week from the two weeks before, compare with what happened
    let err = 0, act = 0;
    const dt = (w, d) => wk[w][d].reduce((x, y) => x + y, 0);
    for (let d = 0; d < 5; d++) { const pred = (dt(0, d) + dt(1, d)) / 2; err += Math.abs(pred - dt(2, d)); act += dt(2, d); }
    const accuracy = act ? Math.max(0, Math.round((1 - err / act) * 100)) : null;
    const lastWeek = wk[2].map(r => r.reduce((a, b) => a + b, 0));
    const shortages = prep.filter(p => p.stock != null).map(p => ({ name: p.name, stock: p.stock, perDay: p.expected, risk: p.stock < p.make }));
    return { grid, lo, hi, days, weekly, daily: Math.round(days.slice(0, 5).reduce((a, d) => a + d.orders, 0) / 5), peak: { day: DAYS[peak.d], from: hm((peak.h + H0) * 60), to: hm((peak.h + H0 + 1) * 60), v: peak.v }, pop, capHour, overCap: peak.v > capHour, shortages, prep, prepDay: pd, accuracy, lastWeek, adjust: Math.round((adjust - 1) * 100), buffer: Math.round((buffer - 1) * 100), H0 };
  }
  function wasteSummary(actor, outletId) {
    requireOutlet(actor, outletId); const W = S.waste.filter(w => w.outletId === outletId).sort((a, b) => a.date - b.date);
    const last7 = W.filter(w => w.date >= -7), prev = W.filter(w => w.date < -7 && w.date >= -21);
    const avg = a => a.length ? Math.round(a.reduce((x, w) => x + w.kg, 0) / a.length * 10) / 10 : null;
    const o = outlet(outletId);
    return { records: W, total7: Math.round(last7.reduce((a, w) => a + w.kg, 0) * 10) / 10, avg7: avg(last7), baseline: o.wasteBaseline != null ? o.wasteBaseline : null, baselineSuggested: avg(prev) };
  }
  function addWaste(actor, outletId, kg, note) { return tx(() => { requireOutlet(actor, outletId); kg = Number(kg); if (!(kg >= 0) || kg > 500) err('validation', 'Enter weight in kg'); const day = Math.floor((now() - BASE) / 86400000); S.waste.push({ id: uid('w'), outletId, date: day, kg: Math.round(kg * 10) / 10, note: note || '', by: actor }); }); }
  function setBaseline(actor, outletId, kg) { return tx(() => { requireOutlet(actor, outletId, true); outlet(outletId).wasteBaseline = kg === '' ? null : Number(kg); }); }
  function sustainability(actor, outletId) {
    requireOutlet(actor, outletId); const recs = completedRecords(outletId, -7, 1);
    const ev = S.evidence.filter(e => e.outletId === outletId && e.type === 'reusable');
    const verified = recs.filter(r => r.reusable).length;
    const pts = S.ledger.filter(l => l.delta > 0 && S.orders.some(o => o.outletId === outletId && (l.ref.endsWith(o.id)))).reduce((a, l) => a + l.delta, 0);
    return { completed: recs.length, reusable: verified, reusableRate: recs.length ? Math.round(verified / recs.length * 100) : null, pendingReusable: ev.filter(e => e.status === 'pending'), pointsIssued: pts, recyclableRate: null, emissions: null };
  }

  // ---------- notifications ----------
  function notifications(actor) { return S.notifications.filter(n => n.userId === actor); }
  function markRead(actor) { return tx(() => S.notifications.forEach(n => { if (n.userId === actor) n.read = true; })); }

  // ---------- demo-only controls ----------
  function setClock(c) { return tx(() => Object.assign(S.clock, c)); }
  function advance(min) { return tx(() => { if (S.clock.mode !== 'demo') return; S.clock.min += min; while (S.clock.min >= 1440) { S.clock.min -= 1440; S.clock.day = (S.clock.day + 1) % 7; } }); }
  function setStation(stationId, state) { return tx(() => { const st = S.stations.find(s => s.id === stationId); st.state = state; S.orders.filter(o => o.stationId === stationId && ACTIVE.includes(o.status)).forEach(o => { notify(o.studentId, st.name + ' is ' + state + '. ' + o.id + ' may need counter pickup.', 'order:' + o.id); notifyOutlet(o.outletId, st.name + ' ' + state + ' — affects ' + o.id, 'orders'); }); }); }
  function reset() { S = seed(); save(); }

  // ---------- student data ----------
  function saveProfile(actor, p) { return tx(() => { requireStudent(actor); const pr = S.profiles[actor] || (S.profiles[actor] = { prefs: [], allergies: [], budget: null, breakLen: null, favOutlets: [], favItems: [] }); if (p.prefs) pr.prefs = p.prefs.filter(x => PREFS.includes(x)); if (p.allergies) pr.allergies = p.allergies.filter(x => ALLERGENS.includes(x)); if ('budget' in p) pr.budget = p.budget === '' ? null : Math.max(5, Math.min(200, Number(p.budget))); if ('breakLen' in p) pr.breakLen = Number(p.breakLen) || null; return pr; }); }
  function saveClass(actor, c) {
    return tx(() => {
      requireStudent(actor); if (!c.name || !c.start || !c.end) err('validation', 'Name, start and end are required');
      if (toMin(c.end) <= toMin(c.start)) err('validation', 'End time must be after start time');
      const list = S.schedules[actor] || (S.schedules[actor] = []);
      const ex = c.id && list.find(x => x.id === c.id);
      const rec = { id: c.id || uid('c'), day: Number(c.day), name: String(c.name).slice(0, 60), start: c.start, end: c.end, building: c.building };
      if (ex) Object.assign(ex, rec); else list.push(rec);
      return { rec, warnings: overlaps(list) };
    });
  }
  function deleteClass(actor, id) { return tx(() => { requireStudent(actor); S.schedules[actor] = (S.schedules[actor] || []).filter(c => c.id !== id); }); }
  function toggleFav(actor, kind, id) { return tx(() => { const p = S.profiles[actor]; const k = kind === 'outlet' ? 'favOutlets' : 'favItems'; p[k] = p[k].includes(id) ? p[k].filter(x => x !== id) : p[k].concat(id); }); }

  load();
  return {
    DAYS, PREFS, ALLERGENS, HARD_PREFS, GREEN_TYPES, TRANSITIONS,
    get S() { return S; }, on(f) { listeners.push(f); }, reload() { load(); listeners.forEach(f => f()); },
    now, parts, hm, toMin, walk, bName, user, membership, outlet, item, outletOpen, queueInfo, nextBreak, overlaps, dietCheck, recommend,
    cart, addToCart, updateLine, clearCart, quote, placeOrder, myOrders, getOrder, outletOrders, transition, delayOrder, placeInCompartment, switchToCounter, verifyCollection, stationCollect,
    setOutlet, upsertItem,
    balance, submitEvidence, reviewEvidence, reversePoints, redeem, badges, level,
    addReview, replyReview, reportReview, sales, forecast, wasteSummary, addWaste, setBaseline, sustainability,
    notifications, markRead, setClock, advance, setStation, reset, saveProfile, saveClass, deleteClass, toggleFav,
    myOutlets(actor) { return S.memberships.filter(m => m.userId === actor).map(m => Object.assign({ role: m.role }, outlet(m.outletId))); },
  };
}
if (typeof module !== 'undefined') module.exports = { createCore };
