/* GridNodeDB — the data layer. The UI never touches storage directly.
   Backed by localStorage today; to move to a real server, keep this API
   and replace load()/save() with fetch() calls. */
(function () {
  const KEY = 'gridnode.db', VERSION = 3, FEE = 25, GST = 0.18;
  let data;
  const clone = o => JSON.parse(JSON.stringify(o));
  const uid = p => p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const fresh = () => Object.assign(clone(window.GridNodeSeed), { version: VERSION });
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); if (d.version === VERSION) return d; }
    } catch (e) { /* storage blocked or corrupt: fall back to seed */ }
    return null;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  const find = id => data.stations.find(s => s.id === id);

  window.GridNodeDB = {
    init() { data = load() || fresh(); save(); },
    reset() { data = fresh(); save(); },
    export() { return JSON.stringify(data, null, 2); },
    host: () => data.host,
    wallet: () => data.wallet,

    stations: {
      all: () => data.stations,
      get: find,
      add(s) { const row = Object.assign({ id: uid('ST'), slots: [] }, s); data.stations.unshift(row); save(); return row; }
    },
    slots: {
      add(stationId, slot) { find(stationId).slots.push(Object.assign({ id: uid('S'), status: 'OPEN' }, slot)); save(); },
      remove(stationId, slotId) { const s = find(stationId); s.slots = s.slots.filter(x => x.id !== slotId); save(); }
    },
    quote(rate, kwh) {
      const energy = rate * kwh, gst = (energy + FEE) * GST;
      return { energy, fee: FEE, gst, total: energy + FEE + gst };
    },
    bookings: {
      all: () => data.bookings,
      create({ stationId, slotId, kwh, reg, pay }) {
        const st = find(stationId), slot = st.slots.find(x => x.id === slotId);
        if (!slot || slot.status !== 'OPEN') throw new Error('That slot was just taken. Pick another.');
        const q = GridNodeDB.quote(slot.rate, kwh);
        if (pay === 'wallet') {
          if (data.wallet < q.total) throw new Error('Wallet balance is too low. Pay with UPI instead.');
          data.wallet -= q.total;
        }
        slot.status = 'BOOKED';
        const b = { id: uid('GN'), stationId, stationName: st.name, notes: st.notes, window: slot.day + ' ' + slot.start, hours: slot.hours,
          kwh, rate: slot.rate, total: q.total, reg, pay, pin: String(Math.floor(100000 + Math.random() * 900000)), status: 'RESERVED', at: Date.now() };
        data.bookings.unshift(b);
        if (st.mine) data.host.earnings += q.total;
        save(); return b;
      },
      verifyPin(pin) {
        const b = data.bookings.find(x => x.pin === pin && x.status === 'RESERVED');
        if (b) { b.status = 'CHARGING'; save(); }
        return b || null;
      },
      complete(id) { const b = data.bookings.find(x => x.id === id); if (b) { b.status = 'COMPLETED'; save(); } }
    }
  };
})();
