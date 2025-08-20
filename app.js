// Vending Buddy Web - offline-first checklist + counts
// Simple localStorage persistence

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// --- Tabs ---
$$('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.panel').forEach(p => p.classList.remove('active'));
    const id = btn.dataset.tab;
    document.getElementById(id).classList.add('active');
  });
});

// --- Data ---
const LS_KEYS = {
  stops: 'vbw:stops',
  inv: 'vbw:inventory'
};

let stops = load(LS_KEYS.stops) ?? seedStops();
let inventory = load(LS_KEYS.inv) ?? seedInv();

function seedStops() {
  return [
    { id: crypto.randomUUID(), name: 'Bldg 2749 Fleet Store', address: '1065 W Lexington St', done: false },
    { id: crypto.randomUUID(), name: 'Seaplane Laundry', address: 'On base', done: false }
  ];
}
function seedInv() {
  return [
    { id: crypto.randomUUID(), sku: '20401', name: 'KIWI VF 12 EA', count: 12 },
    { id: crypto.randomUUID(), sku: 'RB-24CT', name: 'Fiery Habanero Beef Sticks 24 ct', count: 3 }
  ];
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key){ try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }

// --- Render Stops ---
const stopList = $('#stopList');
function renderStops() {
  stopList.innerHTML = '';
  stops.forEach(s => {
    const li = document.createElement('li');
    li.className = 'card';
    const box = document.createElement('div');
    box.className = 'checkbox' + (s.done ? ' checked' : '');
    box.role = 'checkbox';
    box.ariaChecked = s.done ? 'true' : 'false';
    box.addEventListener('click', () => {
      s.done = !s.done; save(LS_KEYS.stops, stops); renderStops();
    });
    const textWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'title' + (s.done ? ' strike' : '');
    title.textContent = s.name;
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = s.address || '';
    textWrap.append(title, sub);
    const spacer = document.createElement('div'); spacer.className = 'spacer';
    const del = document.createElement('button'); del.className = 'btn'; del.textContent = 'Delete';
    del.addEventListener('click', () => {
      stops = stops.filter(x => x.id !== s.id);
      save(LS_KEYS.stops, stops); renderStops();
    });
    li.append(box, textWrap, spacer, del);
    stopList.append(li);
  });
}
renderStops();

$('#stopForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#stopName').value.trim();
  const address = $('#stopAddr').value.trim();
  if(!name) return;
  stops.push({ id: crypto.randomUUID(), name, address, done:false });
  save(LS_KEYS.stops, stops); renderStops();
  e.target.reset();
});

$('#resetStops').addEventListener('click', () => {
  stops.forEach(s => s.done = false);
  save(LS_KEYS.stops, stops); renderStops();
});

// Export/Import stops
$('#exportStops').addEventListener('click', () => exportJSON('stops.json', stops));
$('#importStopsBtn').addEventListener('click', () => $('#importStops').click());
$('#importStops').addEventListener('change', (e) => importJSON(e, (data) => {
  if(Array.isArray(data)) { stops = data; save(LS_KEYS.stops, stops); renderStops(); }
}));

// --- Render Inventory ---
const invList = $('#invList');
function renderInv() {
  invList.innerHTML = '';
  inventory.forEach(it => {
    const li = document.createElement('li');
    li.className = 'card';
    const textWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = it.name;
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = `SKU: ${it.sku}`;
    textWrap.append(title, sub);

    const spacer = document.createElement('div'); spacer.className = 'spacer';

    const counter = document.createElement('div');
    counter.className = 'counter';
    const minus = document.createElement('button'); minus.className = 'btn'; minus.textContent = '−';
    const count = document.createElement('button'); count.className = 'btn count'; count.textContent = it.count;
    const plus = document.createElement('button'); plus.className = 'btn'; plus.textContent = '+';

    minus.addEventListener('click', () => { it.count = Math.max(0, it.count - 1); save(LS_KEYS.inv, inventory); renderInv(); });
    plus.addEventListener('click', () => { it.count += 1; save(LS_KEYS.inv, inventory); renderInv(); });
    count.addEventListener('click', async () => {
      const v = prompt('Set count:', it.count);
      if(v===null) return;
      const n = Number(v);
      if(Number.isFinite(n)) { it.count = n; save(LS_KEYS.inv, inventory); renderInv(); }
    });

    const del = document.createElement('button'); del.className = 'btn'; del.textContent = 'Delete';
    del.addEventListener('click', () => {
      inventory = inventory.filter(x => x.id !== it.id);
      save(LS_KEYS.inv, inventory); renderInv();
    });

    counter.append(minus, count, plus);
    li.append(textWrap, spacer, counter, del);
    invList.append(li);
  });
}
renderInv();

$('#invForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const sku = $('#sku').value.trim();
  const name = $('#name').value.trim();
  const count = Number($('#count').value || 0);
  if(!sku || !name) return;
  inventory.push({ id: crypto.randomUUID(), sku, name, count: Number.isFinite(count) ? count : 0 });
  save(LS_KEYS.inv, inventory); renderInv();
  e.target.reset();
});

// Export/Import inventory
$('#exportInv').addEventListener('click', () => exportJSON('inventory.json', inventory));
$('#importInvBtn').addEventListener('click', () => $('#importInv').click());
$('#importInv').addEventListener('change', (e) => importJSON(e, (data) => {
  if(Array.isArray(data)) { inventory = data; save(LS_KEYS.inv, inventory); renderInv(); }
}));

function exportJSON(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function importJSON(e, cb){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      cb(data);
    } catch { alert('Invalid JSON'); }
  };
  reader.readAsText(file);
}

// --- PWA install flow ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    btn.hidden = true;
    if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; }
  });
});

// --- Service worker ---
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
