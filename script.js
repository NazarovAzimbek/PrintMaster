'use strict';
/* ===== Yordamchilar ===== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ===== Saqlash (localStorage bo‘lmasa ham ishlaydi) ===== */
const KEY = 'printMasterV1'; let mem = {}, storageOk = true;
try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { storageOk = false; }
function save(d) {
  Object.assign(mem, d);
  try { localStorage.setItem(KEY, JSON.stringify(mem)); }
  catch (e) { if (storageOk) { storageOk = false; toast('Natijalarni saqlab bo‘lmadi, lekin o‘yin ishlayveradi.'); } }
}
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); }

/* ===== Ma’lumotlar ===== */
const MG = { normal: [25.4, 25.4, 25.4, 25.4], narrow: [12.7, 12.7, 12.7, 12.7], wide: [25.4, 50.8, 25.4, 50.8] }; // yuqori, o‘ng, past, chap (mm)
const SZ = { A4: [210, 297], A5: [148, 210], Letter: [216, 279] };
const LB = { normal: 'Normal', narrow: 'Narrow', wide: 'Wide', portrait: 'Portrait', landscape: 'Landscape' };
const MN = { m: 'Margins', o: 'Orientation', s: 'Size' };
const STG = ['Sahifa ustasi', 'Hujjat detektivi', 'Chop etishdan oldingi tekshiruv', 'Print Master chempioni'];
const BADGES = { first: ['🥇', 'Birinchi qadam'], s1: ['📐', 'Sahifa ustasi'], det: ['🔍', 'Hujjat detektivi'], chk: ['✅', 'Tekshiruv ustasi'], master: ['🏆', 'Print Master'] };
const ERR = ['Matn sahifa chetiga juda yaqin', 'Keng jadval uchun Portrait yo‘nalishi noqulay', 'Sahifa yo‘nalishi vazifaga mos emas', 'Qog‘oz o‘lchami (Size) topshiriqqa mos emas', 'Matnning bir qismi keyingi sahifaga o‘tib ketgan', 'Hujjatda ortiqcha bo‘sh sahifa bor'];
const CH = ['Sahifa chetlari to‘g‘rimi?', 'Sahifa yo‘nalishi mosmi?', 'Qog‘oz o‘lchami to‘g‘rimi?', 'Matn sahifaga to‘g‘ri joylashganmi?', 'Ortiqcha bo‘sh sahifa yo‘qmi?', 'Sahifalar soni kutilgan natijaga mosmi?'];
const N4 = MG.normal;
const DOCS = {
  tight: [{ p: [3, 3, 3, 3] }], table: [{ table: 1, fill: .8 }], orient: [{ w: 297, h: 210, fill: .6 }],
  size: [{ w: 148, h: 210, p: [15, 15, 15, 15] }], spill: [{}, { fill: .15 }], blank: [{}, { fill: 0 }],
  two: [{ w: 148, h: 210, p: [3, 3, 3, 3] }], good: [{}]
};
const SPILL = 'Bu Margins yoki Orientation bilan har doim avtomatik hal bo‘lavermaydi: avval sababini (matn hajmi, shrift, ortiqcha bo‘sh qatorlar, sahifa uzilishi) tekshirish kerak.';

const T1 = [
  { t: 'Oddiy matnli hujjatni standart ko‘rinishda tayyorlang.', start: { m: 'narrow', o: 'landscape', s: 'A5' }, goal: { m: 'normal', o: 'portrait', s: 'A4' }, hint: 'Standart hujjat: o‘rtacha chetlar, tik varaq va eng keng tarqalgan format.', ex: 'To‘g‘ri: Normal, Portrait, A4 — standart hujjat sozlamalari.', topic: 'Margins' },
  { t: 'Keng jadval uchun sahifa yo‘nalishini moslang.', start: { m: 'normal', o: 'portrait', s: 'A4' }, goal: { o: 'landscape' }, hint: 'Jadval kengligi uchun varaq qanday bo‘lishi kerak?', ex: 'Keng jadval Landscape (yotiq) varaqda yaxshi sig‘adi.', topic: 'Orientation' },
  { t: 'Matn chetlardan juda uzoq joylashgan. Oddiy maydonlarga qaytaring.', start: { m: 'wide', o: 'portrait', s: 'A4' }, goal: { m: 'normal' }, hint: 'Margins ichida “oddiy” ma’nosini beruvchi variant bor.', ex: 'Normal — barcha chetlar 2,54 sm.', topic: 'Margins' },
  { t: 'Matn uchun kattaroq yon maydonlar kerak.', start: { m: 'normal', o: 'portrait', s: 'A4' }, goal: { m: 'wide' }, hint: 'Chap va o‘ng maydonlar 5,08 sm bo‘lgan variantni qidiring.', ex: 'Wide: yon maydonlar 5,08 sm, yuqori va pastki 2,54 sm.', topic: 'Margins' },
  { t: 'Hujjatni odatiy A4 formatiga keltiring.', start: { m: 'normal', o: 'portrait', s: 'Letter' }, goal: { s: 'A4' }, hint: 'A4 o‘lchami 210 × 297 mm.', ex: 'A4 = 210 × 297 mm — maktab va ofis uchun odatiy format.', topic: 'Size' }
];
const T2 = [
  { t: 'Matn qog‘ozning chetiga deyarli tegib turibdi. Hujjatdagi xato(lar)ni belgilang.', doc: 'tight', ans: [0], hl: 0, hint: 'Matn bilan qog‘oz cheti orasidagi bo‘sh joyga qarang.', ex: 'Margins juda kichik: matn chetga yaqin va chop etishda kesilib qolishi mumkin.', topic: 'Margins' },
  { t: 'Haftalik dars jadvali (keng jadval) tik varaqda chop etilmoqda.', doc: 'table', ans: [1], hl: 0, hint: 'Jadval varaq kengligiga sig‘ayaptimi?', ex: 'Keng jadval Portrait varaqdan chiqib ketgan. Landscape qulayroq.', topic: 'Orientation' },
  { t: 'Maktab xati tayyorlanmoqda. Varaq yo‘nalishiga e’tibor bering.', doc: 'orient', ans: [2], hl: 0, hint: 'Oddiy matnli xat odatda qanday varaqda bo‘ladi?', ex: 'Oddiy xat uchun odatda Portrait (tik) yo‘nalish tanlanadi; bu yerda Landscape qo‘yilgan.', topic: 'Orientation' },
  { t: 'Hujjat A4 formatida chop etilishi kerak. Rasmda nima noto‘g‘ri?', doc: 'size', ans: [3], hl: 0, hint: 'Varaq tagidagi o‘lcham yozuviga qarang.', ex: 'Varaq A5 (148 × 210 mm), topshiriq esa A4 (210 × 297 mm) talab qiladi.', topic: 'Size' },
  { t: 'Referat 1 sahifa bo‘lishi kerak edi, lekin 2-sahifada ham matn bor.', doc: 'spill', ans: [4], hl: 1, hint: '2-sahifada nima bor? Sababini o‘ylab ko‘ring.', ex: 'Matn keyingi sahifaga o‘tib ketgan. ' + SPILL, topic: 'Xatolarni topish' },
  { t: 'Hujjat oxirida bo‘sh sahifa chiqdi. Muammoni toping.', doc: 'blank', ans: [5], hl: 1, hint: '2-sahifada matn bormi?', ex: 'Ortiqcha bo‘sh sahifa bor. ' + SPILL, topic: 'Xatolarni topish' },
  { t: 'Bu hujjatda ikkita xato bor: A4 kerak edi va matn chetga yopishgan. Ikkalasini belgilang.', doc: 'two', ans: [0, 3], hl: 0, hint: 'Varaq o‘lchami va matn bilan chet orasini tekshiring.', ex: 'Matn chetga yaqin (Margins) va varaq A5 (Size) — ikkalasi ham tuzatilishi kerak.', topic: 'Xatolarni topish' }
];
const T3 = [
  { t: 'Dars jadvali 1 ta Landscape sahifada chop etilishi kerak. Hujjatni Print Preview’da tekshiring.', doc: 'table', truth: [1, 0, 1, 0, 1, 1], hint: 'Jadval varaqdan chiqib ketganmi? Yo‘nalish mosmi?', ex: 'Jadval Portrait varaqqa sig‘mayapti: yo‘nalish va joylashuv bandlari muammoli.', topic: 'Print Preview' },
  { t: 'Referat A4, Portrait, 1 sahifada chop etilishi kerak. Tekshiring.', doc: 'spill', truth: [1, 1, 1, 0, 1, 0], hint: 'Sahifalar sonini kutilgan natija bilan solishtiring.', ex: 'Matn 2-sahifaga o‘tgan: joylashuv va sahifalar soni muammoli. ' + SPILL, topic: 'Print Preview' },
  { t: 'A4, Portrait, 1 sahifali hujjat. Hammasi joyidami?', doc: 'good', truth: [1, 1, 1, 1, 1, 1], hint: 'Har bir bandni maketga qarab tekshiring.', ex: 'Barcha bandlar to‘g‘ri.', topic: 'Print Preview' }
];
const T4 = [
  { q: 'Qaysi atama sahifa chetlaridagi bo‘sh joylarni sozlaydi?', o: ['Margins', 'Orientation', 'Size', 'Print Preview'], hint: 'Matn bilan qog‘oz cheti orasidagi masofa.', ex: 'Margins — sahifa chetlaridagi bo‘sh joylar.', topic: 'Margins' },
  { q: 'Keng jadval uchun qaysi yo‘nalish qulay?', o: ['Landscape', 'Portrait', 'A4', 'Normal'], hint: 'Yotiq varaq kengroq.', ex: 'Landscape (yotiq) varaq keng jadvalga mos.', topic: 'Orientation' },
  { q: 'Chap va o‘ng maydonlar 5,08 sm, yuqori va pastki 2,54 sm. Bu qaysi Margins?', o: ['Wide', 'Normal', 'Narrow', 'Landscape'], hint: 'Yon maydonlar eng katta variant.', ex: 'Wide: yon maydonlar 5,08 sm.', topic: 'Margins' },
  { q: 'A4 formati o‘lchami qaysi?', o: ['210 × 297 mm', '148 × 210 mm', '297 × 420 mm', '100 × 150 mm'], hint: 'Eng keng tarqalgan ofis qog‘ozi.', ex: 'A4 = 210 × 297 mm.', topic: 'Size' },
  { q: 'Rasmdagi hujjatda qanday xato bor?', doc: 'tight', o: ['Matn sahifa chetiga juda yaqin', 'Sahifa A4 emas', 'Ortiqcha bo‘sh sahifa bor', 'Sahifa Landscape'], hint: 'Matn bilan chet orasini ko‘ring.', ex: 'Matn qog‘oz chetiga juda yaqin — Margins kichik.', topic: 'Xatolarni topish' },
  { q: 'Print Preview nima vazifani bajaradi?', o: ['Hujjatning chop etishdan oldingi ko‘rinishini ko‘rsatadi', 'Hujjatni printerga majburan yuboradi', 'Matn shriftini o‘zgartiradi', 'Hujjatni o‘chiradi'], hint: 'Preview — “oldindan ko‘rish”.', ex: 'Print Preview chop etishdan oldin yakuniy ko‘rinishni tekshirishga yordam beradi.', topic: 'Print Preview' },
  { q: 'Chop etishdan oldin eng to‘g‘ri qadam qaysi?', o: ['File → Print oynasida Print Preview’ni tekshirish', 'Darhol chop etish', 'Barcha matnni o‘chirish', 'Sahifa sonini ko‘rmaslik'], hint: 'Avval natijani ko‘rib oling.', ex: 'Print Preview orqali chetlar, yo‘nalish, o‘lcham va sahifalar soni tekshiriladi.', topic: 'Print Preview' },
  { q: 'Hujjat oxirida ortiqcha bo‘sh sahifa chiqdi. Eng mos yechim?', o: ['Sababini tekshirish (ortiqcha Enter, sahifa uzilishi)', 'Margins’ni doim Wide qilish', 'Orientation’ni doim o‘zgartirish', 'Hech narsa qilmaslik'], hint: 'Sozlamalar har doim yordam bermaydi.', ex: 'Avval sabab topiladi; Margins yoki Orientation bunga har doim yordam bermaydi.', topic: 'Xatolarni topish' }
];

/* ===== Navigatsiya ===== */
function show(id) {
  stopTimer(); $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo(0, 0);
  if (id === 'home') homeInfo(); if (id === 'review') buildReview(); if (id === 'match') initMatch();
}
function medals(el, got) {
  el.replaceChildren(); Object.keys(BADGES).forEach(k => { const m = h('span', 'medal' + (got.includes(k) ? '' : ' off'), BADGES[k][0] + ' ' + BADGES[k][1]); m.title = got.includes(k) ? 'Olingan' : 'Hali olinmagan'; el.append(m); });
}
function homeInfo() {
  $('#best').textContent = mem.best || 0; $('#stg').textContent = mem.stages || 0;
  $('#lastR').textContent = mem.last ? mem.last.score + ' ball (' + mem.last.pct + '%)' : '—'; medals($('#medals'), mem.badges || []);
}

/* ===== Sahifa maketi ===== */
function page(o) {
  o = { w: 210, h: 297, p: N4, k: .8, fill: 1, ...o };
  const f = h('figure', 'fig'), e = h('div', 'page'), inner = h('div', 'pg-in');
  e.style.width = o.w * o.k + 'px'; e.style.height = o.h * o.k + 'px'; e.style.padding = o.p.map(v => v * o.k + 'px').join(' ');
  const n = Math.floor((o.h - o.p[0] - o.p[2]) * o.k * (o.table ? o.fill * .8 : o.fill) / 9);
  if (o.table) { const t = h('div', 'pg-table', 'Keng jadval →'); t.style.width = o.w * o.k * 1.5 + 'px'; inner.append(t); }
  for (let i = 0; i < n; i++) { const l = h('i', 'ln'); l.style.width = (i % 5 === 4 ? 60 : 100) + '%'; inner.append(l); }
  e.append(inner);
  const nm = { '210x297': 'A4', '148x210': 'A5', '216x279': 'Letter' }[[o.w, o.h].sort((a, b) => a - b).join('x')] || '';
  f.append(e, h('figcaption', '', o.cap || (o.w > o.h ? 'Landscape' : 'Portrait') + ' • ' + nm + ' • ' + o.w + '×' + o.h + ' mm'));
  return f;
}
function docEl(kind, k) { const d = h('div', 'docs'); DOCS[kind].forEach(o => d.append(page({ k, ...o }))); return d; }

/* ===== Takrorlash bo‘limi ===== */
function buildReview() {
  const R = [
    ['Margins', 'Matn bilan sahifa cheti orasidagi bo‘sh joy.', [{ p: MG.normal }]],
    ['Orientation', 'Sahifa yo‘nalishi: tik yoki yotiq.', [{}, { w: 297, h: 210 }]],
    ['Portrait', 'Tik (baland va tor) yo‘nalish.', [{}]],
    ['Landscape', 'Yotiq (keng va past) yo‘nalish.', [{ w: 297, h: 210 }]],
    ['Size', 'Qog‘oz o‘lchami: A4, A5, Letter...', [{}, { w: 148, h: 210 }]],
    ['A4', '210 × 297 mm format.', [{}]],
    ['Print Preview', 'Hujjatning chop etishdan oldingi ko‘rinishi (File → Print).', [{ fill: .7 }]]
  ];
  const L = $('#revList'); L.replaceChildren();
  R.forEach(([n, d, pg]) => { const c = h('div', 'card rev'); c.append(h('h3', '', n), h('p', '', d)); const w = h('div', 'docs'); pg.forEach(o => w.append(page({ k: .3, ...o }))); c.append(w); L.append(c); });
}

/* ===== Mosini top ===== */
const PAIRS = [['Margins', 'Sahifa chetlaridagi bo‘sh joylarni sozlaydi.'], ['Orientation', 'Sahifa yo‘nalishini belgilaydi.'], ['Size', 'Qog‘oz o‘lchamini belgilaydi.'], ['Print Preview', 'Chop etishdan oldingi ko‘rinishni ko‘rsatadi.'], ['Portrait', 'Tik sahifa yo‘nalishi.'], ['Landscape', 'Yotiq sahifa yo‘nalishi.']];
let M;
function initMatch() {
  M = { sel: null, done: 0, tries: 0 }; $('#mMsg').className = 'fb'; $('#mMsg').textContent = '';
  const A = $('#mTerms'), B = $('#mDefs'); A.replaceChildren(); B.replaceChildren();
  const mk = (i, txt, side) => {
    const b = h('button', 'mbtn', txt); b.dataset.i = i; b.dataset.side = side;
    b.onclick = () => {
      if (M.sel && M.sel.dataset.side !== side) {
        const s = M.sel; M.sel = null; s.classList.remove('sel'); M.tries++;
        if (s.dataset.i === b.dataset.i) {
          [s, b].forEach(x => { x.classList.add('ok'); x.disabled = true; }); M.done++;
          if (M.done === PAIRS.length) { const m = $('#mMsg'); m.className = 'fb ok'; m.textContent = '🎉 Barcha juftliklar topildi! Urinishlar: ' + M.tries; }
        } else { [s, b].forEach(x => x.classList.add('shake')); setTimeout(() => [s, b].forEach(x => x.classList.remove('shake')), 450); }
      } else { if (M.sel) M.sel.classList.remove('sel'); M.sel = b; b.classList.add('sel'); }
    };
    return b;
  };
  shuffle(PAIRS.map((_, i) => i)).forEach(i => A.append(mk(i, PAIRS[i][0], 't')));
  shuffle(PAIRS.map((_, i) => i)).forEach(i => B.append(mk(i, PAIRS[i][1], 'd')));
}

/* ===== O‘yin mexanikasi ===== */
let G, cur, tm = null;
function stopTimer() { clearInterval(tm); tm = null; }
function startTimer(sec) { stopTimer(); let s = sec; $('#hTime').textContent = s + ' s'; tm = setInterval(() => { s--; $('#hTime').textContent = s + ' s'; if (s <= 0) { stopTimer(); timeout(); } }, 1000); }
function newGame(mode) {
  stopTimer(); const T = [];
  [[1, T1, 'cfg'], [2, T2, 'err'], [3, T3, 'chk'], [4, T4, 'mcq']].forEach(([s, a, kind]) => shuffle(a).forEach(x => T.push({ ...x, stage: s, kind, att: 0, fin: false, hinted: false, good: false, first: false })));
  G = { mode, T, i: 0, score: 0, done: 0, ok: 0, log: [], badges: (mem.badges || []).slice() };
  show('game'); loadTask();
}
function hud() {
  $('#hScore').textContent = G.score; $('#hDone').textContent = G.done + '/' + G.T.length; $('#hOk').textContent = G.ok;
  $('#hStage').textContent = cur.stage + '/4'; $('#bar').value = G.done / G.T.length * 100;
}
function loadTask() {
  cur = G.T[G.i]; hud();
  ({ cfg: rCfg, err: rErr, chk: rChk, mcq: rMcq })[cur.kind]();
  if (G.mode === 'challenge') startTimer(cur.stage === 4 ? 25 : 60); else { stopTimer(); $('#hTime').textContent = '∞'; }
}
function frame() {
  const st = $('#stage'); st.replaceChildren(); st.className = cur.kind === 'mcq' ? 'one' : '';
  const L = h('div', 'card'), R = h('div', 'card prevbox'), same = G.T.filter(x => x.stage === cur.stage);
  L.append(h('p', 'tag', cur.stage + '-bosqich: ' + STG[cur.stage - 1] + ' (' + (same.indexOf(cur) + 1) + '/' + same.length + ')'), h('h2', '', cur.t || cur.q));
  const fb = h('div', 'fb'); fb.setAttribute('role', 'status'); st.append(L); if (cur.kind !== 'mcq') st.append(R);
  return { L, R, fb };
}
function say(fb, c, m) { fb.className = 'fb ' + c; fb.textContent = m; }
function bar(L, fb, check) {
  const a = h('div', 'actions');
  if (check) { const b = h('button', 'btn primary', 'Tekshirish'); b.onclick = () => submit(check(), fb); a.append(b); }
  const hb = h('button', 'btn ghost', '💡 Maslahat'); hb.onclick = () => { if (cur.fin) return; cur.hinted = true; say(fb, 'hint', 'Maslahat (bu topshiriq balli 50% ga kamayadi): ' + cur.hint); };
  const nb = h('button', 'btn green', 'Keyingisi →'); nb.hidden = true; nb.onclick = next; cur.nb = nb;
  a.append(hb, nb); L.append(a, fb); cur.fb = fb;
}
function ansText(T) {
  return T.kind === 'cfg' ? Object.entries(T.goal).map(([k, v]) => MN[k] + ': ' + (LB[v] || v)).join(', ')
    : T.kind === 'err' ? T.ans.map(i => ERR[i]).join('; ')
    : T.kind === 'chk' ? T.truth.map((v, i) => (i + 1) + '-band: ' + (v ? 'to‘g‘ri' : 'muammo')).join(', ') : T.o[0];
}
function logMistake() { if (cur.logged) return; cur.logged = true; G.log.push({ t: cur.t || cur.q, a: ansText(cur), ex: cur.ex, stage: cur.stage }); }
function submit(res, fb) {
  if (cur.fin) return;
  if (res.skip) { say(fb, 'hint', res.msg); return; }
  if (res.ok) {
    cur.fin = true; cur.good = true; cur.first = cur.att === 0; stopTimer();
    const pts = Math.round([100, 70, 40][Math.min(cur.att, 2)] * (cur.hinted ? .5 : 1));
    G.score += pts; G.done++; G.ok++; say(fb, 'ok', '✅ To‘g‘ri! ' + res.msg + ' (+' + pts + ' ball)');
    cur.nb.hidden = false; cur.nb.focus(); if (res.after) res.after(); award();
  } else { cur.att++; logMistake(); say(fb, 'bad', '❌ ' + res.msg); }
  hud();
}
function timeout() {
  if (cur.fin) return; cur.fin = true; G.done++; logMistake();
  say(cur.fb, 'bad', '⏰ Vaqt tugadi! Bu savol uchun 0 ball. To‘g‘ri javob: ' + ansText(cur) + '. ' + cur.ex);
  cur.nb.hidden = false; cur.nb.focus(); award(); hud();
}
function next() { stopTimer(); G.i++; if (G.i >= G.T.length) finish(); else loadTask(); }
function award() {
  const f = s => G.T.filter(t => t.stage === s), fin = a => a.every(t => t.fin);
  const c = { first: G.ok >= 1, s1: fin(f(1)), det: f(2).filter(t => t.good).length >= 5, chk: fin(f(3)), master: G.T.every(t => t.fin) };
  Object.keys(c).forEach(k => { if (c[k] && !G.badges.includes(k)) { G.badges.push(k); toast('🏅 Yutuq: ' + BADGES[k][1]); } });
  save({ badges: G.badges, stages: Math.max(mem.stages || 0, [1, 2, 3, 4].filter(s => fin(f(s))).length) });
}
function finish() {
  stopTimer(); const tot = G.T.length, pct = Math.round(G.ok / tot * 100);
  save({ best: Math.max(mem.best || 0, G.score), last: { score: G.score, pct } });
  const topics = {}; G.T.forEach(t => { const o = topics[t.topic] = topics[t.topic] || [0, 0]; o[1]++; if (t.first) o[0]++; });
  const good = Object.keys(topics).filter(k => topics[k][0] / topics[k][1] >= .7), weak = Object.keys(topics).filter(k => topics[k][0] / topics[k][1] < .7);
  $('#rScore').textContent = G.score; $('#rOk').textContent = G.ok; $('#rTot').textContent = tot; $('#rPct').textContent = pct;
  $('#rMsg').textContent = pct >= 90 ? 'Print Master — a’lo!' : pct >= 75 ? 'Ajoyib natija!' : pct >= 50 ? 'Yaxshi, yana mashq qiling!' : 'Mavzuni takrorlab, yana urinib ko‘ring!';
  $('#rGood').textContent = good.join(', ') || '—'; $('#rWeak').textContent = weak.join(', ') || 'Hammasi a’lo!';
  medals($('#rMedals'), G.badges); show('results');
}

/* ===== Topshiriq turlari ===== */
function group(leg, name, opts, val, cb) {
  const f = h('fieldset', 'grp'); f.append(h('legend', '', leg));
  shuffle(opts).forEach(o => {
    const l = h('label', 'opt'), r = document.createElement('input'); r.type = 'radio'; r.name = name; r.checked = o[0] === val; r.onchange = () => cb(o[0]);
    const s = h('span', '', o[1]); if (o[2]) s.append(h('small', '', o[2])); l.append(r, s); f.append(l);
  });
  return f;
}
function rCfg() {
  const { L, R, fb } = frame(), c = { ...cur.start };
  const draw = () => {
    const [a, b] = c.o === 'portrait' ? SZ[c.s] : [SZ[c.s][1], SZ[c.s][0]];
    R.replaceChildren(page({ w: a, h: b, p: MG[c.m], k: .9, cap: LB[c.o] + ' • ' + c.s + ' (' + a + '×' + b + ' mm) • Margins: ' + LB[c.m] }));
  };
  L.append(
    group('Margins — sahifa chetlari', 'm', [['normal', 'Normal', '2,54 sm'], ['narrow', 'Narrow', '1,27 sm'], ['wide', 'Wide', 'yon 5,08 sm']], c.m, v => { c.m = v; draw(); }),
    group('Orientation — sahifa yo‘nalishi', 'o', [['portrait', 'Portrait', 'tik'], ['landscape', 'Landscape', 'yotiq']], c.o, v => { c.o = v; draw(); }),
    group('Size — qog‘oz o‘lchami', 's', [['A4', 'A4', '210 × 297 mm'], ['A5', 'A5', '148 × 210 mm'], ['Letter', 'Letter', '216 × 279 mm']], c.s, v => { c.s = v; draw(); }));
  draw();
  bar(L, fb, () => {
    const bad = Object.keys(cur.goal).filter(k => c[k] !== cur.goal[k]);
    return bad.length ? { ok: false, msg: 'Noto‘g‘ri parametr: ' + bad.map(k => MN[k]).join(', ') + '. Vazifa matniga yana bir bor qarang.' } : { ok: true, msg: cur.ex };
  });
}
function rErr() {
  const { L, R, fb } = frame(), d = docEl(cur.doc, .7), pgs = [...d.children]; R.append(h('p', 'tag', 'Hujjat maketi'), d);
  const f = h('fieldset', 'grp'), bx = []; f.append(h('legend', '', 'Muammo(lar)ni belgilang:'));
  shuffle(ERR.map((_, i) => i)).forEach(i => { const l = h('label', 'opt'), c = document.createElement('input'); c.type = 'checkbox'; c.value = i; bx.push(c); l.append(c, h('span', '', ERR[i])); f.append(l); });
  L.append(f);
  bar(L, fb, () => {
    const s = bx.filter(b => b.checked).map(b => +b.value).sort((a, b) => a - b).join(), ok = s === [...cur.ans].sort((a, b) => a - b).join();
    return ok ? { ok: true, msg: cur.ex, after: () => pgs[cur.hl].classList.add('bad') } : { ok: false, msg: 'Javob to‘liq emas yoki noto‘g‘ri. Hujjat maketiga diqqat bilan qarang' + (cur.ans.length > 1 ? ' (xatolar bir nechta).' : '.') };
  });
}
function rChk() {
  const { L, R, fb } = frame(); R.append(h('p', 'tag', '🔍 Print Preview (Microsoft Word bilan bog‘liq emas, simulyatsiya)'), docEl(cur.doc, .7));
  const st = CH.map(() => 0), ul = h('div', 'chk');
  CH.forEach((t, i) => { const b = h('button', 'chkb'), up = () => { b.textContent = ['❔ ', '✅ ', '❌ '][st[i]] + t; b.dataset.s = st[i]; }; up(); b.onclick = () => { if (cur.fin) return; st[i] = (st[i] + 1) % 3; up(); }; ul.append(b); });
  L.append(h('p', 'note', 'Har bir bandni bosing: ❔ → ✅ (to‘g‘ri) → ❌ (muammo).'), ul);
  bar(L, fb, () => {
    if (st.includes(0)) return { skip: 1, msg: 'Avval barcha bandlarni tekshiring (bosib ✅ yoki ❌ qiling).' };
    const w = cur.truth.map((v, i) => (v ? 1 : 2) !== st[i] ? i + 1 : 0).filter(Boolean);
    if (w.length) return { ok: false, msg: w.join(', ') + '-band(lar)ni qayta ko‘rib chiqing: maketga yana qarang.' };
    const all = cur.truth.every(Boolean);
    return { ok: true, msg: (all ? '🎉 Hujjat chop etishga tayyor! ' : 'Tekshiruv to‘g‘ri, lekin hujjatda kamchiliklar bor. ') + cur.ex, after: () => { if (all) { const p = h('button', 'btn primary', '🖨️ Chop etish (simulyatsiya)'); p.onclick = () => say(fb, 'ok', 'Simulyatsiya: printerga hech narsa yuborilmadi. Joriy ball: ' + G.score); L.append(p); } } };
  });
}
function rMcq() {
  const { L, fb } = frame(); if (cur.doc) L.append(docEl(cur.doc, .55));
  const box = h('div', 'mcq');
  shuffle(cur.o.map((t, i) => [t, i])).forEach(([t, i]) => {
    const b = h('button', 'mbtn', t);
    b.onclick = () => { if (cur.fin || b.disabled) return; if (i === 0) { b.classList.add('ok'); submit({ ok: true, msg: cur.ex }, fb); } else { b.classList.add('no'); b.disabled = true; submit({ ok: false, msg: 'Noto‘g‘ri. Boshqa variantni tanlang.' }, fb); } };
    box.append(b);
  });
  L.append(box); bar(L, fb, null);
}

/* ===== Hodisalar ===== */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go);
  const m = e.target.closest('[data-mode]'); if (m) newGame(m.dataset.mode);
});
$('#clear').onclick = () => {
  if (!confirm('Barcha saqlangan natijalar o‘chiriladi. Davom etasizmi?')) return;
  mem = {}; try { localStorage.removeItem(KEY); } catch (e) { toast('Saqlangan ma’lumotni o‘chirib bo‘lmadi.'); } homeInfo(); toast('Natijalar tozalandi.');
};
$('#mAgain').onclick = initMatch;
$('#rAgain').onclick = () => newGame(G ? G.mode : 'practice');
$('#rMist').onclick = () => {
  const L = $('#mList'); L.replaceChildren();
  if (!G.log.length) L.append(h('p', 'card', '🎉 Xato yo‘q — barcha savollarga to‘g‘ri javob berdingiz!'));
  G.log.forEach(x => { const c = h('div', 'card mitem'); c.append(h('b', '', x.t), h('p', '', 'To‘g‘ri javob: ' + x.a), h('p', 'note', x.ex)); L.append(c); });
  show('mistakes');
};
homeInfo();
if (!storageOk) toast('Brauzer saqlash imkoniyati o‘chiq: rekord saqlanmaydi, lekin o‘yin ishlaydi.');
