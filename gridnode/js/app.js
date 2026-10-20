(function () {
  const DB = window.GridNodeDB; DB.init();
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inr = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const LOCS = { mum: ['Mumbai, Bandra', 19.076, 72.8777], lon: ['Lonavala corridor', 18.7557, 73.4091], pune: ['Pune, Koregaon Park', 18.5204, 73.8567] };
  const S = { view: 'find', role: 'driver', loc: 'mum', conn: 'ALL', sort: 'distance', q: '', openOnly: false, sel: null, nearest: false };

  const km = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const endTime = s => { const [h, m] = s.start.split(':').map(Number), t = (h * 60 + m + s.hours * 60) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  const openSlots = st => st.slots.filter(x => x.status === 'OPEN');
  let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3800); }

  function nearby() {
    const [, la, ln] = LOCS[S.loc], q = S.q.trim().toLowerCase();
    return DB.stations.all().map(s => Object.assign({ d: km(la, ln, s.lat, s.lng) }, s))
      .filter(s => (S.conn === 'ALL' || s.connector === S.conn) && (!S.openOnly || openSlots(s).length) &&
        (!q || (s.name + s.area + s.host + s.connector).toLowerCase().includes(q)))
      .sort((a, b) => S.sort === 'power' ? b.kw - a.kw : S.sort === 'price' ? a.rate - b.rate : a.d - b.d);
  }

  function radar(list) {
    const [, la, ln] = LOCS[S.loc], pts = list.map(s => ({ s, x: (s.lng - ln) * Math.cos(la * Math.PI / 180) * 111, y: (la - s.lat) * 111 }));
    const max = Math.max(5, ...pts.map(p => Math.hypot(p.x, p.y))), k = 125 / max;
    const pins = pts.map(p => {
      const col = !openSlots(p.s).length ? '#b3341f' : p.s.mine || p.s.host !== 'GridNode Public' && p.s.kw < 20 ? '#f2b01e' : '#3ec0cc';
      return `<g class="pin" data-act="select" data-st="${p.s.id}" transform="translate(${150 + p.x * k},${150 + p.y * k})"><circle r="${p.s.id === S.sel ? 9 : 6}" fill="${col}" stroke="#fff" stroke-width="${p.s.id === S.sel ? 2.5 : 1}"/><text x="10" y="3">${p.s.kw} kW</text></g>`;
    }).join('');
    return `<div class="card radar"><h3>Around you</h3><p class="meta">${LOCS[S.loc][0]}. Rings every ${(max / 2.5).toFixed(0)} km.</p>
      <svg viewBox="0 0 300 300" role="img" aria-label="Map of nearby chargers"><circle cx="150" cy="150" r="50" fill="none" stroke="#1e5560"/><circle cx="150" cy="150" r="100" fill="none" stroke="#1e5560"/>
      <rect x="145" y="145" width="10" height="10" fill="#fff"/>${pins}</svg>
      <p class="meta"><span style="color:#3ec0cc">●</span> public hub &nbsp;<span style="color:#f2b01e">●</span> neighbour host &nbsp;<span style="color:#b3341f">●</span> fully booked</p></div>`;
  }

  function stationCard(s) {
    const open = openSlots(s);
    return `<article class="card station ${s.id === S.sel ? 'sel' : ''}" id="${s.id}">
      <div class="row"><div><h3>${esc(s.name)}</h3><div class="meta">${esc(s.area)} · hosted by ${esc(s.host)}</div></div>
        <div class="price"><b>${inr(s.rate)}</b>/kWh<div class="meta">${s.d.toFixed(1)} km · about ${Math.max(2, Math.round(s.d * 2.1))} min</div></div></div>
      <div class="tags"><span class="tag">${esc(s.connector)}</span><span class="tag">${s.kw} kW</span>
        <span class="tag ${s.mine || s.host !== 'GridNode Public' ? 'host' : ''}">${s.host === 'GridNode Public' ? 'Public hub' : 'Neighbour host'}</span>
        ${open.length ? '' : '<span class="tag full">No open slots</span>'}</div>
      <div class="slots">${open.map(x => `<button class="slot" data-act="book" data-st="${s.id}" data-slot="${x.id}"><b>${x.day} ${x.start}–${endTime(x)}</b><small>${x.hours} h · up to ${(s.kw * x.hours).toFixed(0)} kWh · ${inr(x.rate)}</small></button>`).join('')}</div>
      <p class="note">${esc(s.notes)}</p></article>`;
  }

  function vFind() {
    const list = nearby();
    return `<div class="head"><div><h1>Charge where you are, when you need it</h1><p>Book a slot at a neighbour's driveway or a highway hub. You pay up front, get a PIN, and unused energy is refunded.</p></div>
      <button class="primary" data-act="nearest">Find the nearest open port</button></div>
      <div class="tools"><input id="q" type="search" placeholder="Search area, host or connector" value="${esc(S.q)}" aria-label="Search">
        <select id="conn" aria-label="Connector">${['ALL', 'CCS2 DC', 'Type 2 AC', '16A 3-Pin Industrial'].map(c => `<option value="${c}" ${S.conn === c ? 'selected' : ''}>${c === 'ALL' ? 'Any connector' : c}</option>`).join('')}</select>
        <select id="sort" aria-label="Sort">${[['distance', 'Nearest first'], ['power', 'Fastest first'], ['price', 'Cheapest first']].map(o => `<option value="${o[0]}" ${S.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
        <label class="chk"><input id="openonly" type="checkbox" ${S.openOnly ? 'checked' : ''}> Open slots only</label></div>
      <div class="layout"><section>${list.length ? list.map(stationCard).join('') : '<div class="card empty">Nothing matches. Clear the search or switch connector.</div>'}</section>${radar(list)}</div>`;
  }

  function vBookings() {
    const all = DB.bookings.all();
    return `<div class="head"><div><h1>My bookings</h1><p>Show the PIN to the host when you arrive. Charging starts when they enter it.</p></div></div>` +
      (all.length ? all.map(b => `<article class="card station"><div class="row"><div><h3>${esc(b.stationName)}</h3><div class="meta">${esc(b.window)} · ${b.hours} h · ${esc(b.reg)} · ${b.kwh} kWh at ${inr(b.rate)}</div></div>
        <div class="price"><div class="pin">${b.pin}</div><div class="meta">${b.status === 'COMPLETED' ? 'Completed' : b.status === 'CHARGING' ? 'Charging now' : 'Waiting for you'}</div></div></div>
        <p class="note"><b>Paid ${inr(b.total)}</b> by ${b.pay}. ${esc(b.notes)}</p>
        ${b.status === 'COMPLETED' ? '' : `<div class="actions"><button data-act="complete" data-id="${b.id}">Finish session</button></div>`}</article>`).join('')
        : '<div class="card empty">No bookings yet. Pick a time slot on the Find a charger page.</div>');
  }

  function vHost() {
    const mine = DB.stations.all().filter(s => s.mine), h = DB.host(), booked = DB.bookings.all().filter(b => mine.some(m => m.id === b.stationId));
    const opts = mine.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    return `<div class="head"><div><h1>Host console</h1><p>Publish the hours your port is free. Drivers book and pay; you verify their PIN at the gate.</p></div></div>
      <div class="stats"><div class="card stat"><span class="meta">Earnings</span><b>${inr(h.earnings)}</b></div><div class="card stat"><span class="meta">Open slots</span><b>${mine.reduce((n, s) => n + openSlots(s).length, 0)}</b></div><div class="card stat"><span class="meta">Bookings received</span><b>${booked.length}</b></div></div>
      <div class="cols"><section class="card"><h2>Publish a time slot</h2>
        <form id="f-slot" class="form"><div class="field"><label>Port</label><select name="st">${opts}</select></div>
        <div class="field"><label>Day</label><select name="day"><option>Today</option><option>Tomorrow</option></select></div>
        <div class="field"><label>Start</label><input type="time" name="start" value="18:00" required></div>
        <div class="field"><label>Hours</label><select name="hours">${[1, 2, 3, 4, 6, 8].map(n => `<option ${n === 2 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label>₹ per kWh</label><input type="number" name="rate" value="15" min="5" max="60" step="0.5" required></div>
        <button class="primary">Publish slot</button></form>
        ${mine.map(s => s.slots.map(x => `<div class="line"><span>${esc(s.name)} · ${x.day} ${x.start}–${endTime(x)} · ${inr(x.rate)}</span><span>${x.status === 'OPEN' ? `<button data-act="rm" data-st="${s.id}" data-slot="${x.id}">Remove</button>` : '<span class="ok">Booked</span>'}</span></div>`).join('')).join('')}</section>
        <section class="card"><h2>Check a driver's PIN</h2><form id="f-pin" class="form"><div class="field"><label>6-digit PIN</label><input name="pin" maxlength="6" inputmode="numeric" required></div><button class="primary">Start charging</button></form><p id="pin-out" class="note"></p>
        <h3 style="margin-top:1rem">Recent bookings</h3>${booked.length ? booked.map(b => `<div class="line"><span>${esc(b.reg)} · ${esc(b.window)}<br><small class="meta">${b.status}</small></span><b class="ok">+${inr(b.total)}</b></div>`).join('') : '<p class="meta">None yet. Book one as a driver to see it here.</p>'}</section></div>
      <section class="card"><h2>Add another port</h2><form id="f-port" class="form">
        <div class="field"><label>Name</label><input name="name" required placeholder="Green Valley Bay 4"></div><div class="field"><label>Area</label><input name="area" required placeholder="Dadar TT"></div>
        <div class="field"><label>Connector</label><select name="connector"><option>Type 2 AC</option><option>CCS2 DC</option><option>16A 3-Pin Industrial</option></select></div>
        <div class="field"><label>kW</label><input type="number" name="kw" value="7.4" step="0.1" min="1" required></div><div class="field"><label>₹ per kWh</label><input type="number" name="rate" value="14" step="0.5" min="5" required></div>
        <div class="field"><label>Access notes</label><input name="notes" required placeholder="Covered bay, tell the guard"></div><button class="primary">Add port</button></form></section>`;
  }

  const docs = {
    privacy: ['Privacy', [['What we collect', 'Your location is used in your browser to sort chargers by distance. Bookings, vehicle numbers and payment references are kept to run your sessions and issue GST invoices.'], ['What hosts see', 'Hosts see your vehicle number and time slot. Exact gate directions are shown only to drivers with a paid booking.'], ['Your data', 'You can export or erase your data at any time by writing to privacy@gridnode.in.']]],
    terms: ['Terms', [['Time slots', 'A booked slot is held for you alone. If you do not verify your PIN within 20 minutes of the start, the ₹25 booking fee goes to the host.'], ['Charging and refunds', 'You pay per kWh plus GST. Energy you book but do not use is refunded when the session ends. Staying more than 15 minutes past your slot costs ₹2 per minute.'], ['Safety', 'Hosts must have earthing and an RCCB on every port. Drivers must use undamaged, rated cables.']]]
  };
  const vDoc = k => `<article class="doc"><h1>${docs[k][0]}</h1>${docs[k][1].map(p => `<h2>${p[0]}</h2><p>${p[1]}</p>`).join('')}</article>`;

  function render() {
    $('#nav').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
    document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.role === S.role));
    const n = DB.bookings.all().filter(b => b.status !== 'COMPLETED').length; $('#bk-count').textContent = n || '';
    $('#main').innerHTML = ({ find: vFind, bookings: vBookings, host: vHost }[S.view] || (() => vDoc(S.view)))();
  }

  function openBook(stId, slotId) {
    const st = DB.stations.get(stId), d = $('#book'), slots = openSlots(st);
    d.innerHTML = `<form method="dialog" id="f-book"><h2>${esc(st.name)}</h2><div class="meta">${esc(st.connector)} · ${st.kw} kW</div>
      <div class="field"><label>Time slot</label><select name="slot">${slots.map(x => `<option value="${x.id}" ${x.id === slotId ? 'selected' : ''}>${x.day} ${x.start}–${endTime(x)} · ${inr(x.rate)}/kWh</option>`).join('')}</select></div>
      <div class="form"><div class="field"><label>Energy (kWh)</label><input name="kwh" type="number" min="1" step="0.5" required></div><div class="field"><label>Vehicle number</label><input name="reg" value="MH-01-EV-4821" required></div>
      <div class="field"><label>Pay with</label><select name="pay"><option value="UPI">UPI</option><option value="card">Card</option><option value="wallet">Wallet (${inr(DB.wallet())})</option></select></div></div>
      <div class="bill" id="bill"></div><div class="actions"><button type="button" data-act="close">Cancel</button><button class="primary" value="ok">Pay and reserve</button></div></form>`;
    const f = $('#f-book'), calc = () => {
      const x = st.slots.find(y => y.id === f.slot.value), cap = +(st.kw * x.hours).toFixed(1);
      f.kwh.max = cap; if (!f.kwh.value || +f.kwh.value > cap) f.kwh.value = Math.min(cap, 20);
      const q = DB.quote(x.rate, +f.kwh.value || 0);
      $('#bill').innerHTML = `<div><span>Energy ${f.kwh.value || 0} kWh × ${inr(x.rate)}</span><span>${inr(q.energy)}</span></div><div><span>Booking fee</span><span>${inr(q.fee)}</span></div><div><span>GST 18%</span><span>${inr(q.gst)}</span></div><div class="tot"><span>Total (max ${cap} kWh in this slot)</span><span>${inr(q.total)}</span></div>`;
    };
    f.addEventListener('input', calc); calc();
    f.addEventListener('submit', e => {
      try { const b = DB.bookings.create({ stationId: stId, slotId: f.slot.value, kwh: +f.kwh.value, reg: f.reg.value.toUpperCase(), pay: f.pay.value }); S.view = 'bookings'; render(); toast('Booked. Your PIN is ' + b.pin); }
      catch (err) { e.preventDefault(); toast(err.message); }
    });
    d.showModal();
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-view],[data-role],[data-act],#reset'); if (!el) return;
    if (el.id === 'reset') { if (confirm('Reset all demo data?')) { DB.reset(); render(); toast('Demo data restored.'); } return; }
    if (el.dataset.view) { S.view = el.dataset.view; render(); scrollTo(0, 0); return; }
    if (el.dataset.role) { S.role = el.dataset.role; S.view = S.role === 'host' ? 'host' : 'find'; render(); return; }
    const a = el.dataset.act;
    if (a === 'close') $('#book').close();
    if (a === 'book') openBook(el.dataset.st, el.dataset.slot);
    if (a === 'select') { S.sel = el.dataset.st; render(); $('#' + S.sel)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (a === 'nearest') { S.openOnly = true; S.sort = 'distance'; const n = nearby()[0]; S.sel = n && n.id; render(); n ? ($('#' + n.id)?.scrollIntoView({ block: 'center' }), toast(n.name + ' is ' + n.d.toFixed(1) + ' km away')) : toast('No open ports right now.'); }
    if (a === 'complete') { DB.bookings.complete(el.dataset.id); render(); toast('Session finished.'); }
    if (a === 'rm') { DB.slots.remove(el.dataset.st, el.dataset.slot); render(); toast('Slot removed.'); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'q') { S.q = e.target.value; const p = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); }
  });
  document.addEventListener('change', e => {
    const { id, checked, value } = e.target;
    if (id === 'conn') S.conn = value; else if (id === 'sort') S.sort = value; else if (id === 'openonly') S.openOnly = checked; else if (id === 'loc') S.loc = value; else return;
    render();
  });
  document.addEventListener('submit', e => {
    const f = e.target, v = new FormData(f); if (!f.id.startsWith('f-') || f.id === 'f-book') return; e.preventDefault();
    if (f.id === 'f-slot') { DB.slots.add(v.get('st'), { day: v.get('day'), start: v.get('start'), hours: +v.get('hours'), rate: +v.get('rate') }); toast('Slot published. Drivers can book it now.'); }
    if (f.id === 'f-pin') { const b = DB.bookings.verifyPin(String(v.get('pin')).trim()); render(); const o = $('#pin-out'); o.textContent = b ? `Verified: ${b.reg}. Power is on for ${b.window}.` : 'No reserved booking has that PIN.'; o.className = 'note ' + (b ? 'ok' : 'bad'); return; }
    if (f.id === 'f-port') { const [, la, ln] = LOCS[S.loc]; DB.stations.add({ name: v.get('name'), area: v.get('area'), host: DB.host().name, mine: true, lat: la + 0.004, lng: ln - 0.003, connector: v.get('connector'), kw: +v.get('kw'), rate: +v.get('rate'), notes: v.get('notes') }); toast('Port added. Publish a slot so drivers can book it.'); }
    render();
  });

  $('#loc').innerHTML = Object.entries(LOCS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
  render();
})();
